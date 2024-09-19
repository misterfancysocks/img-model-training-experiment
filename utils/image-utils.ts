import fs from 'fs/promises';
import path from 'path';

/**
 * Utility functions for handling image operations in the Costumes app.
 */

/**
 * Saves an image file to a specific location in the public assets directory.
 * 
 * @param base64Data The base64-encoded string of the image data.
 * @param shootId The ID of the photoshoot associated with this image.
 * @param fileName The desired name for the saved image file.
 * @returns A Promise that resolves to the URL path for accessing the saved image.
 * 
 * Example:
 * const imagePath = await saveImage('data:image/jpeg;base64,/9j/4AAQSkZJRg...', 123, 'profile_pic.jpg');
 * // imagePath will be something like '/assets/123/profile_pic.jpg'
 * 
 * Note: This function should be called from a server action or API route,
 * not directly from client-side code.
 */
export async function saveImage(base64Data: string, shootId: number, fileName: string): Promise<string> {
  // Construct the directory path where the image will be saved
  const dirPath = path.join(process.cwd(), 'public', 'assets', shootId.toString());
  
  // Create the directory if it doesn't exist
  await fs.mkdir(dirPath, { recursive: true });

  // Construct the full path for the destination file
  const destPath = path.join(dirPath, fileName);
  
  // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
  
  // Decode the base64 string and write it to a file
  await fs.writeFile(destPath, Buffer.from(base64Image, 'base64'));

  // Return the public URL path to access the saved image
  return `/assets/${shootId}/${fileName}`;
}

// TODO: Add more image utility functions as needed, such as:
// - resizeImage(imagePath: string, width: number, height: number): Promise<string>
// - convertImageFormat(imagePath: string, format: 'jpeg' | 'png' | 'webp'): Promise<string>
// - getImageMetadata(imagePath: string): Promise<ImageMetadata>