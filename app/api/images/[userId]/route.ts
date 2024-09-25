import { NextResponse } from 'next/server';
import { openDb } from '@/db/db';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const db = await openDb();

  try {
    const images = await db.all(`
      SELECT gi.id, gi.fullUrl, gi.seed, gp.userInput, gp.fullPrompt
      FROM persons p
      JOIN loras l ON p.id = l.personId
      JOIN generated_images gi ON gi.loraId = l.id
      LEFT JOIN generation_prompts gp ON gi.generatedPromptId = gp.id
      WHERE p.userId = ?
      ORDER BY gi.created_at DESC
    `, userId);

    return NextResponse.json(images);
  } catch (error) {
    console.error('\x1b[36m /api/images/[userId] GET error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  } finally {
    await db.close();
  }
}