'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpCircle, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

export default function NovelReadPage() {
  const { id, chapterId } = useParams();
  const [novel, setNovel] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [prevChapter, setPrevChapter] = useState<any>(null);
  const [nextChapter, setNextChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    if (id && chapterId) {
      fetch(`/api/novels/${id}`)
        .then(res => res.json())
        .then(data => {
          setNovel(data);
          if (data.chapters) {
            const index = data.chapters.findIndex((c: any) => c.id === chapterId);
            if (index !== -1) {
              setChapter(data.chapters[index]);
              setPrevChapter(index > 0 ? data.chapters[index - 1] : null);
              setNextChapter(index < data.chapters.length - 1 ? data.chapters[index + 1] : null);
            }
          }
          setLoading(false);
        });
    }
  }, [id, chapterId]);

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (isAutoScrolling) {
      scrollInterval = setInterval(() => {
        window.scrollBy({ top: 1, left: 0, behavior: 'auto' });
        
        // Hentikan auto-scroll jika sudah mencapai bagian paling bawah halaman
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
          setIsAutoScrolling(false);
        }
      }, 30);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsAutoScrolling(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center animate-pulse text-[var(--color-text-dim)]">Memuat cerita...</div>;
  }

  if (!novel || !chapter) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Chapter tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-zinc-300 font-sans selection:bg-amber-500/30">
      {/* Immersive Header */}
      <header className={`fixed top-0 inset-x-0 z-50 bg-[#121214]/95 backdrop-blur-md border-b border-zinc-800/80 transition-transform duration-300 ${showUI ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/novel/${novel?.slug || id}`} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white line-clamp-1">{novel.title}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Reading Area (Click to toggle UI) */}
      <main 
        className="flex-1 w-full max-w-3xl mx-auto px-5 py-24 cursor-pointer select-none"
        onClick={() => setShowUI(!showUI)}
      >
        <h1 className="text-2xl md:text-3xl font-black mb-12 text-center text-white pb-6 border-b border-zinc-800/50">
          {chapter.title}
        </h1>
        
        <div className="max-w-none text-zinc-300 leading-[2.2] text-[1.05rem] md:text-[1.15rem] font-medium tracking-wide">
          {chapter.content.split('\n').map((paragraph: string, i: number) => {
            const text = paragraph.trim();
            if (!text) return null;
            return (
              <p key={i} className="mb-8">
                {text}
              </p>
            );
          })}
        </div>
      </main>

      {/* Webtoon-style Bottom Navigation Bar */}
      <div className={`fixed bottom-0 inset-x-0 z-50 bg-[#121214]/95 backdrop-blur-md border-t border-zinc-800/80 transition-transform duration-300 ${showUI ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          {prevChapter ? (
            <Link href={`/novel/${novel?.slug || id}/${prevChapter.id}`} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 hover:bg-zinc-800 rounded-lg text-xs sm:text-sm font-bold text-zinc-300 hover:text-white transition-colors">
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              <span>Sebelumnya</span>
            </Link>
          ) : (
            <div className="px-3 sm:px-4 py-2 opacity-0 cursor-default">
              <ChevronLeft size={18} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link href={`/novel/${novel?.slug || id}`} className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:bg-zinc-800 rounded-lg whitespace-nowrap">
              Daftar Chapter
            </Link>
          </div>

          {nextChapter ? (
            <Link href={`/novel/${novel?.slug || id}/${nextChapter.id}`} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-xs sm:text-sm font-bold text-white transition-colors">
              <span>Selanjutnya</span>
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </Link>
          ) : (
            <div className="px-3 sm:px-4 py-2 opacity-0 cursor-default">
              <ChevronRight size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Auto-scroll & Top (Hidden in immersive mode) */}
      <div className={`fixed bottom-24 right-4 sm:right-6 flex flex-col gap-3 z-40 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
 onClick={() => setIsAutoScrolling(!isAutoScrolling)}
          className={`p-3 rounded-full shadow-lg transition-all ${isAutoScrolling ? 'bg-amber-600 text-white shadow-amber-600/30' : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
          title={isAutoScrolling ? "Jeda Auto-Scroll" : "Mulai Auto-Scroll"}
        >
          {isAutoScrolling ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>
        <button 
 onClick={scrollToTop}
 className="p-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full hover:bg-zinc-700 transition-all "
 >
          <ArrowUpCircle size={22} />
        </button>
      </div>
    </div>
  );
}
