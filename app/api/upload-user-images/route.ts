// app/api/upload-user-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { openDb, MyDatabase } from '@/db/db';
import sanitize from 'sanitize-filename'; // Import sanitize-filename
import { parseGcsPath, getBucket, generateSignedUrl } from '@/utils/gcs'; // Use centralized storage utility

// Initialize Google Cloud Storage bucket
const bucketName = process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME || '';
const bucket = getBucket(bucketName);

export async function POST(req: NextRequest) {
  console.log('\x1b[36m Received upload-user-images POST request \x1b[0m');
  
  let db: MyDatabase | null = null;

  try {
    const { personData, images, personId, imageId, croppedImage } = await req.json();
    console.log('\x1b[36m Payload received: \x1b[0m', { personData, images, personId, imageId, croppedImage });

    // Determine if it's an initial upload or an update
    if (personData && images) {
      // Handle initial upload
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
      const newPersonId = result.lastID;

      // Upload images and save their information
      const uploadedImages = await Promise.all(
        images.map(async (image: any, index: number) => {
          console.log(`\x1b[36m Processing image ${index + 1}: ${image.fileName} \x1b[0m`);
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

          // Upload original image to GCS
          await bucket.file(originalFileName).save(Buffer.from(image.original.split(',')[1], 'base64'), {
            metadata: {
              contentType: image.original.split(',')[0].split(':')[1].split(';')[0],
            },
          });

          // After uploading each image, construct the fully qualified URL
          const originalUrl = `https://storage.googleapis.com/${bucketName}/${originalFileName}`;
          
          let croppedUrl: string | null = null;
          if (image.cropped) {
            if (typeof image.cropped !== 'string') {
              throw new Error(`Invalid cropped image data for file: ${image.fileName}`);
            }

            const croppedFileName = `c_${uuid}_${sanitizedFileName}`; // Prefix with 'c_'

            // Upload cropped image to GCS
            await bucket.file(croppedFileName).save(Buffer.from(image.cropped.split(',')[1], 'base64'), {
              metadata: {
                contentType: image.cropped.split(',')[0].split(':')[1].split(';')[0],
              },
            });

            // After uploading, construct croppedUrl
            croppedUrl = `https://storage.googleapis.com/${bucketName}/${croppedFileName}`;
          }

          // Insert into images table with full URLs, setting croppedUrl to NULL as cropping is no longer handled
          await db!.run(
            'INSERT INTO images (personId, fileName, bucket, originalUrl, croppedUrl) VALUES (?, ?, ?, ?, ?)',
            [newPersonId, originalFileName, bucketName, originalUrl, null] // Set croppedUrl to NULL
          );

          return {
            fileName: originalFileName,
          };
        })
      );

      console.log('\x1b[36m All images processed successfully \x1b[0m');

      // Commit transaction
      await db.run('COMMIT');

      return NextResponse.json({ personId: newPersonId, uploadedImages });
    } else if (personId && imageId && croppedImage) {
      // Handle cropped image update

      // Validate payload
      if (!personId || !imageId || !croppedImage.original) {
        return NextResponse.json({ error: 'Invalid payload for image update' }, { status: 400 });
      }

      // Initialize database connection if not already
      if (!db) {
        db = await openDb();
      }

      // Fetch existing image record
      const existingImage = await db.get(
        'SELECT * FROM images WHERE id = ? AND personId = ?',
        [imageId, personId]
      );

      if (!existingImage) {
        throw new Error('Image not found for the given personId and imageId');
      }

      // Sanitize the file name
      const sanitizedFileName = sanitize(croppedImage.fileName);
      if (!sanitizedFileName) {
        throw new Error(`Invalid file name after sanitizing: ${croppedImage.fileName}`);
      }

      const uuid = uuidv4();
      const croppedFileName = `c_${uuid}_${sanitizedFileName}`;

      // Upload cropped image to GCS
      await bucket.file(croppedFileName).save(Buffer.from(croppedImage.original.split(',')[1], 'base64'), {
        metadata: {
          contentType: croppedImage.original.split(',')[0].split(':')[1].split(';')[0],
        },
      });

      // After uploading, construct croppedUrl
      const croppedUrl = `https://storage.googleapis.com/${bucketName}/${croppedFileName}`;

      // Update the 'croppedUrl' with the new URL
      await db.run(
        'UPDATE images SET croppedUrl = ? WHERE id = ? AND personId = ?',
        [croppedUrl, imageId, personId]
      );

      console.log(`\x1b[36m Cropped image ${imageId} updated successfully \x1b[0m`);

      return NextResponse.json({ uploadedImage: { fileName: croppedFileName } });
    } else {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('\x1b[36m Error in upload-user-images route: \x1b[0m', error);
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