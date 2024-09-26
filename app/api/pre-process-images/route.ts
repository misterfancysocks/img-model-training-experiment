import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import Replicate from "replicate";
import { Storage } from '@google-cloud/storage';
import Anthropic from '@anthropic-ai/sdk';
import { openDb } from '@/db/db';
import fs from 'fs/promises';
import path from 'path';
import { downsizeImage } from '@/utils/image-utils';

// Configure fal client with the API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY,
});

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const userImgBucket = storage.bucket(process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME || '');

// Initialize Anthropic client
const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Read the prompt from file
const promptPath = path.join(process.cwd(), '.prompts', 'caption_person.txt');
let promptContent: string;

// Read the prompt content asynchronously
fs.readFile(promptPath, 'utf-8')
  .then(content => {
    promptContent = content;
  })
  .catch(error => {
    console.error('Error reading prompt file:', error);
    promptContent = "Describe the person in this image in detail. Focus on their physical appearance, clothing, and any notable features. Do not mention the background or setting. Be concise and factual.";
  });

export async function POST(req: NextRequest) {
  try {
    const { images, personId, provider = 'replicate' } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0 || !personId) {
      return NextResponse.json({ error: 'No images or person ID provided' }, { status: 400 });
    }

    const processImage = async (image: { imageUrl: string; id: number }) => {
      // Extract the file path from the full URL
      const filePath = new URL(image.imageUrl).pathname.split('/').pop();
      if (!filePath) {
        throw new Error(`Invalid image URL: ${image.imageUrl}`);
      }

      // Download image from GCP
      const [imageBuffer] = await userImgBucket.file(filePath).download();

      const [bgRemovalResult, captionResult] = await Promise.all([
        provider === 'fal'
          ? handleFalRemoveBackground(imageBuffer, filePath, personId, image.id)
          : handleReplicateRemoveBackground(imageBuffer, filePath, personId, image.id),
        captionImage(image.imageUrl, personId)
      ]);

      return {
        ...bgRemovalResult,
        caption: captionResult.caption,
        llm: captionResult.model
      };
    };

    const outputUrls = await Promise.all(images.map(processImage));

    return NextResponse.json({ outputUrls });
  } catch (error) {
    console.error('\x1b[36m /pre-process-images error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to process the images' }, { status: 500 });
  }
}

// Update these functions to use filePath instead of full URL
async function handleFalRemoveBackground(imageBuffer: Buffer, filePath: string, personId: string, imageId: number) {
  const file = new File([imageBuffer], filePath.split('/').pop() || 'image', { type: 'image/png' });
  const uploadedImageUrl = await fal.storage.upload(file);

  const result = await fal.subscribe("fal-ai/imageutils/rembg", {
    input: {
      image_url: uploadedImageUrl,
      sync_mode: true,
      logs: true,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        console.log('\x1b[36m fal.ai rembg progress:\x1b[0m');
        // console.log('update', update);
        update.logs.forEach(log => console.log(`\x1b[36m${log.message}\x1b[0m`));
      }
    },
  });

  if (typeof result === 'object' && result !== null && 'image' in result) {
    const image = result.image as { url: string; width: number; height: number };
    return await saveProcessedImage(image.url, filePath, personId, imageId);
  } else {
    throw new Error('Unexpected result format from fal.ai');
  }
}

async function handleReplicateRemoveBackground(imageBuffer: Buffer, filePath: string, personId: string, imageId: number) {
  const base64Image = imageBuffer.toString('base64');
  const prediction = await replicate.predictions.create({
    version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
    input: { image: `data:image/png;base64,${base64Image}` },
  });

  let output: string | null = null;
  while (!output) {
    const status = await replicate.predictions.get(prediction.id);
    if (status.status === 'succeeded') {
      output = Array.isArray(status.output) ? status.output[0] : status.output as string;
    } else if (status.status === 'failed') {
      throw new Error('Replicate processing failed');
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return await saveProcessedImage(output, filePath, personId, imageId);
}

async function captionImage(imageUrl: string, personId: number): Promise<{ caption: string; model: string }> {
  const model = "claude-3-haiku-20240307";

  try {
    // Fetch person data directly in this function
    const db = await openDb();
    const person = await db.get(`
      SELECT id, firstName, lastName, ethnicity, gender, birthdate, trigger
      FROM persons
      WHERE id = ?
    `, personId);
    await db.close();

    if (!person) {
      throw new Error('Person data not found');
    }

    const age = calculateAge(person.birthdate);

    // Extract the file name from the URL
    const fileName = new URL(imageUrl).pathname.split('/').pop();
    if (!fileName) {
      throw new Error(`Invalid image URL: ${imageUrl}`);
    }

    // Generate a signed URL for the image
    const [signedUrl] = await userImgBucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    console.log('\x1b[36mFetching image from signed URL:\x1b[0m', signedUrl);
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Downsize the image before sending it for captioning
    const base64Image = buffer.toString('base64');
    const downsizedImage = await downsizeImage(base64Image);

    // Remove the data URL prefix if present
    const base64Data = downsizedImage.replace(/^data:image\/\w+;base64,/, "");

    const anthropicResponse = await anthropicClient.messages.create({
      model: model,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: promptContent,
            },
          ],
        },
      ],
    });

    console.log('\x1b[36mAnthropic API response:\x1b[0m', anthropicResponse);

    if (anthropicResponse.content && anthropicResponse.content[0] && anthropicResponse.content[0].type === 'text') {
      const generatedCaption = anthropicResponse.content[0].text;
      const fullCaption = `${person.trigger || 'TRIGGER'}, a ${person.ethnicity}, ${age} year old, ${person.gender}. ${generatedCaption}`;
      console.log('\x1b[36mImage caption:\x1b[0m', fullCaption);
      console.log('\x1b[36mLLM:\x1b[0m', model);
      return { caption: fullCaption, model: model };
    } else {
      throw new Error('Unexpected response format from Anthropic API');
    }
  } catch (error) {
    console.error('\x1b[36mError in captionImage:\x1b[0m', error);
    throw error;
  }
}

function calculateAge(birthdate: string) {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function saveProcessedImage(imageUrl: string, originalFilePath: string, personId: string, imageId: number) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = `nobg_${originalFilePath.split('/').pop()}`;
  const filePath = `${personId}/${fileName}`;

  await userImgBucket.file(filePath).save(buffer, {
    metadata: {
      contentType: 'image/png',
    },
  });

  const preprocessedUrl = `https://storage.googleapis.com/${userImgBucket.name}/${filePath}`;

  return {
    imageId,
    beforeFileName: originalFilePath.split('/').pop(),
    afterFileName: fileName,
    preprocessedUrl,
  };
}