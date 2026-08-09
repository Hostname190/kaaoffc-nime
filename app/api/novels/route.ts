// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET() {
  const { data, error } = await supabase
    .from('novels')
    .select('*, novel_chapters(id, title, created_at)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const baseSlug = generateSlug(body.title);
    
    // Pastikan slug unik
    const { data: existing } = await supabase
      .from('novels')
      .select('slug')
      .like('slug', `${baseSlug}%`);
    
    let slug = baseSlug;
    if (existing && existing.length > 0) {
      slug = `${baseSlug}-${existing.length}`;
    }

    const { data, error } = await supabase
      .from('novels')
      .insert([{
        title: body.title,
        author: body.author,
        synopsis: body.synopsis,
        genre: body.genre,
        status: body.status,
        thumbnail: body.thumbnail,
        slug: slug,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
