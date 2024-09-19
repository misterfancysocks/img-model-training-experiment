import { NextResponse } from 'next/server';
import { getShootDetails } from '@/actions/shoot-actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Shoot ID is required' }, { status: 400 });
  }

  const result = await getShootDetails(parseInt(id, 10));
  if (result.status === 'success') {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }
}