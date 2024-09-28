// app/api/upload-user-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { openDb, MyDatabase } from '@/db/db';
import sanitize from 'sanitize-filename';
import { getBucket, uploadFile, generateSignedUrl } from '@/utils/gcs';

const bucketName = process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME || '';
const bucket = getBucket(bucketName);

export async function POST(req: NextRequest) {
  console.log('\x1b[36m Received upload-user-images POST request \x1b[0m');
  
  let db: MyDatabase | null = null;

  try {
    const { personData, images, personId } = await req.json();
    console.log('\x1b[36m Payload received: \x1b[0m', { personData, images, personId });

    // Determine if it's an initial upload or an update
    if (personData && images) {
      // Handle initial upload
      if (!personData || !images || !Array.isArray(images)) {
        return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
      }

      db = await openDb();
      await db.run('BEGIN TRANSACTION');

      const result = await db.run(
        'INSERT INTO persons (firstName, lastName, ethnicity, gender, birthdate) VALUES (?, ?, ?, ?, ?)',
        [personData.firstName, personData.lastName, personData.ethnicity, personData.gender, personData.birthdate]
      );
      const newPersonId = result.lastID;

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
          const originalFileName = `o_${uuid}_${sanitizedFileName}`;

          const originalGcsObjectUrl = await uploadFile(
            bucket,
            originalFileName,
            Buffer.from(image.base64imgdata.split(',')[1], 'base64'),
            image.base64imgdata.split(',')[0].split(':')[1].split(';')[0]
          );

          await db!.run(
            'INSERT INTO images (personId, uuid, sanitizedFileName, bucket, originalGcsObjectUrl, modifiedGcsObjectUrl) VALUES (?, ?, ?, ?, ?, ?)',
            [newPersonId, uuid, sanitizedFileName, bucketName, originalGcsObjectUrl, null]
          );

          const signedOriginalUrl = await generateSignedUrl(bucket, originalFileName);

          return {
            id: (await db!.get('SELECT last_insert_rowid() as id')).id,
            uuid,
            sanitizedFileName,
            originalGcsObjectUrl,
            signedOriginalUrl,
            signedModifiedUrl: null,
          };
        })
      );

      await db.run('COMMIT');

      return NextResponse.json({ personId: newPersonId, uploadedImages });
    } else if (personId && images) {
      // Handle image modifications
      if (!personId || !Array.isArray(images)) {
        return NextResponse.json({ error: 'Invalid payload for image update' }, { status: 400 });
      }

      db = await openDb();
      await db.run('BEGIN TRANSACTION');

      const updatedImages = await Promise.all(
        images.map(async (image: any) => {
          const existingImage = await db!.get(
            'SELECT * FROM images WHERE id = ? AND personId = ?',
            [image.id, personId]
          );

          if (!existingImage) {
            throw new Error(`Image not found for id ${image.id} and personId ${personId}`);
          }

          let modifiedGcsObjectUrl = existingImage.modifiedGcsObjectUrl;
          let signedModifiedUrl = null;

          if (image.deleted) {
            // Mark the image as deleted
            await db!.run(
              'UPDATE images SET isDeleted = 1 WHERE id = ?',
              [image.id]
            );
          } else if (image.rotation !== 0 || image.crop) {
            // Only apply modifications if rotation or crop is specified
            const modifiedFileName = `m_${existingImage.uuid}_${existingImage.sanitizedFileName}`;

            // Here you would apply the rotation and crop to the image
            // For this example, we'll just upload the same image data
            modifiedGcsObjectUrl = await uploadFile(
              bucket,
              modifiedFileName,
              Buffer.from(existingImage.originalGcsObjectUrl), // This should be the modified image data
              'image/jpeg' // This should be the actual mime type of the modified image
            );

            await db!.run(
              'UPDATE images SET modifiedGcsObjectUrl = ? WHERE id = ?',
              [modifiedGcsObjectUrl, image.id]
            );

            signedModifiedUrl = await generateSignedUrl(bucket, modifiedFileName);
          }

          const signedOriginalUrl = await generateSignedUrl(bucket, existingImage.originalGcsObjectUrl.split('/').pop()!);

          return {
            id: image.id,
            uuid: existingImage.uuid,
            sanitizedFileName: existingImage.sanitizedFileName,
            originalGcsObjectUrl: existingImage.originalGcsObjectUrl,
            modifiedGcsObjectUrl,
            signedOriginalUrl,
            signedModifiedUrl,
            isDeleted: image.deleted ? 1 : 0,
          };
        })
      );

      await db.run('COMMIT');

      return NextResponse.json({ updatedImages });
    } else {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('\x1b[36m Error in upload-user-images route: \x1b[0m', error);
    if (db) {
      try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing the database:', closeError);
      }
    }
  }
}