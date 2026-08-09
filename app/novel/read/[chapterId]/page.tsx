'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Settings, Maximize, Download, Home, List, X } from 'lucide-react';
import Link from 'next/link';
import MissionTracker from '../../../components/MissionTracker';
import { useAuth } from '../../../components/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function NovelReadPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.chapterId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'white' | 'sepia' | 'dark' | 'black'>('black');
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [saveProgress, setSaveProgress] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [showChaptersModal, setShowChaptersModal] = useState(false);

  useEffect(() => {
    const savedSize = localStorage.getItem('novel-font-size');
    const savedTheme = localStorage.getItem('novel-reader-theme');
    const savedFont = localStorage.getItem('novel-font-family');
    const savedSaveProg = localStorage.getItem('novel-save-progress');
    const savedAutoScroll = localStorage.getItem('novel-auto-scroll');
    if (savedSize) setFontSize(parseInt(savedSize));
    if (savedTheme) setReaderTheme(savedTheme as any);
    if (savedFont) setFontFamily(savedFont as any);
    if (savedSaveProg) setSaveProgress(savedSaveProg === 'true');
    if (savedAutoScroll) setAutoScroll(savedAutoScroll === 'true');
  }, []);

  // Auto Scroll Logic
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (autoScroll) {
      scrollInterval = setInterval(() => {
        window.scrollBy(0, 1);
      }, 30);
    }
    return () => clearInterval(scrollInterval);
  }, [autoScroll]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);

    const isOriginal = !chapterId.startsWith('sakura-');

    if (!isOriginal) {
      const slug = chapterId.replace('sakura-', '');
      fetch(`/api/novel/sakuranovel/read/${slug}`)
        .then(r => r.json())
        .then(json => {
          const payload = json?.data || json?.result;
          if (payload) {
            const nav = payload.navigation || payload.nav || {};
            const parentSlug = nav.parent_slug || nav.novel_slug || payload.novel_slug || '';

            setData({
              chapter: {
                title: payload.title || payload.chapter_title || '',
                content: payload.content || payload.chapter_content || '',
              },
              novel: {
                slug: parentSlug ? `sakura-${parentSlug}` : '',
                title: payload.novel_title || payload.novel || 'Novel',
              },
              prevChapter: nav.prev_slug ? { id: `sakura-${nav.prev_slug}` } : null,
              nextChapter: nav.next_slug ? { id: `sakura-${nav.next_slug}` } : null,
            });

            if (parentSlug) {
              fetch(`/api/novel/sakuranovel/detail/${parentSlug}`)
                .then(r => r.json())
                .then(detail => {
                  const detailPayload = detail?.data || detail?.result;
                  if (detailPayload?.chapters) setAllChapters(detailPayload.chapters);
                })
                .catch(() => {});
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Admin original novel
      fetch(`/api/chapter/${chapterId}`)
        .then(r => r.json())
        .then(json => {
          if (json && !json.error) {
            setData({
              chapter: {
                title: json.chapter.title,
                content: json.chapter.content,
              },
              novel: {
                slug: json.novel.id, // using ID as slug for original novels
                title: json.novel.title,
              },
              prevChapter: json.prevChapter ? { id: json.prevChapter.id } : null,
              nextChapter: json.nextChapter ? { id: json.nextChapter.id } : null,
            });
            if (json.allChapters) setAllChapters(json.allChapters);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [chapterId]);

  // History & EXP Sync
  useEffect(() => {
    if (data && data.novel && user) {
      const novelUrl = `/novel/detail/${data.novel.slug}`;

      const syncHistory = async () => {
        let poster = data.novel.poster || '';
        if (!poster && data.novel.slug) {
          try {
            const detailRes = await fetch(`/api/novel/sakuranovel/detail/${data.novel.slug.replace('sakura-', '')}`);
            const detailJson = await detailRes.json();
            const payload = detailJson?.data || detailJson?.result;
            if (payload?.thumbnail || payload?.poster || payload?.image) {
              poster = payload.thumbnail || payload.poster || payload.image;
            }
          } catch (e) {
            console.error("Failed to fetch novel poster for history fallback", e);
          }
        }

        supabase.from('user_history').upsert({
          user_id: user.id,
          item_url: novelUrl,
          title: data.novel.title,
          category: 'Novel',
          poster: poster,
          last_episode: chapterId.replace('sakura-', '').split('-').pop() || '1',
          updated_at: new Date().toISOString()
        } as any, { onConflict: 'user_id,item_url' } as any).then();
      };
      
      syncHistory();

      // Add EXP
      if (!sessionStorage.getItem(`exp_read_novel_${chapterId}`)) {
        fetch('/api/add-exp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'read', amount: 5 })
        }).then(() => {
          sessionStorage.setItem(`exp_read_novel_${chapterId}`, 'true');
          supabase.auth.refreshSession();
        }).catch(console.error);
      }
    }
  }, [data, user, chapterId]);

  const handleFontSize = (val: number) => { setFontSize(val); localStorage.setItem('novel-font-size', val.toString()); };
  const handleTheme = (theme: 'white' | 'sepia' | 'dark' | 'black') => { setReaderTheme(theme); localStorage.setItem('novel-reader-theme', theme); };
  const handleFontFamily = (font: 'sans' | 'serif') => { setFontFamily(font); localStorage.setItem('novel-font-family', font); };
  const handleSaveProgress = (val: boolean) => { setSaveProgress(val); localStorage.setItem('novel-save-progress', val.toString()); };
  const handleAutoScroll = (val: boolean) => { setAutoScroll(val); localStorage.setItem('novel-auto-scroll', val.toString()); };

  const themeStyles = {
    white: { bg: 'bg-white', text: 'text-zinc-800' },
    sepia: { bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]' },
    dark: { bg: 'bg-[#1a1a1a]', text: 'text-zinc-300' },
    black: { bg: 'bg-black', text: 'text-zinc-400' },
  };
  const theme = themeStyles[readerTheme];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-black items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 mt-4">Memuat Chapter...</p>
      </div>
    );
  }

  if (!data || !data.chapter) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-black items-center justify-center text-zinc-500">
        <BookOpen size={48} className="mb-4 opacity-30" />
        <p>Chapter tidak ditemukan.</p>
        <button onClick={() => router.back()} className="mt-4 text-pink-500 hover:underline">Kembali</button>
      </div>
    );
  }

  const { chapter, novel, prevChapter, nextChapter } = data;

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 ${theme.bg} ${theme.text} ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} selection:bg-pink-500/30`}>
      <MissionTracker actionType="read_chapter" />
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#181920] border-b border-zinc-800 p-3 sm:px-4 flex justify-between items-center shadow-md font-sans">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()} className="text-white hover:text-pink-500 transition-colors shrink-0 p-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-pink-400 font-bold text-sm sm:text-base line-clamp-1">
              {chapter.title || 'Loading Chapter...'}
            </h1>
            <p className="text-zinc-400 text-[10px] sm:text-xs line-clamp-1">
              {novel?.title || 'Sakura Novel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-white ml-2">
          <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 transition-colors relative rounded-lg ${showSettings ? 'bg-pink-600 text-white' : 'hover:text-pink-500'}`}>
            <Settings size={18} />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:text-pink-500 transition-colors hidden sm:block">
            <Maximize size={18} />
          </button>
          <Link href="/novel" className="p-1.5 hover:text-pink-500 transition-colors">
            <Home size={18} />
          </Link>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed top-[60px] right-4 sm:right-6 z-[60] bg-[#1E202A] border border-zinc-700/50 rounded-xl shadow-2xl w-72 sm:w-80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          <div className="p-4 space-y-6">
            {/* Theme */}
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tema</span>
              <div className="flex gap-3">
                <button onClick={() => handleTheme('white')} className={`w-12 h-8 rounded border-2 transition-all bg-white ${readerTheme === 'white' ? 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-transparent'}`}></button>
                <button onClick={() => handleTheme('sepia')} className={`w-12 h-8 rounded border-2 transition-all bg-[#f4ecd8] ${readerTheme === 'sepia' ? 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-transparent'}`}></button>
                <button onClick={() => handleTheme('dark')} className={`w-12 h-8 rounded border-2 transition-all bg-[#1a1a1a] ${readerTheme === 'dark' ? 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-zinc-700'}`}></button>
                <button onClick={() => handleTheme('black')} className={`w-12 h-8 rounded border-2 transition-all bg-black ${readerTheme === 'black' ? 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-zinc-700'}`}></button>
              </div>
            </div>
            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ukuran Font: {fontSize}PX</span>
              </div>
              <input type="range" min="12" max="40" value={fontSize} onChange={(e) => handleFontSize(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            </div>
            {/* Font Type */}
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Jenis Font</span>
              <div className="flex bg-black p-1 rounded-lg">
                <button onClick={() => handleFontFamily('sans')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${fontFamily === 'sans' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Sans</button>
                <button onClick={() => handleFontFamily('serif')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${fontFamily === 'serif' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Serif</button>
              </div>
            </div>

            <div className="h-[1px] bg-zinc-800 w-full my-2"></div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Simpan Progress</span>
                <button onClick={() => handleSaveProgress(!saveProgress)} className={`w-10 h-5 rounded-full relative transition-colors ${saveProgress ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-all ${saveProgress ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Auto Scroll</span>
                <button onClick={() => handleAutoScroll(!autoScroll)} className={`w-10 h-5 rounded-full relative transition-colors ${autoScroll ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-all ${autoScroll ? 'left-[22px]' : 'left-[2px]'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-16 py-8 mt-16 mb-16 cursor-pointer"
        onClick={() => setShowSettings(false)}
      >
        <h2 className={`text-xl sm:text-2xl font-bold mb-10 ${readerTheme === 'black' || readerTheme === 'dark' ? 'text-zinc-200' : 'text-black'}`}>{chapter.title}</h2>
        <div
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontSize: `${fontSize}px`, lineHeight: '2' }}
          dangerouslySetInnerHTML={{ __html: chapter.content?.replace(/\n/g, '<br/><br/>') || '<p>Tidak ada konten.</p>' }}
        />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181920] border-t border-zinc-800 p-3 sm:px-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)] font-sans">
        {prevChapter ? (
          <Link href={`/novel/read/${prevChapter.id}`} className="flex items-center gap-1 sm:gap-2 text-zinc-400 hover:text-white px-2 sm:px-4 py-2 font-bold transition-colors text-xs sm:text-sm">
            <ChevronLeft size={16} />
            Prev
          </Link>
        ) : (
          <button disabled className="flex items-center gap-1 sm:gap-2 text-zinc-600 px-2 sm:px-4 py-2 font-bold cursor-not-allowed text-xs sm:text-sm">
            <ChevronLeft size={16} />
            Prev
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          {novel?.slug && (
            <Link href={`/novel/detail/${novel.slug}`} className="p-2.5 sm:p-3 bg-[#242632] hover:bg-[#2d2f3d] rounded-lg text-white transition-colors border border-zinc-700/50 block">
              <BookOpen size={18} />
            </Link>
          )}
          <button onClick={() => setShowChaptersModal(true)} className="p-2.5 sm:p-3 bg-[#242632] hover:bg-[#2d2f3d] rounded-lg text-white transition-colors border border-zinc-700/50 block">
            <List size={18} />
          </button>
        </div>

        {nextChapter ? (
          <Link href={`/novel/read/${nextChapter.id}`} className="flex items-center justify-center gap-1 sm:gap-2 bg-pink-600 hover:bg-pink-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold transition-colors text-xs sm:text-sm min-w-[100px] sm:min-w-[120px] shadow-[0_0_15px_rgba(236,72,153,0.4)]">
            Next
            <ChevronRight size={16} />
          </Link>
        ) : (
          <button disabled className="flex items-center justify-center gap-1 sm:gap-2 bg-zinc-800 text-zinc-500 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold cursor-not-allowed text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]">
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Chapter List Modal */}
      {showChaptersModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm font-sans" onClick={() => setShowChaptersModal(false)}>
          <div className="bg-[#151728] w-full sm:w-[400px] max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#1A1C30] rounded-t-2xl sm:rounded-t-2xl">
              <h3 className="text-white font-bold flex items-center gap-2"><List size={18} className="text-pink-400" /> Daftar Chapter</h3>
              <button onClick={() => setShowChaptersModal(false)} className="text-zinc-400 hover:text-white p-1 bg-[#242632] rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {allChapters.map((chap: any, i: number) => {
                const isOriginal = !chapterId.startsWith('sakura-');
                const chapSlug = chap.slug || chap.id;
                const isCurrent = isOriginal ? chap.id === chapterId : (`sakura-${chapSlug}` === chapterId || chapSlug === chapterId);
                const chapterHref = isOriginal ? `/novel/read/${chap.id}` : `/novel/read/sakura-${chapSlug}`;
                
                const formatChapterTitle = (rawTitle: string, novelTitle: string) => {
                  if (!rawTitle) return `Chapter ${i + 1}`;
                  let clean = rawTitle;
                  if (novelTitle && clean.toLowerCase().includes(novelTitle.toLowerCase())) {
                    clean = clean.replace(new RegExp(novelTitle, 'ig'), '').trim();
                  }
                  clean = clean.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '');
                  const chapMatch = clean.match(/chapter\s*\d+/i);
                  if (chapMatch) return chapMatch[0];
                  return clean || rawTitle;
                };
                
                const displayTitle = formatChapterTitle(chap.title || chap.chapter || '', data?.novel?.title || '');

                return (
                  <Link
                    href={chapterHref}
                    key={i}
                    onClick={() => setShowChaptersModal(false)}
                    className={`flex items-center justify-between p-3 sm:p-4 mb-2 rounded-xl transition-colors border ${isCurrent ? 'bg-pink-600/20 border-pink-500/50' : 'bg-[#1A1C30]/50 hover:bg-[#1A1C30] border-transparent hover:border-zinc-700'}`}
                  >
                    <span className={`text-sm font-bold truncate pr-4 ${isCurrent ? 'text-pink-400' : 'text-white'}`}>{displayTitle}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0">{chap.date || chap.released || 'Baru'}</span>
                  </Link>
                );
              })}
              {allChapters.length === 0 && (
                <div className="text-center py-10 text-zinc-500 text-sm">Gagal memuat daftar chapter.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
