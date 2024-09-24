import { NextResponse } from 'next/server';
import { openDb } from '@/db/db';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCP_LORA_FILES_BUCKET_NAME as string;

export async function GET(request: Request) {
  const db = await openDb();
  try {
    // Fetch LoRA models from the database
    const loraModels = await db.all(`
      SELECT l.id, l.personId, l.url, l.trainedOn, l.service, l.model, l.modelVersion,
             p.firstName, p.lastName, p.trigger
      FROM loras l
      JOIN persons p ON l.personId = p.id
      ORDER BY l.trainedOn DESC
    `);

    // Generate signed URLs for each LoRA model
    const loraModelsWithSignedUrls = await Promise.all(loraModels.map(async (lora) => {
      const file = storage.bucket(bucketName).file(lora.url.split('/').pop() as string);
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
      });

      return {
        ...lora,
        signedUrl,
      };
    }));

    return NextResponse.json(loraModelsWithSignedUrls);
  } catch (error) {
    console.error('Error fetching LoRA models:', error);
    return NextResponse.json({ error: 'Failed to fetch LoRA models' }, { status: 500 });
  } finally {
    await db.close();
  }
}