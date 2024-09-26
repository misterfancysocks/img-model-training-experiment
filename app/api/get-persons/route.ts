import type { NextRequest } from 'next/server';
import { openDb } from '@/db/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ message: 'userId is required' }), { status: 400 });
    }

    const db = await openDb();
    const persons = await db.all(
      'SELECT id, firstName, lastName FROM persons WHERE userId = ?',
      [userId]
    );

    return new Response(JSON.stringify(persons), { status: 200 });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch persons' }), { status: 500 });
  }
}