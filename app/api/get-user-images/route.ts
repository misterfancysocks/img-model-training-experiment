import { NextRequest, NextResponse } from 'next/server';
import { openDb, MyDatabase } from '@/db/db';
import { parseGcsPath, getBucket, generateSignedUrl } from '@/utils/gcs'; // Ensure all utilities are imported

/**
 * Handles GET requests to fetch images for a specific person.
 * 
 * Expects a query parameter `personId`.
 * 
 * Response:
 * - 200: { images: ImageState[] }
 * - 400: { error: string }
 * - 500: { error: string }
 */
export async function GET(req: NextRequest) {
  console.log('\x1b[36m Received get-user-images GET request \x1b[0m');

  const { searchParams } = new URL(req.url);
  const personIdParam = searchParams.get('personId');

  if (!personIdParam) {
    return NextResponse.json({ error: 'Missing personId parameter' }, { status: 400 });
  }

  const personId = parseInt(personIdParam, 10);
  if (isNaN(personId)) {
    return NextResponse.json({ error: 'Invalid personId parameter' }, { status: 400 });
  }

  let db: MyDatabase | null = null;

  try {
    db = await openDb();

    // Fetch images associated with the personId
    const images = await db.all(
      'SELECT id, fileName, bucket, originalUrl FROM images WHERE personId = ?',
      [personId]
    );

    console.log('\x1b[36m Fetched images for personId:', personId, images, '\x1b[0m');

    // Generate signed URLs for each image
    const signedImages = await Promise.all(
      images.map(async (img: { id: number; fileName: string; bucket: string; originalUrl: string; }) => {
        // Parse the originalUrl to get the fileName
        const { fileName: originalFileName } = parseGcsPath(img.originalUrl);
        const originalSignedUrl = await generateSignedUrl(getBucket(img.bucket), originalFileName);

        return {
          id: img.id,
          fileName: img.fileName,
          originalUrl: originalSignedUrl, // Signed URL
        };
      })
    );

    return NextResponse.json({ images: signedImages });
  } catch (error: unknown) {
    console.error('\x1b[36m Error in get-user-images route: \x1b[0m', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  } finally {
    // Ensure the database connection is closed
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing the database:', closeError);
      }
    }
  }
}