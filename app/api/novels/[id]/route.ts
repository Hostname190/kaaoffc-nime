// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cek apakah string adalah UUID
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let query = supabase
    .from('novels')
    .select('*, chapters(*)');
  
  if (isUUID(id)) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data, error } = await query.single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Sort chapters by creation date
  if (data.chapters) {
    data.chapters.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let query = supabase
    .from('novels')
    .delete();

  if (isUUID(id)) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const body = await req.json();
    const { title, synopsis, author, genre, status, thumbnail } = body;

    let query = supabase.from('novels').update({
      title, synopsis, author, genre, status, thumbnail
    });

    if (isUUID(id)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { error } = await query;

    if (error) {
      console.error('[PUT novel error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PUT novel catch]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
