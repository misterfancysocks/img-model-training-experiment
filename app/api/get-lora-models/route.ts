import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { openDb } from '@/db/db';

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL!,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
  },
});

const defaultBucketName = process.env.GCP_LORA_FILES_BUCKET_NAME;

/**
 * GET /api/get-lora-models
 * 
 * Retrieves all LoRA models from the database and generates signed URLs for each model's file.
 * Supports various URL formats:
 *  - Full HTTP(S) URLs
 *  - gs:// URLs
 *  - Relative paths or filenames
 * 
 * Expected Inputs:
 * - Database entries with a 'url' field in different formats.
 * 
 * Expected Outputs:
 * - JSON array of LoRA models with an added 'signedUrl' field.
 */

export async function GET() {
  try {
    // Open a connection to the SQLite database
    const db = await openDb();

    // Fetch all LoRA models from the 'lora_models' table
    const loraModels = await db.all('SELECT * FROM loras');

    // Process each LoRA model to generate a signed URL
    const loraDetailsPromises = loraModels.map(async (model: any) => {
      let { url } = model; // Original URL from the database
      let signedUrl: string;
      let bucketName = defaultBucketName;
      let filePath = url;

      console.log('Processing LoRA model:', model.id, 'URL:', url);

      try {
        if (url.startsWith('gs://')) {
          // Handle gs:// URLs
          const gsPath = url.slice(5);
          [bucketName, ...filePath] = gsPath.split('/');
          filePath = filePath.join('/');
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          // Handle full HTTP(S) URLs
          const urlObj = new URL(url);
          bucketName = urlObj.hostname.split('.')[0];
          filePath = urlObj.pathname.slice(1); // Remove leading '/'
        } else {
          // Handle relative paths or filenames
          filePath = url;
        }

        if (!bucketName) {
          throw new Error('Default bucket name is not set in environment variables.');
        }

        console.log('\x1b[36mGenerating signed URL for:\x1b[0m', filePath, 'in bucket:', bucketName);

        // Generate the signed URL
        [signedUrl] = await storage.bucket(bucketName).file(filePath).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
        });

        console.log('\x1b[36mGenerated signed URL:\x1b[0m', signedUrl);
      } catch (error: any) {
        console.error('\x1b[31mError generating signed URL for model:', model.id, '-', error.message, '\x1b[0m');
        // Fallback to the original URL if signing fails
        signedUrl = url;
      }

      // Return the model data with the signedUrl included
      return {
        ...model,
        signedUrl,
      };
    });

    // Wait for all signed URLs to be generated
    const loraDetails = await Promise.all(loraDetailsPromises);

    // Return the list of LoRA models with signed URLs as a JSON response
    return NextResponse.json(loraDetails);
  } catch (error: any) {
    console.error('\x1b[31mError fetching LoRA models:', error.message, '\x1b[0m');
    // Return a 500 error if fetching models fails
    return NextResponse.json({ error: 'Failed to fetch LoRA models' }, { status: 500 });
  }
}