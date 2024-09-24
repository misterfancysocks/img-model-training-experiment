import { NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import { Storage } from '@google-cloud/storage';

// Initialize Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME as string;

export async function POST(request: Request) {
  try {
    const { prompt, loras, num_images = 4, image_size = "portrait_4_3" } = await request.json();

    if (!prompt || !loras || loras.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt,
        loras,
        num_images,
        image_size,
        sync_mode: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generation progress:", update.logs.map(log => log.message).join(", "));
        }
      },
    });

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated');
    }

    // Upload generated images to Google Cloud Storage
    const uploadedImages = await Promise.all(result.images.map(async (image, index) => {
      const response = await fetch(image.url);
      const buffer = await response.arrayBuffer();

      const fileName = `generated_${Date.now()}_${index}.${image.content_type.split('/')[1]}`;
      const file = storage.bucket(bucketName).file(fileName);

      await file.save(Buffer.from(buffer), {
        metadata: {
          contentType: image.content_type,
        },
      });

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // URL expires in 7 days
      });

      return {
        url,
        width: image.width,
        height: image.height,
        content_type: image.content_type,
      };
    }));

    return NextResponse.json({
      images: uploadedImages,
      seed: result.seed,
      prompt: result.prompt,
    });

  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 });
  }
}