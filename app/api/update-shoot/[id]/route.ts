import { NextResponse } from 'next/server';
import { updateShootWithImages, updatePersonAndShoot } from '@/db/queries/shoot-queries';
import { saveImage } from '@/utils/image-utils';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract data from the request body
    const { person, shoot, images } = await request.json();
    const shootId = parseInt(params.id);

    // Log received data for debugging
    console.log(`\x1b[32m upate-shoot[id]`)
    console.log('Received update request for shoot:', shootId);
    console.log('Person data:', person);
    console.log('Shoot data:', shoot);
    console.log('Number of images:', images.length);

    // Update person and shoot data in the database
    await updatePersonAndShoot(shootId, person, shoot);

    // Process and save each image
    const processedImages = await Promise.all(images.map(async (img: any, index: number) => {
      console.log(`\x1b[36m upate-shoot[id]`)
      console.log(`Processing image ${index + 1}:`, img.fileName);

      // Validate image data
      if (!img.fileName || !img.originalImg) {
        console.log(`\x1b[31m upate-shoot[id]`)
        console.error(`Invalid image data for image ${index + 1}:`, {
          ...img,
          originalImg: img.originalImg ? `${img.originalImg.substring(0, 20)}...` : undefined,
          croppedImg: img.croppedImg ? `${img.croppedImg.substring(0, 20)}...` : undefined
        });
        return null;
      }

      // Save original image
      const originalFileName = `o_${img.fileName}`;
      const originalUrl = await saveImage(img.originalImg, shootId, originalFileName);
      console.log(`Saved original image: ${originalUrl}`);

      // Save cropped image if available
      let croppedUrl: string | undefined = undefined;
      if (img.croppedImg) {
        const croppedFileName = `c_${img.fileName}`;
        croppedUrl = await saveImage(img.croppedImg, shootId, croppedFileName);
        console.log(`Saved cropped image: ${croppedUrl}`);
      }

      // Return processed image data
      return {
        fileName: img.fileName,
        originalUrl,
        croppedUrl,
      };
    }));

    // Filter out any null results from image processing
    const validImages = processedImages.filter((img): img is NonNullable<typeof img> => img !== null);
    console.log(`\x1b[36m upate-shoot[id]`)
    console.log('Valid processed images:', validImages);

    // Update the shoot with the processed image data
    const updatedShoot = await updateShootWithImages(shootId, validImages);

    console.log('Shoot updated successfully:', updatedShoot);
    // Return success response
    return NextResponse.json({ message: 'Shoot updated successfully', shoot: updatedShoot });
  } catch (error) {
    // Log and return error response
    console.error('Error updating shoot:', error);
    return NextResponse.json({ error: 'Failed to update shoot: ' + (error as Error).message }, { status: 500 });
  }
}