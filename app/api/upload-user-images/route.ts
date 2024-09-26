// app/api/upload-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { openDb, MyDatabase } from '@/db/db';
import sanitize from 'sanitize-filename'; // Import sanitize-filename

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL!,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
  },
});

const bucket = storage.bucket(process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME || '');

export async function POST(req: NextRequest) {
  let db: MyDatabase | null = null; // Explicitly type 'db' as MyDatabase or null

  try {
    const { personData, images } = await req.json();

    // Basic payload validation
    if (!personData || !images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    // Open database connection
    db = await openDb();

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    // Insert person data into the database
    const result = await db.run(
      'INSERT INTO persons (firstName, lastName, ethnicity, gender, birthdate) VALUES (?, ?, ?, ?, ?)',
      [
        personData.firstName,
        personData.lastName,
        personData.ethnicity,
        personData.gender,
        personData.birthdate,
      ]
    );
    const personId = result.lastID;

    // Upload images and save their information
    const uploadedImages = await Promise.all(
      images.map(async (image: any) => {
        if (!image.fileName) {
          throw new Error('Image fileName is required');
        }

        // Sanitize the file name to prevent security issues
        const sanitizedFileName = sanitize(image.fileName);
        if (!sanitizedFileName) {
          throw new Error(`Invalid file name after sanitizing: ${image.fileName}`);
        }

        const uuid = uuidv4();
        const originalFileName = `o_${uuid}_${sanitizedFileName}`; // Prefix with 'o_'

        const originalFile = bucket.file(originalFileName);

        // Validate original image data
        if (!image.original || typeof image.original !== 'string') {
          throw new Error(`Invalid or missing original image data for file: ${image.fileName}`);
        }

        // Extract MIME type dynamically
        const mimeTypeMatch = image.original.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

        // Decode and upload original image
        const base64Original = image.original.replace(/^data:image\/\w+;base64,/, '');
        const originalBuffer = Buffer.from(base64Original, 'base64');

        await originalFile.save(originalBuffer, {
          metadata: {
            contentType: mimeType, // Dynamic content type
          },
        });

        const originalGcpUrl = `https://storage.googleapis.com/${bucket.name}/${originalFileName}`;

        let croppedGcpUrl: string | null = null;
        if (image.cropped) {
          if (typeof image.cropped !== 'string') {
            throw new Error(`Invalid cropped image data for file: ${image.fileName}`);
          }

          const croppedFileName = `c_${uuid}_${sanitizedFileName}`; // Prefix with 'c_'
          const croppedFile = bucket.file(croppedFileName);

          // Extract MIME type dynamically
          const mimeTypeCroppedMatch = image.cropped.match(/^data:(image\/\w+);base64,/);
          const mimeTypeCropped = mimeTypeCroppedMatch ? mimeTypeCroppedMatch[1] : 'image/jpeg';

          // Decode and upload cropped image
          const base64Cropped = image.cropped.replace(/^data:image\/\w+;base64,/, '');
          const croppedBuffer = Buffer.from(base64Cropped, 'base64');

          await croppedFile.save(croppedBuffer, {
            metadata: {
              contentType: mimeTypeCropped, // Dynamic content type
            },
          });

          croppedGcpUrl = `https://storage.googleapis.com/${bucket.name}/${croppedFileName}`;
        }

        // Save image information to the database
        await db!.run( // Use 'db!' to assert that 'db' is not null
          'INSERT INTO images (personId, fileName, originalUrl, croppedUrl) VALUES (?, ?, ?, ?)',
          [personId, originalFileName, originalGcpUrl, croppedGcpUrl]
        );

        return {
          fileName: originalFileName,
          originalUrl: originalGcpUrl,
          croppedUrl: croppedGcpUrl,
        };
      })
    );

    // Commit transaction
    await db.run('COMMIT');

    return NextResponse.json({ personId, uploadedImages });
  } catch (error: unknown) {
    // Rollback transaction in case of error
    if (db) {
      try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    console.error('Error in upload-images:', error);

    // Type narrowing for 'error'
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
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