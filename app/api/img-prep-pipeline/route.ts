import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import Anthropic from '@anthropic-ai/sdk';
import { openDb } from '@/db/db';
import fs from 'fs/promises';
import path from 'path';
import { getBucket, generateSignedUrl, uploadFile } from '@/utils/gcs';

// Configure fal client with the API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY,
});

const userImgBucket = getBucket(process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME || '');

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
    console.log('\x1b[36m[img-prep-pipeline] Starting image preparation pipeline\x1b[0m');
    
    const { personId } = await req.json();

    if (!personId) {
      console.log('\x1b[31m[img-prep-pipeline] Error: No person ID provided\x1b[0m');
      return NextResponse.json({ error: 'No person ID provided' }, { status: 400 });
    }

    console.log(`\x1b[36m[img-prep-pipeline] Processing images for personId: ${personId}\x1b[0m`);

    // Fetch images for the person
    const db = await openDb();
    const images = await db.all(`
      SELECT id, uuid, sanitizedFileName, bucket, originalGcsObjectUrl, modifiedGcsObjectUrl
      FROM images
      WHERE personId = ? AND isDeleted = 0
    `, personId);

    console.log(`\x1b[36m[img-prep-pipeline] Found ${images.length} images to process\x1b[0m`);

    const processImage = async (image: any) => {
      console.log(`\x1b[36m[img-prep-pipeline] Processing image: ${image.id}\x1b[0m`);
      
      try {
        const imageUrl = image.modifiedGcsObjectUrl || image.originalGcsObjectUrl;
        const fileName = imageUrl.split('/').pop()!;
        const signedUrl = await generateSignedUrl(userImgBucket, fileName);

        console.log(`\x1b[36m[img-prep-pipeline] Generated signed URL for image: ${image.id}\x1b[0m`);

        // Remove background
        console.log(`\x1b[36m[img-prep-pipeline] Removing background for image: ${image.id}\x1b[0m`);
        const result = await fal.subscribe("fal-ai/imageutils/rembg", {
          input: {
            image_url: signedUrl,
            sync_mode: true,
          },
        });

        if (typeof result !== 'object' || !result || !('image' in result)) {
          console.log('\x1b[31m[img-prep-pipeline] Error: Unexpected result format from fal.ai\x1b[0m');
          console.log('\x1b[31m[img-prep-pipeline] Result:', JSON.stringify(result, null, 2), '\x1b[0m');
          throw new Error('Unexpected result format from fal.ai');
        }

        const processedImageUrl = (result.image as { url: string }).url;
        console.log(`\x1b[36m[img-prep-pipeline] Background removed for image: ${image.id}\x1b[0m`);

        // Fetch the processed image and convert to base64
        const response = await fetch(processedImageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // Generate caption using Anthropic
        console.log(`\x1b[36m[img-prep-pipeline] Generating caption for image: ${image.id}\x1b[0m`);
        const person = await db.get(`
          SELECT id, firstName, lastName, ethnicity, gender, birthdate, trigger
          FROM persons
          WHERE id = ?
        `, personId);

        if (!person) {
          console.log('\x1b[31m[img-prep-pipeline] Error: Person data not found\x1b[0m');
          throw new Error('Person data not found');
        }

        const age = calculateAge(person.birthdate);

        const anthropicResponse = await anthropicClient.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: base64Image,
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

        let caption = '';
        if (anthropicResponse.content && anthropicResponse.content[0] && anthropicResponse.content[0].type === 'text') {
          const generatedCaption = anthropicResponse.content[0].text;
          caption = `${person.trigger || 'TRIGGER'}, a ${person.ethnicity}, ${age} year old, ${person.gender}. ${generatedCaption}`;
          console.log(`\x1b[36m[img-prep-pipeline] Caption generated for image: ${image.id}\x1b[0m`);
        } else {
          console.log('\x1b[31m[img-prep-pipeline] Error: Unexpected response format from Anthropic API\x1b[0m');
          throw new Error('Unexpected response format from Anthropic API');
        }

        // Upload processed image to GCS
        console.log(`\x1b[36m[img-prep-pipeline] Uploading processed image to GCS: ${image.id}\x1b[0m`);
        const newFileName = `nobg_${image.uuid}_${image.sanitizedFileName}`;
        const preprocessedUrl = await uploadFile(
          userImgBucket,
          newFileName,
          Buffer.from(base64Image, 'base64'),
          'image/png'
        );

        // Save preprocessed image data
        console.log(`\x1b[36m[img-prep-pipeline] Saving preprocessed image data to database: ${image.id}\x1b[0m`);
        await db.run(`
          INSERT INTO preprocessed_images (imageId, beforeFileName, afterFileName, preprocessedUrl, caption, llm)
          VALUES (?, ?, ?, ?, ?, ?)
        `, image.id, image.sanitizedFileName, newFileName, preprocessedUrl, caption, "claude-3-haiku-20240307");

        return {
          imageId: image.id,
          preprocessedUrl,
          caption,
        };
      } catch (error) {
        console.error(`\x1b[31m[img-prep-pipeline] Error processing image ${image.id}:\x1b[0m`, error);
        if (error instanceof Error) {
          console.error(`\x1b[31m[img-prep-pipeline] Error message: ${error.message}\x1b[0m`);
          console.error(`\x1b[31m[img-prep-pipeline] Error stack: ${error.stack}\x1b[0m`);
        }
        throw error;
      }
    };

    const processedImages = await Promise.allSettled(images.map(processImage));

    const successfulImages = processedImages
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const failedImages = processedImages
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    await db.close();

    console.log(`\x1b[36m[img-prep-pipeline] Image preparation pipeline completed for personId: ${personId}\x1b[0m`);
    console.log(`\x1b[36m[img-prep-pipeline] Successfully processed: ${successfulImages.length} images\x1b[0m`);
    console.log(`\x1b[36m[img-prep-pipeline] Failed to process: ${failedImages.length} images\x1b[0m`);

    if (failedImages.length > 0) {
      console.error('\x1b[31m[img-prep-pipeline] Errors encountered during processing:\x1b[0m', failedImages);
    }

    return NextResponse.json({ 
      processedImages: successfulImages,
      failedImages: failedImages.length,
      totalImages: images.length
    });
  } catch (error) {
    console.error('\x1b[31m[img-prep-pipeline] Error in img-prep-pipeline:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
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