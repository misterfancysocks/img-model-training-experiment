'use server'

console.log('shoot-actions.ts is being loaded');

import { getLatestShoot, saveImages, getShoots, saveShootToDb, updateShootWithImages, getShootDetailsFromDb } from '../db/queries/shoot-queries';
import { ActionState } from '../types/action-types';
import { ShootData, PersonData, ImageData } from '../db/schema/schema';
import { openDb } from '@/db/db';
import { getExistingShoots as dbGetExistingShoots } from '@/db/queries/shoot-queries';
import path from 'path';
import fs from 'fs/promises';
import { saveImage } from '@/utils/image-utils';

/**
 * Retrieves the latest shoot from the database.
 */
export async function getLatestShootAction(): Promise<ActionState> {
  try {
    const shoot = await getLatestShoot();
    if (!shoot) {
      return { status: 'error', message: 'No shoots found' };
    }
    return { status: 'success', message: 'Latest shoot retrieved successfully', data: shoot };
  } catch (error) {
    console.error('Error in getLatestShootAction:', error);
    return { status: 'error', message: 'Failed to retrieve latest shoot' };
  }
}

/**
 * Saves images related to a specific shoot.
 * @param shootId The ID of the shoot to associate images with.
 * @param images Array of image objects containing fileName, data, and cropped status.
 */
export async function saveImagesAction(
  shootId: number,
  images: { fileName: string; data: string; cropped?: string }[]
): Promise<ActionState> {
  console.log('saveImagesAction called with shootId:', shootId, 'and images:', images);
  try {
    const shootDir = path.join(process.cwd(), 'public', 'assets', shootId.toString());
    await fs.mkdir(shootDir, { recursive: true });

    const transformedImages = await Promise.all(images.map(async (img) => {
      console.log('Processing image:', img.fileName);

      // Save original image
      const originalFileName = `o_${img.fileName}`;
      const originalFilePath = path.join(shootDir, originalFileName);
      const originalBuffer = Buffer.from(img.data, 'base64'); // 'img.data' is a string
      await fs.writeFile(originalFilePath, originalBuffer);
      const originalUrl = `/assets/${shootId}/${originalFileName}`;

      // Save cropped image if it exists
      let croppedUrl: string | undefined = undefined;
      if (img.cropped) { // 'img.cropped' is now a string
        const croppedFileName = `c_${img.fileName}`;
        const croppedFilePath = path.join(shootDir, croppedFileName);
        const croppedBuffer = Buffer.from(img.cropped, 'base64'); // No TypeScript error
        await fs.writeFile(croppedFilePath, croppedBuffer);
        croppedUrl = `/assets/${shootId}/${croppedFileName}`;
      }

      return {
        fileName: img.fileName,
        originalUrl,
        croppedUrl, // Already string or undefined
      };
    }));

    console.log('Transformed images to be saved:', JSON.stringify(transformedImages, null, 2));

    const result = await saveImages(shootId, transformedImages);
    console.log('Images saved successfully:', result);
    return { status: 'success', message: 'Images saved successfully', data: result };
  } catch (error) {
    console.error('Error in saveImagesAction:', error);
    return { status: 'error', message: 'Failed to save images: ' + (error as Error).message };
  } finally {
    console.log('saveImagesAction completed');
  }
}

/**
 * Retrieves all shoots from the database.
 */
export async function getShootsAction(): Promise<ActionState> {
  try {
    const shoots = await getShoots();
    return { status: 'success', message: 'Shoots retrieved successfully', data: shoots };
  } catch (error) {
    console.error('Error in getShootsAction:', error);
    return { status: 'error', message: 'Failed to retrieve shoots' };
  }
}

/**
 * Saves a new shoot or updates an existing one in the database.
 * @param person Data related to the person.
 * @param shoot Data related to the shoot.
 * @param images Array of image objects associated with the shoot.
 */
export async function saveShootAction(person: PersonData, shoot: ShootData, images: any[]): Promise<ActionState> {
  try {
    console.log('Saving shoot with images:', images.length);

    const shootResult = await saveShootToDb(person, shoot);
    if (!shootResult || typeof shootResult.id !== 'number') {
      throw new Error('Failed to save shoot or get valid shoot ID');
    }
    const shootId = shootResult.id;

    const savedImagePaths = await Promise.all(images.map(async (img) => {
      if (!img.path) {
        console.error(`Missing path for file: ${img.fileName}`);
        return null;
      }

      console.log(`Processing image: ${img.fileName}`);

      const originalFileName = `o_${img.fileName}`;
      const originalUrl = await saveImage(img.path, shootId, originalFileName);

      let croppedUrl: string | undefined = undefined;
      if (img.croppedPath) {
        const croppedFileName = `c_${img.fileName}`;
        croppedUrl = await saveImage(img.croppedPath, shootId, croppedFileName);
      }

      console.log(`Saved image: ${img.fileName}, Original URL: ${originalUrl}, Cropped URL: ${croppedUrl}`);

      return {
        fileName: img.fileName,
        originalUrl,
        croppedUrl,
      };
    }));

    const validImagePaths = savedImagePaths.filter((path): path is { fileName: string; originalUrl: string; croppedUrl: string | undefined } => path !== null);

    console.log('Valid image paths:', validImagePaths);

    const updatedShootResult = await updateShootWithImages(shootId, validImagePaths);

    console.log('Shoot saved successfully:', updatedShootResult);
    return { status: 'success', message: 'Shoot saved successfully', data: updatedShootResult };
  } catch (error) {
    console.error('Error in saveShootAction:', error);
    return { status: 'error', message: 'Failed to save shoot: ' + (error as Error).message };
  }
}

/**
 * Retrieves existing shoots from the database.
 */
export async function getExistingShoots() {
  const db = await openDb();
  try {
    return await dbGetExistingShoots(db);
  } catch (error) {
    console.error('Error fetching existing shoots:', error);
    throw error;
  } finally {
    await db.close();
  }
}

/**
 * Retrieves shoot details from the database.
 * @param shootId The ID of the shoot to retrieve details for.
 */
export async function getShootDetails(shootId: number): Promise<ActionState> {
  try {
    const shootDetails = await getShootDetailsFromDb(shootId);
    if (!shootDetails) {
      return { status: 'error', message: 'Shoot not found' };
    }
    return { status: 'success', message: 'Shoot details retrieved successfully', data: shootDetails };
  } catch (error) {
    console.error('Error in getShootDetails:', error);
    return { status: 'error', message: 'Failed to retrieve shoot details' };
  }
}