import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/db/db';

export async function POST(req: NextRequest) {
  const { personId, imageId, preprocessedUrl, caption, llm } = await req.json();
  
  const db = await openDb();

  try {
    const result = await db.run(
      `INSERT INTO preprocessed_images (personId, imageId, preprocessedUrl, caption, llm) 
       VALUES (?, ?, ?, ?, ?)`,
      personId,
      imageId,
      preprocessedUrl,
      caption,
      llm
    );

    const savedImage = await db.get(`SELECT * FROM preprocessed_images WHERE id = ?`, result.lastID);

    return NextResponse.json(savedImage);
  } catch (error) {
    console.error('Error saving preprocessed image:', error);
    return NextResponse.json({ error: 'Failed to save preprocessed image' }, { status: 500 });
  } finally {
    await db.close();
  }
}