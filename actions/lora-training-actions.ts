'use server';

import fs from 'fs';
import path from 'path';
import { openDb } from '@/db/db';
import {
  createZipFile,
  prepareImagesForLoraTraining,
  uploadToGCP,
  uploadToFalAi,
} from '@/utils/lora-utils';
import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';

interface Shoot {
  id: number;
  name: string;
  costume: string;
  imageCount: number;
}

interface LoraTrainingResult {
  id: number;
  personId: number;
  url: string;
  trainedOn: string;
  service: string;
  model: string;
  modelVersion: string;
}

/**
 * Fetches shoots that have preprocessed images available.
 * @returns An array of shoots with image counts.
 */
export async function getShootsWithPreprocessedImages(): Promise<Shoot[]> {
  const db = await openDb();
  try {
    const shoots = await db.all<Shoot[]>(
      `
      SELECT s.id, s.name, s.costume, COUNT(pi.id) as imageCount
      FROM shoots s
      JOIN preprocessed_images pi ON s.id = pi.shootId
      GROUP BY s.id
      HAVING imageCount > 0
      `
    );
    return shoots;
  } finally {
    await db.close();
  }
}

/**
 * Initiates the LoRA training process for a given shoot.
 * @param shootId The ID of the shoot to train the LoRA model for.
 * @returns The result of the LoRA training process.
 */
export async function trainLoraModel(shootId: number): Promise<LoraTrainingResult> {
  const db = await openDb();
  try {
    // Step 1: Fetch preprocessed images and captions
    const images = await prepareImagesForLoraTraining(shootId);

    if (images.length === 0) {
      throw new Error('No preprocessed images found for the provided shoot ID.');
    }

    // Step 2: Fetch shoot and person details (including trigger word)
    const shoot = await db.get(
      `
      SELECT s.name, s.costume, p.trigger AS trigger_word, s.personId
      FROM shoots s
      JOIN persons p ON s.personId = p.id
      WHERE s.id = ?
      `,
      shootId
    );

    if (!shoot) {
      throw new Error('Shoot not found.');
    }

    console.log('Shoot details:', shoot); // Add this line to log shoot details

    // Step 3: Create ZIP file
    const zipFilePath = await createZipFile(images, shoot.costume, shoot.trigger_word);

    // Step 4: Upload ZIP to GCP and get signed URL
    const gcpUploadResult = await uploadToGCP(zipFilePath);
    console.log('Uploaded to GCP Signed URL:', gcpUploadResult.signedUrl);

    // Step 5: Upload to Fal.ai and start training using the signed URL
    const falAiResponse = await uploadToFalAi(gcpUploadResult.signedUrl, shoot.trigger_word);
    console.log('LoRA training initiated on Fal.ai:', falAiResponse);

    // Step 6: Download the diffusers_lora_file and config_file from Fal.ai
    const loraFileResponse = await fetch(falAiResponse.diffusers_lora_file.url);
    const loraFileBuffer = await loraFileResponse.buffer();

    const configFileResponse = await fetch(falAiResponse.config_file.url);
    const configFileBuffer = await configFileResponse.buffer();

    // Step 7: Upload the files to GCP_LORA_FILES_BUCKET_NAME
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    const loraBucketName = process.env.GCP_LORA_FILES_BUCKET_NAME;
    const loraBucket = storage.bucket(loraBucketName as string);
    const loraDir = `${shoot.costume}_${shoot.trigger_word}`;

    const loraFileName = `${loraDir}/${falAiResponse.diffusers_lora_file.file_name}`;
    const configFileName = `${loraDir}/${falAiResponse.config_file.file_name}`;

    await loraBucket.file(loraFileName).save(loraFileBuffer);
    await loraBucket.file(configFileName).save(configFileBuffer);

    const loraFileUrl = `https://storage.googleapis.com/${loraBucketName}/${loraFileName}`;

    // Step 8: Save the result to the loras table
    await db.run(
      `
      INSERT INTO loras (personId, url, trainedOn, service, model, modelVersion)
      VALUES (?, ?, datetime('now'), 'fal.ai', 'flux', '1.0')
      `,
      shoot.personId,
      loraFileUrl
    );

    // Optionally, clean up the ZIP file after successful upload
    fs.unlink(zipFilePath, (err) => {
      if (err) {
        console.error(`Error deleting zip file: ${zipFilePath}`, err);
      } else {
        console.log(`Deleted zip file: ${zipFilePath}`);
      }
    });

    // Retrieve the last inserted ID (assuming SQLite; adjust for your DB)
    const lastInsert = await db.get(`SELECT last_insert_rowid() as id`);
    const lastId = lastInsert?.id || 0;

    // Return structured result
    const result: LoraTrainingResult = {
      id: lastId,
      personId: shoot.personId,
      url: loraFileUrl,
      trainedOn: new Date().toISOString(),
      service: 'fal.ai',
      model: 'flux',
      modelVersion: '1.0',
    };

    return result;
  } catch (error) {
    console.error('Error during LoRA training process:', error);
    throw error;
  } finally {
    await db.close();
  }
}