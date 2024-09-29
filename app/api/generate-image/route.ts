import { NextResponse } from 'next/server';
import * as fal from "@fal-ai/serverless-client";
import { Storage } from '@google-cloud/storage';
import { openDb } from '@/db/db';
import { getPersonDataForLora } from '@/db/queries/shoot-queries';
import path from 'path';
import fs from 'fs/promises';

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

const loraBucketName = process.env.GCP_LORA_FILES_BUCKET_NAME as string;
const generatedImagesBucketName = process.env.GCP_USER_IMG_GENERATED_BUCKET_NAME as string;

interface GenerateImageRequest {
  loraId: number;
  prompt: string;
  num_images?: number;
}

interface FalImageResponse {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

interface FalResponse {
  images: FalImageResponse[];
  seed: number;
  prompt: string;
}

const DEFAULT_IMAGE_SIZE = { width: 768, height: 1024 };
const DEFAULT_GUIDANCE_SCALE = 3.5;

export async function POST(request: Request) {
  let db;
  try {
    const { loraId, prompt, num_images = 4 } = await request.json() as GenerateImageRequest;

    console.log('Received request:', { loraId, prompt, num_images });

    if (!loraId || !prompt) {
      return NextResponse.json({ error: 'Missing required parameters: loraId and prompt are required.' }, { status: 400 });
    }

    db = await openDb();

    const loraDetails = await db.get(`
      SELECT * FROM loras WHERE id = ?
    `, [loraId]);

    console.log('LoRA details from database:', loraDetails);

    if (!loraDetails) {
      console.error('LoRA not found in database:', loraId);
      return NextResponse.json({ error: 'LoRA not found in database.' }, { status: 404 });
    }

    // Fetch person data associated with the LoRA
    const personData = await getPersonDataForLora(db, loraId);
    if (!personData) {
      console.error('Person data not found for LoRA:', loraId);
      return NextResponse.json({ error: 'Person data not found for LoRA.' }, { status: 404 });
    }

    // Determine the appropriate gender term based on age and gender
    let genderTerm;
    if (personData.gender.toLowerCase() === 'male') {
      genderTerm = personData.age < 16 ? 'boy' : 'man';
    } else {
      genderTerm = personData.age < 16 ? 'girl' : 'woman';
    }

    // Construct the full prompt with person details
    const fullPrompt = `professional, high-definition, full body shot of ${personData.trigger}, a ${personData.age} year old ${genderTerm} dressed as ${prompt} with a spooky haunted house in the background`;
    console.log('Full prompt:', fullPrompt);

    // Generate a signed URL for the LoRA file
    let signedUrl;
    try {
      let filePath = loraDetails.url;
      
      // Check if the URL is already a full GCS URL
      if (!filePath.startsWith('gs://') && !filePath.startsWith('https://')) {
        // If it's just a file path, construct the full GCS path
        filePath = `gs://${loraBucketName}/${filePath}`;
      }

      // Extract the file path from the full URL
      const filePathMatch = filePath.match(/^(?:gs:\/\/|https:\/\/storage\.googleapis\.com\/)([^/]+)\/(.+)$/);
      if (!filePathMatch) {
        throw new Error('Invalid LoRA file URL format.');
      }
      const [, bucketName, objectPath] = filePathMatch;

      console.log('Attempting to generate signed URL for file:', objectPath, 'in bucket:', bucketName);

      [signedUrl] = await storage.bucket(bucketName).file(objectPath).getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
      });

      console.log('Generated signed URL:', signedUrl);
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return NextResponse.json({ error: 'Failed to generate signed URL for LoRA file.' }, { status: 500 });
    }

    // Prepare Fal.ai API request
    console.log('Preparing Fal.ai API request with:', {
      prompt: fullPrompt, // Use the full prompt here
      loras: [{ path: signedUrl, scale: 1.0 }],
      num_images,
      image_size: DEFAULT_IMAGE_SIZE,
    });

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: fullPrompt, // Use the full prompt here
        loras: [{ path: signedUrl, scale: 1.0 }],
        num_images,
        image_size: DEFAULT_IMAGE_SIZE,
        sync_mode: true,
        guidance_scale: DEFAULT_GUIDANCE_SCALE
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Generation progress:", update.logs.map(log => log.message).join(", "));
        }
      },
    }) as FalResponse;

    //console.log('Fal.ai API response:', result);

    // Print the URLs returned by Fal.ai
    // console.log('URLs returned by Fal.ai:');
    // result.images.forEach((image, index) => {
    //   console.log(`Image ${index + 1}: ${image.url}`);
    // });

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated by Fal.ai.');
    }

    // Create local directory for generated images
    const localDir = path.join(process.cwd(), 'public', 'generated-images', loraId.toString());
    await fs.mkdir(localDir, { recursive: true });

    // Process and upload generated images
    const uploadedImages = await Promise.all(result.images.map(async (image, index) => {
      try {
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${image.url}`);
        }
        const buffer = await response.arrayBuffer();

        const fileExtension = image.content_type.split('/')[1];
        const fileName = `generated_${Date.now()}_${index}.${fileExtension}`;
        const file = storage.bucket(generatedImagesBucketName).file(fileName);

        // Save to Google Cloud Storage
        await file.save(Buffer.from(buffer), {
          metadata: {
            contentType: image.content_type,
          },
        });

        // Save locally
        const localFilePath = path.join(localDir, fileName);
        await fs.writeFile(localFilePath, Buffer.from(buffer));

        const fullUrl = `https://storage.googleapis.com/${generatedImagesBucketName}/${fileName}`;

        // Generate a signed URL for the uploaded image
        const [signedUrl] = await storage.bucket(generatedImagesBucketName).file(fileName).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
        });

        return {
          url: signedUrl, // This is the signed URL for immediate use
          fullUrl, // This is the full GCS URL
          bucket: generatedImagesBucketName,
          path: fileName,
          width: image.width,
          height: image.height,
          content_type: image.content_type,
        };
      } catch (imageError) {
        console.error(`Error processing image at index ${index}:`, imageError);
        throw imageError;
      }
    }));

    // Start a transaction for inserting generated images
    await db.run("BEGIN TRANSACTION");
    try {
      for (const image of uploadedImages) {
        await db.run(`
          INSERT INTO generated_images (loraId, fullUrl, bucket, path, prompt, seed)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [loraId, image.fullUrl, image.bucket, image.path, fullPrompt, result.seed]);
      }
      // Commit the transaction after all inserts succeed
      await db.run("COMMIT");
    } catch (insertError) {
      // Rollback the transaction in case of any failure
      await db.run("ROLLBACK");
      console.error('Error inserting generated images into the database:', insertError);
      return NextResponse.json({ error: 'Failed to save generated images to the database.' }, { status: 500 });
    }

    console.log('Successfully saved images:', uploadedImages);

    return NextResponse.json({
      images: uploadedImages,
      seed: result.seed,
      prompt: result.prompt,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred while generating or saving images.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    if (db) {
      try {
        await db.close();
        console.log('Database connection closed.');
      } catch (closeError) {
        console.error('Error closing the database connection:', closeError);
      }
    }
  }
}