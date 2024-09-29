import type { NextRequest } from 'next/server';
import { openDb } from '@/db/db';
import { Storage } from '@google-cloud/storage';

interface ImageData {
  id: number;
  fileName: string;
  originalUrl: string;
  croppedUrl: string | null;
  signedOriginalUrl?: string;
  signedCroppedUrl?: string;
}

interface PreprocessedImageData {
  id: number;
  imageId: number;
  preprocessedUrl: string;
  caption: string;
  llm: string;
  signedUrl?: string;
}

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

async function generateSignedUrl(url: string): Promise<string> {
  const filePathMatch = url.match(/^(?:gs:\/\/|https:\/\/storage\.googleapis\.com\/)([^/]+)\/(.+)$/);
  if (!filePathMatch) {
    console.log('Invalid URL format:', url);
    return url; // Return original URL if it doesn't match the expected format
  }
  const [, bucketName, objectPath] = filePathMatch;
  console.log('Generating signed URL for:', bucketName, objectPath);
  try {
    const [signedUrl] = await storage.bucket(bucketName).file(objectPath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    });
    console.log('Generated signed URL:', signedUrl);
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return url; // Return original URL if signing fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const personId = url.searchParams.get('id');

    if (!personId) {
      return new Response(JSON.stringify({ message: 'id is required' }), { status: 400 });
    }

    const db = await openDb();
    const images: ImageData[] = await db.all(
      'SELECT id, fileName, originalUrl, croppedUrl FROM images WHERE personId = ?',
      [personId]
    );

    console.log('Fetched images:', images);

    // Generate signed URLs for original and cropped images
    const imagesWithSignedUrls = await Promise.all(images.map(async (image) => ({
      ...image,
      signedOriginalUrl: await generateSignedUrl(image.originalUrl),
      signedCroppedUrl: image.croppedUrl ? await generateSignedUrl(image.croppedUrl) : null,
    })));

    // Fetch preprocessed_images related to the fetched images
    const imageIds = images.map(img => img.id);
    let preprocessedImages: PreprocessedImageData[] = [];
    if (imageIds.length > 0) {
      const fetchedPreprocessedImages = await db.all(
        `SELECT id, imageId, preprocessedUrl, caption, llm FROM preprocessed_images WHERE imageId IN (${imageIds.map(() => '?').join(',')})`,
        imageIds
      );

      console.log('Fetched preprocessed images:', fetchedPreprocessedImages);

      // Generate signed URLs for preprocessed images
      preprocessedImages = await Promise.all(fetchedPreprocessedImages.map(async (preprocessedImage) => ({
        ...preprocessedImage,
        signedUrl: await generateSignedUrl(preprocessedImage.preprocessedUrl),
      })));
    } else {
      console.log('No images found for personId:', personId);
    }

    console.log('Final images with signed URLs:', imagesWithSignedUrls);
    console.log('Final preprocessed images with signed URLs:', preprocessedImages);

    return new Response(JSON.stringify({ images: imagesWithSignedUrls, preprocessedImages }), { status: 200 });
  } catch (error) {
    console.error('Error fetching person details:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch person details' }), { status: 500 });
  }
}