import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import fetch from 'node-fetch';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCP_USER_IMG_UPLOAD_BUCKET_NAME as string;

export async function POST(request: Request) {
  try {
    const { imageUrl, crop } = await request.json();

    // Fetch the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // Crop the image
    const croppedBuffer = await sharp(Buffer.from(buffer))
      .extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      })
      .toBuffer();

    // Generate a new filename for the cropped image
    const originalFilename = imageUrl.split('/').pop();
    const newFilename = `cropped-${Date.now()}-${originalFilename}`;

    // Upload the cropped image to GCP
    const file = storage.bucket(bucketName).file(newFilename);
    await file.save(croppedBuffer, {
      metadata: {
        contentType: 'image/jpeg', // Adjust if needed
      },
    });

    // Generate a signed URL for the cropped image
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    });

    return NextResponse.json({ croppedImageUrl: signedUrl });
  } catch (error) {
    console.error('Error cropping image:', error);
    return NextResponse.json({ error: 'Failed to crop image' }, { status: 500 });
  }
}