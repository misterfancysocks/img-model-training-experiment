import { NextResponse } from 'next/server';
import { getShootsAction } from '@/actions/shoot-actions';

export async function GET() {
  const result = await getShootsAction();
  if (result.status === 'success') {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }
}