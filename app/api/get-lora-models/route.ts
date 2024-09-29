import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { openDb } from '@/db/db';

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY ? process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const db = await openDb();

    const loraModels = await db.all<LoraModel[]>(`
      SELECT l.id, l.personId, p.firstName, p.lastName, p.trigger, l.url
      FROM loras l
      JOIN persons p ON l.personId = p.id
      WHERE p.userId = ?
    `, userId);

    // Process each LoRA model to generate a signed URL
    const loraDetailsPromises = loraModels.map(async (model: LoraModel) => {
      const { url } = model; // Original URL from the database
      let signedUrl: string;
      let bucketName = defaultBucketName;
      let filePath = url;

      console.log('Processing LoRA model:', model.id, 'URL:', url);

      try {
        if (url.startsWith('gs://')) {
          // Handle gs:// URLs
          const gsPath = url.slice(5);
          const parts = gsPath.split('/');
          bucketName = parts[0];
          filePath = parts.slice(1).join('/');
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
      } catch (error) {
        console.error('\x1b[31mError generating signed URL for model:', model.id, '-', error instanceof Error ? error.message : String(error), '\x1b[0m');
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
  } catch (error) {
    console.error('\x1b[31mError fetching LoRA models:', error instanceof Error ? error.message : String(error), '\x1b[0m');
    // Return a 500 error if fetching models fails
    return NextResponse.json({ error: 'Failed to fetch LoRA models' }, { status: 500 });
  }
}

// Add this type definition at the end of the file
type LoraModel = {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  trigger: string;
  url: string;
};