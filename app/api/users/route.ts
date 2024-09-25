import { NextResponse } from 'next/server';
import { getUsers } from '@/actions/user-actions';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('\x1b[36m /api/users GET error:\x1b[0m', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}