import { NextResponse } from 'next/server';
import { saveShootActionFilePath } from '@/actions/shoot-actions';
import { PersonData, ShootData, ImageData } from '@/db/schema/schema';

export async function POST(request: Request) {
  try {
    const { person, shoot, images } = await request.json();
    
    console.log('Received file path images:', images.map((img: ImageData) => ({
      fileName: img.fileName,
      hasOriginalUrl: !!img.originalUrl,
      hasCroppedUrl: !!img.croppedUrl
    })));

    const result = await saveShootActionFilePath(
      person as PersonData,
      shoot as ShootData,
      images as ImageData[]
    );

    if (result.status === 'success') {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in save-shoot-file-path API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}