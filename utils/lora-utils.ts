import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import { openDb } from '@/db/db';
import * as fal from '@fal-ai/serverless-client';

// Initialize Fal.ai client with the API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY,
});
console.log('Fal.ai client initialized with API key:', process.env.FAL_KEY);
// Initialize Google Cloud Storage client with credentials from environment variables
const clientEmail = process.env.GCP_CLIENT_EMAIL;
const privateKey = process.env.GCP_PRIVATE_KEY
  ? process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

console.log('\x1b[36m GCP Client Email:\x1b[0m', clientEmail); // Log the client email
console.log('\x1b[36m GCP Private Key Present:\x1b[0m', !!privateKey); // Log if private key is present

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});

// Get the bucket name from environment variables
const bucketName = process.env.GCP_LORA_TRAINING_ZIP_BUCKET_NAME || 'halloween-costume-loras-training-zip';
const bucket = storage.bucket(bucketName);

// Define interfaces
interface PreprocessedImage {
  id: number;
  file_path: string;
  caption: string;
}

interface GCPUploadResponse {
  signedUrl: string;
  name: string;
  bucket: string;
  mediaLink: string;
}

interface FalResponse {
  diffusers_lora_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  config_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

/**
 * Creates a ZIP file containing images and their corresponding caption text files.
 * @param images Array of preprocessed images with captions.
 * @param costume Name of the costume to name the ZIP file accordingly.
 * @param trigger Trigger word for the LoRA model.
 * @returns The file path of the created ZIP file.
 */
export async function createZipFile(images: PreprocessedImage[], costume: string, trigger: string): Promise<string> {
  const tmpDir = path.join(process.cwd(), 'tmp');

  // Ensure the tmp directory exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Remove spaces from costume name and use it with trigger for the ZIP file name
  const sanitizedCostume = costume.replace(/\s+/g, '');
  const zipFilePath = path.join(tmpDir, `${sanitizedCostume}_${trigger}_lora_training.zip`);
  const zip = new AdmZip();

  images.forEach((image) => {
    const imagePath = path.join(process.cwd(), 'public', image.file_path);
    const captionPath = imagePath.replace(/\.[^/.]+$/, '.txt');

    if (fs.existsSync(imagePath)) {
      // Add the image file to the ZIP
      zip.addLocalFile(imagePath);

      // Add the caption as a text file
      zip.addFile(path.basename(captionPath), Buffer.from(image.caption, 'utf-8'));
    } else {
      console.error(`File not found: ${imagePath}`);
    }
  });

  zip.writeZip(zipFilePath);
  console.log(`ZIP file created at: ${zipFilePath}`);
  return zipFilePath;
}

/**
 * Prepares image data for LoRA training based on the provided shoot ID.
 * Fetches images and captions from the database.
 * @param shootId The ID of the shoot.
 * @returns An array of preprocessed images with captions.
 */
export async function prepareImagesForLoraTraining(shootId: number): Promise<PreprocessedImage[]> {
  const db = await openDb();
  const rows = await db.all(
    `
    SELECT id, preprocessedUrl AS file_path, caption
    FROM preprocessed_images
    WHERE shootId = ?
    `,
    shootId
  );

  const images: PreprocessedImage[] = [];

  for (const row of rows) {
    const fullPath = path.join(process.cwd(), 'public', row.file_path); // Prepend 'public' to the path
    //console.log(`Checking file: ${fullPath}`); // Log the full path
    if (fs.existsSync(fullPath)) {
      images.push({
        id: row.id,
        file_path: row.file_path,
        caption: row.caption,
      });
    } else {
      console.error(`File not found: ${fullPath}`);
    }
  }

  await db.close();
  return images;
}

/**
 * Uploads the ZIP file to the specified GCP bucket.
 * Generates a signed URL for the uploaded file.
 * @param zipFilePath Path to the ZIP file to be uploaded.
 * @returns GCPUploadResponse containing signed URL and metadata.
 */
export async function uploadToGCP(zipFilePath: string): Promise<GCPUploadResponse> {
  try {
    const fileName = path.basename(zipFilePath);
    const file = bucket.file(fileName);

    await bucket.upload(zipFilePath, {
      destination: fileName,
      gzip: true,
      metadata: {
        cacheControl: 'no-cache',
      },
    });

    console.log(`File ${fileName} uploaded to bucket ${bucketName}.`);

    // Define signed URL options
    const signedUrlOptions: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl(signedUrlOptions);

    console.log(`Signed URL generated: ${signedUrl}`);

    // Retrieve mediaLink from metadata
    const [metadata] = await file.getMetadata();
    const mediaLink = metadata.mediaLink || '';

    return {
      signedUrl,
      name: fileName,
      bucket: bucketName,
      mediaLink,
    };
  } catch (error) {
    console.error('Error uploading to GCP:', error);
    throw error;
  }
}

/**
 * Uploads the signed URL to Fal.ai to initiate LoRA training.
 * @param gcpSignedUrl The signed URL of the ZIP file uploaded to GCP.
 * @param triggerWord The trigger word for the LoRA model.
 * @returns The response from Fal.ai containing training details.
 */
export async function uploadToFalAi(gcpSignedUrl: string, triggerWord: string): Promise<FalResponse> {
  try {
    console.log(`GCP Signed URL for Fal.ai: ${gcpSignedUrl}`);
    console.log(`Trigger word: ${triggerWord}`);

    // Prepare the payload
    const payload = {
      images_data_url: gcpSignedUrl,
      trigger_word: triggerWord,
      is_input_format_already_preprocessed: true,
    };

    console.log('Payload for Fal.ai:', payload); // Log the payload

    // Send the request to Fal.ai to start training
    const response: FalResponse = await fal.subscribe('fal-ai/flux-lora-fast-training', {
      input: payload,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('Full Fal.ai response:', response);
    console.log('diffusers_lora_file:', response.diffusers_lora_file);
    console.log('config_file:', response.config_file);

    return response;
  } catch (error) {
    console.error('Error uploading to Fal.ai:', error);
    throw error;
  }
}
