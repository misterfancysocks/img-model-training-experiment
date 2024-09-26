import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import Replicate from "replicate";
import { Storage } from '@google-cloud/storage';

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

export async function POST(req: NextRequest) {
  try {
    const { images, personId, provider = 'replicate' } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0 || !personId) {
      return NextResponse.json({ error: 'No images or person ID provided' }, { status: 400 });
    }

    const processImage = async (image: { imageUrl: string; id: number }) => {
      // Download image from GCP
      const [imageBuffer] = await userImgBucket.file(image.imageUrl).download();

      if (provider === 'fal') {
        return handleFalRemoveBackground(imageBuffer, image.imageUrl, personId, image.id);
      } else {
        return handleReplicateRemoveBackground(imageBuffer, image.imageUrl, personId, image.id);
      }
    };

    const outputUrls = await Promise.all(images.map(processImage));

    return NextResponse.json({ outputUrls });
  } catch (error) {
    console.error('\x1b[36m /remove-background error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to process the images' }, { status: 500 });
  }
}

async function handleFalRemoveBackground(imageBuffer: Buffer, imageUrl: string, personId: string, imageId: number) {
  const file = new File([imageBuffer], imageUrl.split('/').pop() || 'image', { type: 'image/png' });
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
    return await saveProcessedImage(image.url, imageUrl, personId, imageId);
  } else {
    throw new Error('Unexpected result format from fal.ai');
  }
}

async function handleReplicateRemoveBackground(imageBuffer: Buffer, imageUrl: string, personId: string, imageId: number) {
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

  return await saveProcessedImage(output, imageUrl, personId, imageId);
}

async function saveProcessedImage(imageUrl: string, originalFileName: string, personId: string, imageId: number) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = `nobg_${originalFileName.split('/').pop()}`;
  const filePath = `${personId}/${fileName}`;

  await userImgBucket.file(filePath).save(buffer, {
    metadata: {
      contentType: 'image/png',
    },
  });

  const preprocessedUrl = `https://storage.googleapis.com/${userImgBucket.name}/${filePath}`;

  // Here, we're not saving to the database directly. 
  // Instead, we return the necessary information for the client to save later.
  return {
    imageId,
    beforeFileName: originalFileName.split('/').pop(),
    afterFileName: fileName,
    preprocessedUrl,
  };
}