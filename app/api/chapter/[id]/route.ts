// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chapterId } = await params;
    
    // Fetch chapter
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (error) throw error;

    const novelId = chapter.novel_id;

    // Fetch novel info for title and navigation
    const { data: novel } = await supabase
      .from('novels')
      .select('id, title, slug, chapters(id, title, created_at)')
      .eq('id', novelId)
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
      allChapters: chapters
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
