import { NextResponse } from 'next/server';
import { saveShootAction } from '@/actions/shoot-actions';
import { PersonData, ShootData, ImageData } from '@/db/schema/schema';

// Helper function to truncate strings
const truncate = (str: string, length: number) => {
  if (typeof str === 'string') {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
  return str; // Return as is if not a string
};

export async function POST(request: Request) {
  try {
    const { person, shoot, images } = await request.json();
    
    const result = await saveShootAction(
      person as PersonData,
      shoot as ShootData,
      images as ImageData[]
    );

    console.log('\x1b[36m route/save-shoot/ saveShootAction images:\x1b[0m');
    console.log(images.map((img: any) => ({
      ...img,
      originalImg: truncate(img.originalImg, 30),
      croppedImg: img.croppedImg ? truncate(img.croppedImg, 30) : undefined
    })));

    if (result.status === 'success') {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in save-shoot API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}