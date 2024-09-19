import { NextResponse } from 'next/server';
import { getLatestShootAction } from '@/actions/shoot-actions';

export async function GET() {
  const result = await getLatestShootAction();
  if (result.status === 'success') {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
}