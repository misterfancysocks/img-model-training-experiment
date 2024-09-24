import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import Replicate from "replicate";
import fs from 'fs/promises';
import path from 'path';

// Configure fal client with the API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY,
});

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { images, shootId, provider = 'replicate' } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0 || !shootId) {
      return NextResponse.json({ error: 'No images or shoot ID provided' }, { status: 400 });
    }

    // Add a check to ensure the API key is set
    if (!process.env.FAL_KEY) {
      throw new Error('FAL_KEY is not set in environment variables');
    }

    const processImage = async (image: { imageBase64: string; imageUrl: string }) => {
      if (provider === 'fal') {
        return handleFalRemoveBackground(image.imageBase64, image.imageUrl, shootId);
      } else {
        return handleReplicateRemoveBackground(image.imageBase64, image.imageUrl, shootId);
      }
    };

    const outputUrls = await Promise.all(images.map(processImage));

    return NextResponse.json({ outputUrls });
  } catch (error) {
    console.error('\x1b[36m /remove-background error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to process the images' }, { status: 500 });
  }
}

async function handleFalRemoveBackground(imageBase64: string, imageUrl: string, shootId: string) {
  const buffer = Buffer.from(imageBase64, 'base64');
  const file = new File([buffer], path.basename(imageUrl), { type: 'image/png' });

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
    return await saveProcessedImage(image.url, path.basename(imageUrl), shootId);
  } else {
    throw new Error('Unexpected result format from fal.ai');
  }
}

async function handleReplicateRemoveBackground(imageBase64: string, imageUrl: string, shootId: string) {
  const prediction = await replicate.predictions.create({
    version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
    input: { image: `data:image/png;base64,${imageBase64}` },
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

  return await saveProcessedImage(output, path.basename(imageUrl), shootId);
}

async function saveProcessedImage(imageUrl: string, originalFileName: string, shootId: string) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const publicDir = path.join(process.cwd(), 'public');
  const bgRemovedDir = path.join(publicDir, 'assets', 'bg-removed', shootId);

  // Ensure the bg-removed directory exists
  await fs.mkdir(bgRemovedDir, { recursive: true });

  const fileExtension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, fileExtension);
  const newFileName = `nobg_${baseName}${fileExtension}`;
  const filePath = path.join(bgRemovedDir, newFileName);

  await fs.writeFile(filePath, buffer);

  // Return the URL path relative to the public directory
  return `/assets/bg-removed/${shootId}/${newFileName}`;
}