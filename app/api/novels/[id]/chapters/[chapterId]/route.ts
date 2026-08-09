// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string, chapterId: string }> }) {
  try {
    const { id, chapterId } = await params;
    
    // Fetch chapter
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (error) throw error;

    // Fetch novel info for title and navigation
    const { data: novel } = await supabase
      .from('novels')
      .select('id, title, slug, chapters(id, title, created_at)')
      .eq('id', id)
      .single();

    // Sort chapters
    if (novel?.chapters) {
      novel.chapters.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    // Find prev/next
    const chapters = novel?.chapters || [];
    const currentIndex = chapters.findIndex((c: any) => c.id === chapterId);
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

    return NextResponse.json({
      chapter,
      novel: { id: novel?.id, title: novel?.title, slug: novel?.slug },
      prevChapter,
      nextChapter,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    
    const { error } = await supabaseAdmin
      .from('chapters')
      .delete()
      .eq('id', chapterId);

    if (error) {
      console.error('[DELETE chapter error]', error);
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE chapter catch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string, chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const body = await req.json();

    console.log('[PUT chapter] chapterId:', chapterId, 'body keys:', Object.keys(body));
    
    const updatePayload: any = {
      title: body.title,
      content: body.content,
    };

    const { data, error } = await supabaseAdmin
      .from('chapters')
      .update(updatePayload)
      .eq('id', chapterId)
      .select()
      .single();

    if (error) {
      console.error('[PUT chapter error]', JSON.stringify(error));
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PUT chapter catch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
