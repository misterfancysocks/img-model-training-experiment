import { Storage, Bucket } from '@google-cloud/storage';



/**
 * Initializes a Google Cloud Storage client.
 */
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL!,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
  },
});

/**
 * Retrieves a bucket instance by name.
 * 
 * @param bucketName - The name of the GCS bucket.
 * @returns The Bucket instance.
 * @throws Error if bucketName is not provided.
 */
export function getBucket(bucketName: string): Bucket {
  if (!bucketName) {
    throw new Error('Bucket name must be provided');
  }
  return storage.bucket(bucketName);
}

/**
 * Generates a signed URL for a given file in the specified bucket.
 * 
 * @param bucket - The Google Cloud Storage bucket instance.
 * @param fileName - The name of the file in the bucket.
 * @param action - The action for the signed URL ('read' | 'write').
 * @param expiresInMs - Time in milliseconds until the signed URL expires.
 * @returns A promise that resolves to the signed URL string.
 */
export async function generateSignedUrl(
  bucket: Bucket,
  fileName: string,
  action: 'read' | 'write' = 'read',
  expiresInMs: number = 60 * 60 * 1000 // Default 1 hour
): Promise<string> {
  const file = bucket.file(fileName);

  const options = {
    version: 'v4' as const,
    action,
    expires: Date.now() + expiresInMs,
  };

  try {
    const [url] = await file.getSignedUrl(options);
    console.log(`Generated signed URL for ${fileName}:`, url);
    return url;

  } catch (error) {
    console.error(`Error generating signed URL for ${fileName}:`, error);
    throw new Error(`Failed to generate signed URL for ${fileName}`);
  }
}

/**
 * Parses a GCS URL and returns the bucket name and file name.
 * 
 * @param urlOrPath - The full URL or "bucketName/fileName" string.
 * @returns An object containing bucketName and fileName.
 * @throws Error if the URL is invalid.
 */
export function parseGcsPath(urlOrPath: string): { bucketName: string; fileName: string } {
  try {
    const url = new URL(urlOrPath);
    if (url.hostname === 'storage.googleapis.com') {
      const [, bucketName, ...filePathParts] = url.pathname.split('/');
      const fileName = filePathParts.join('/');
      return { bucketName, fileName };
    } else {
      throw new Error('Not a valid Google Cloud Storage URL');
    }
  } catch (error) {
    // If URL parsing fails, assume it's a "bucketName/fileName" format
    const [bucketName, ...filePathParts] = urlOrPath.split('/');
    const fileName = filePathParts.join('/');
    if (!bucketName || !fileName) {
      throw new Error('Invalid GCS path');
    }
    return { bucketName, fileName };
  }
}

export async function uploadFile(
  bucket: Bucket,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const file = bucket.file(fileName);

  try {
    await file.save(fileBuffer, {
      contentType: contentType,
    });

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error);
    throw new Error(`Failed to upload file ${fileName}`);
  }
}