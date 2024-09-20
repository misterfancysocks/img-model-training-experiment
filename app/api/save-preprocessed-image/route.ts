import { NextResponse } from 'next/server';
import { savePreprocessedImageAction } from '@/actions/shoot-actions';

export async function POST(request: Request) {
  try {
    const { shootId, imageId, beforeFileName, afterFileName, preprocessedUrl } = await request.json();
    
    const result = await savePreprocessedImageAction(
      shootId,
      imageId,
      beforeFileName,
      afterFileName,
      preprocessedUrl
    );

    if (result.status === 'success') {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in save-preprocessed-image API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}