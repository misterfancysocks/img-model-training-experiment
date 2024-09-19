import { NextResponse } from 'next/server';
import { saveImagesAction } from '@/actions/shoot-actions';

export async function POST(request: Request) {
  const { images, shootId } = await request.json();
  const result = await saveImagesAction(shootId, images);
  if (result.status === 'success') {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
}