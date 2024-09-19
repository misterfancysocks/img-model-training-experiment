import { NextResponse } from 'next/server';
import { deleteImage } from '@/db/queries/shoot-queries';

export async function POST(request: Request) {
  try {
    const { shootId, imageUrl } = await request.json();

    await deleteImage(parseInt(shootId), imageUrl);

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}