import { NextRequest, NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, fileName, provider = 'replicate' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    let result;
    if (provider === 'fal') {
      result = await handleFalRemoveBackground(imageBase64, fileName);
    } else {
      result = await handleReplicateRemoveBackground(imageBase64);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('\x1b[36m /remove-background error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to process the image' }, { status: 500 });
  }
}

async function handleFalRemoveBackground(imageBase64: string, fileName: string) {
  const buffer = Buffer.from(imageBase64, 'base64');
  const file = new File([buffer], fileName, { type: 'image/png' });

  const imageUrl = await fal.storage.upload(file);

  const result = await fal.subscribe("fal-ai/imageutils/rembg", {
    input: {
      image_url: imageUrl,
      sync_mode: true,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        console.log('\x1b[36m fal.ai rembg progress:\x1b[0m');
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log('\x1b[36m /remove-background fal.ai result:\x1b[0m');
  console.log(result);

  if (typeof result === 'object' && result !== null && 'image' in result) {
    const image = result.image as { url: string; width: number; height: number };
    return { outputUrl: image.url };
  } else {
    throw new Error('Unexpected result format from fal.ai');
  }
}

async function handleReplicateRemoveBackground(imageBase64: string) {
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

  console.log('\x1b[36m /remove-background replicate result:\x1b[0m');
  console.log(output);

  return { outputUrl: output };
}