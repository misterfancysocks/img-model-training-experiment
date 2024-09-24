import { NextResponse } from 'next/server';
import { savePreprocessedImageAction } from '@/actions/shoot-actions';

export async function POST(request: Request) {
  try {
    const { shootId, imageId, beforeFileName, afterFileName, preprocessedUrl, caption } = await request.json();
    
    const result = await savePreprocessedImageAction(
      shootId,
      imageId,
      beforeFileName,
      afterFileName,
      preprocessedUrl,
      caption
    );

    if (result.status === 'success') {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in save-preprocessed-image API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}