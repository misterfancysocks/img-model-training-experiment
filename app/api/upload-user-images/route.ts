// app/api/upload-user-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { openDb, MyDatabase } from '@/db/db';
import sanitize from 'sanitize-filename';
import { getBucket, uploadFile, generateSignedUrl } from '@/utils/gcs';
import sharp from 'sharp'; // Add this import at the top

const bucketName = process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME || '';
const bucket = getBucket(bucketName);

export async function POST(req: NextRequest) {
  console.log('\x1b[36m Received upload-user-images POST request \x1b[0m');
  
  let db: MyDatabase | null = null;

  try {
    const { personData, images, personId } = await req.json();
    console.log('\x1b[36m Payload received: \x1b[0m', JSON.stringify({ personData, images, personId }, null, 2));

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
          console.log(`\x1b[36m Processing image modification for image ID: ${image.id} \x1b[0m`);

          const existingImage = await db!.get(
            'SELECT * FROM images WHERE id = ? AND personId = ?',
            [image.id, personId]
          );

          if (!existingImage) {
            console.log(`\x1b[31m Image not found for id ${image.id} and personId ${personId} \x1b[0m`);
            throw new Error(`Image not found for id ${image.id} and personId ${personId}`);
          }

          let modifiedGcsObjectUrl = existingImage.modifiedGcsObjectUrl;
          let signedModifiedUrl = null;

          if (image.deleted) {
            console.log(`\x1b[36m Marking image ${image.id} as deleted \x1b[0m`);
            await db!.run(
              'UPDATE images SET isDeleted = 1 WHERE id = ?',
              [image.id]
            );
          } else if (image.rotation !== 0 || image.crop) {
            console.log(`\x1b[36m Applying modifications to image ${image.id} \x1b[0m`);
            console.log(`\x1b[36m Rotation: ${image.rotation}, Crop: ${JSON.stringify(image.crop)} \x1b[0m`);

            const originalFileName = existingImage.originalGcsObjectUrl.split('/').pop()!;
            const [originalFileContent] = await bucket.file(originalFileName).download();

            let sharpImage = sharp(originalFileContent);

            if (image.rotation !== 0) {
              console.log(`\x1b[36m Applying rotation of ${image.rotation} degrees \x1b[0m`);
              sharpImage = sharpImage.rotate(image.rotation);
            }

            if (image.crop) {
              console.log(`\x1b[36m Applying crop to image ${image.id}: ${JSON.stringify(image.crop)} \x1b[0m`);
              const { width, height, x, y } = image.crop;
              const roundedWidth = Math.round(width);
              const roundedHeight = Math.round(height);
              const roundedX = Math.round(x);
              const roundedY = Math.round(y);
              
              const metadata = await sharp(originalFileContent).metadata();
              console.log(`\x1b[36m Original image dimensions: ${metadata.width}x${metadata.height} \x1b[0m`);
              
              if (metadata.width && metadata.height) {
                if (roundedX < metadata.width && roundedY < metadata.height &&
                    roundedX + roundedWidth <= metadata.width && roundedY + roundedHeight <= metadata.height) {
                  sharpImage = sharpImage.extract({ 
                    width: roundedWidth, 
                    height: roundedHeight, 
                    left: roundedX, 
                    top: roundedY 
                  });
                  console.log(`\x1b[36m Crop applied: width=${roundedWidth}, height=${roundedHeight}, left=${roundedX}, top=${roundedY} \x1b[0m`);
                } else {
                  console.log(`\x1b[33m Warning: Crop dimensions out of bounds. Skipping crop for image ${image.id} \x1b[0m`);
                }
              } else {
                console.log(`\x1b[33m Warning: Unable to determine original image dimensions. Skipping crop for image ${image.id} \x1b[0m`);
              }
            }

            const modifiedBuffer = await sharpImage.toBuffer();
            console.log(`\x1b[36m Modified image buffer size: ${modifiedBuffer.length} bytes \x1b[0m`);

            const modifiedFileName = `m_${existingImage.uuid}_${existingImage.sanitizedFileName}`;
            console.log(`\x1b[36m Uploading modified image as: ${modifiedFileName} \x1b[0m`);

            modifiedGcsObjectUrl = await uploadFile(
              bucket,
              modifiedFileName,
              modifiedBuffer,
              'image/jpeg' // Adjust this if you're using a different format
            );

            console.log(`\x1b[36m Modified image uploaded to: ${modifiedGcsObjectUrl} \x1b[0m`);

            await db!.run(
              'UPDATE images SET modifiedGcsObjectUrl = ? WHERE id = ?',
              [modifiedGcsObjectUrl, image.id]
            );

            signedModifiedUrl = await generateSignedUrl(bucket, modifiedFileName);
            console.log(`\x1b[36m Generated signed URL for modified image: ${signedModifiedUrl} \x1b[0m`);
          } else {
            console.log(`\x1b[36m No modifications applied to image ${image.id} \x1b[0m`);
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

      console.log('\x1b[36m Image modifications completed successfully \x1b[0m');
      return NextResponse.json({ updatedImages });
    } else {
      console.log('\x1b[31m Invalid payload structure \x1b[0m');
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('\x1b[31m Error in upload-user-images route: \x1b[0m', error);
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