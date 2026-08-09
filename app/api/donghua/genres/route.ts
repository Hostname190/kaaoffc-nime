import { NextResponse } from 'next/server';
import { getDonghuaGenres } from '@/lib/donghua-api';

export async function GET() {
  try {
    const data = await getDonghuaGenres();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
