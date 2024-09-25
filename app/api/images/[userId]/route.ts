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

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  console.log('Fetching images for user ID:', userId, 'page:', page, 'limit:', limit);
  const db = await openDb();

  try {
    const images = await db.all(`
      SELECT gi.id, gi.fullUrl, gi.seed, gp.userInput, gp.fullPrompt, gi.prompt,gi.bucket, gi.path
      FROM persons p
      JOIN loras l ON p.id = l.personId
      JOIN generated_images gi ON gi.loraId = l.id
      LEFT JOIN generation_prompts gp ON gi.generatedPromptId = gp.id
      WHERE p.userId = ?
      ORDER BY gi.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    console.log('Fetched images:', images);

    // Generate signed URLs for each image
    const imagesWithSignedUrls = await Promise.all(images.map(async (image) => {
      try {
        const [signedUrl] = await storage.bucket(image.bucket).file(image.path).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
        });

        // Ensure fullUrl is a complete URL
        const fullUrl = image.fullUrl.startsWith('http') 
          ? image.fullUrl 
          : `https://storage.googleapis.com/${image.bucket}/${image.path}`;

        return {
          ...image,
          signedUrl,
          fullUrl,
        };
      } catch (error) {
        console.error('Error generating signed URL for image:', image.id, error);
        return image; // Return the original image object if signing fails
      }
    }));

    console.log('Images with signed URLs:', imagesWithSignedUrls);

    return NextResponse.json(imagesWithSignedUrls);
  } catch (error) {
    console.error('\x1b[36m /api/images/[userId] GET error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  } finally {
    await db.close();
  }
}