import { NextResponse } from 'next/server';
import { getDonghuaByGenre } from '@/lib/donghua-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const page = searchParams.get('page') || '1';

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    const data = await getDonghuaByGenre(slug, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch donghua by genre' }, { status: 500 });
  }
}
