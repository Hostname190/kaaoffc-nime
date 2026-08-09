'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, Maximize, Download, Home, BookOpen, List, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import MissionTracker from '../../../components/MissionTracker';

export default function ComicReadPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const [images, setImages] = useState<string[]>([]);
  const [nav, setNav] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [autoScroll, setAutoScroll] = useState(false);
  const [saveProgress, setSaveProgress] = useState(true);
  
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [showChaptersModal, setShowChaptersModal] = useState(false);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Auto Scroll Logic
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (autoScroll) {
      scrollInterval = setInterval(() => {
        window.scrollBy(0, 1);
      }, 20); // adjust speed as needed
    }
    return () => clearInterval(scrollInterval);
  }, [autoScroll]);

  useEffect(() => {
    if (!slug) return;
    
    const fetchChapter = async () => {
      try {
        // Fetch images
        const res = await fetch(`/api/comic/chapter/${slug}`);
        const json = await res.json();
        
        let imgArray = [];
        if (Array.isArray(json)) {
          imgArray = json;
        } else if (json && json.images) {
          imgArray = json.images;
        } else if (json && json.data) {
          imgArray = Array.isArray(json.data) ? json.data : (json.data.images || []);
        }
        setImages(imgArray);

        try {
          // Parse comic slug from chapter slug (e.g. "title-chapter-1" -> "title")
          const comicSlug = slug.replace(/-chapter-[\d\.]+.*$/, '').replace(/-ch-[\d\.]+.*$/, '');
          const detailRes = await fetch(`/api/comic/comic/${comicSlug}`);
          const detailJson = await detailRes.json();
          const chapters = detailJson.chapters || detailJson.chapterList || [];
          
          if (chapters.length > 0) {
            setAllChapters(chapters);
            // Find current chapter index
            // Note: chapters are usually sorted descending (latest first, so index 0 is newest)
            const currentIndex = chapters.findIndex((c: any) => 
              c.slug === slug || c.url?.includes(slug) || c.link?.includes(slug)
            );
            
            if (currentIndex !== -1) {
              // Next chapter (reading forward) is actually the PREVIOUS element in the array (currentIndex - 1)
              // Prev chapter (reading backward) is actually the NEXT element in the array (currentIndex + 1)
              const nextChap = currentIndex > 0 ? chapters[currentIndex - 1] : null;
              const prevChap = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
              
              const extractSlug = (chap: any) => {
                if (!chap) return null;
                if (chap.slug) return chap.slug;
                const link = chap.link || chap.url || '';
                return link.split('/').filter(Boolean).pop();
              };

              setNav({
                comicSlug: comicSlug,
                nextSlug: extractSlug(nextChap),
                prevSlug: extractSlug(prevChap)
              });
            } else {
              // Fallback if exact match not found
              setNav({ comicSlug });
            }
          }
        } catch (navErr) {
          console.warn("No navigation data available:", navErr);
        }

        // Auto-save history & EXP
        try {
          const comicSlug = slug.replace(/-chapter-[\d\.]+.*$/, '').replace(/-ch-[\d\.]+.*$/, '');
          const detailRes = await fetch(`/api/comic/comic/${comicSlug}`);
          const detailJson = await detailRes.json();
          
          if (detailJson && detailJson.title) {
            const histStr = localStorage.getItem('kaaoffc_history') || '[]';
            let hist = JSON.parse(histStr);
            if (!Array.isArray(hist)) hist = [];
            hist = hist.filter((h: any) => h.novelUrl !== `/comic/detail/${comicSlug}`);
            hist.unshift({
              title: detailJson.title,
              chapter: slug.split('-').pop() || '1',
              url: `/comic/read/${slug}`,
              novelUrl: `/comic/detail/${comicSlug}`,
              timestamp: Date.now()
            });
            localStorage.setItem('kaaoffc_history', JSON.stringify(hist.slice(0, 20)));

            if (user) {
              supabase.from('user_history').upsert({
                user_id: user.id,
                item_url: `/comic/detail/${comicSlug}`,
                title: detailJson.title,
                category: 'Comic',
                poster: detailJson.poster || detailJson.image || '',
                last_episode: slug.split('-').pop() || '1',
                updated_at: new Date().toISOString()
              } as any, { onConflict: 'user_id,item_url' } as any).then();

              if (!sessionStorage.getItem(`exp_read_comic_${slug}`)) {
                fetch('/api/add-exp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, action: 'read', amount: 5 })
                }).then(() => {
                  sessionStorage.setItem(`exp_read_comic_${slug}`, 'true');
                  supabase.auth.refreshSession();
                }).catch(console.error);
              }
            }
          }
        } catch (e) { }

      } catch (error) {
        console.error("Failed to fetch chapter:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapter();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D11] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 mt-4">Memuat Chapter...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 font-sans selection:bg-blue-500/30">
      <MissionTracker actionType="read_chapter" />
      
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#181920] border-b border-zinc-800 p-3 sm:px-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()} className="text-white hover:text-blue-500 transition-colors shrink-0 p-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-blue-500 font-bold text-sm sm:text-base line-clamp-1">
              {nav?.currentChapter || 'Loading Chapter...'}
            </h1>
            <p className="text-zinc-400 text-[10px] sm:text-xs line-clamp-1">
              Membaca Komik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-white ml-2">
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 hover:text-blue-500 transition-colors relative">
            <Settings size={18} />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:text-blue-500 transition-colors hidden sm:block">
            <Maximize size={18} />
          </button>
          <button onClick={() => alert('Fitur Download segera hadir!')} className="p-1.5 hover:text-blue-500 transition-colors">
            <Download size={18} />
          </button>
          <Link href="/comic" className="p-1.5 hover:text-blue-500 transition-colors">
            <Home size={18} />
          </Link>
        </div>
      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="fixed top-[60px] right-4 sm:right-6 z-[60] bg-[#1E202A] border border-zinc-700/50 rounded-xl shadow-2xl w-64 sm:w-72 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#181920]">
            <h3 className="text-white font-bold text-sm">Pengaturan</h3>
            <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          
          <div className="p-4 space-y-5">
            {/* Toggle 1 */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Simpan Progress</span>
              <button 
                onClick={() => setSaveProgress(!saveProgress)}
                className={`w-10 h-5 rounded-full relative transition-colors ${saveProgress ? 'bg-blue-500' : 'bg-zinc-600'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${saveProgress ? 'left-[22px]' : 'left-[3px]'}`}></div>
              </button>
            </div>
            
            {/* Toggle 2 */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Auto Scroll</span>
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`w-10 h-5 rounded-full relative transition-colors ${autoScroll ? 'bg-blue-500' : 'bg-zinc-600'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${autoScroll ? 'left-[22px]' : 'left-[3px]'}`}></div>
              </button>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Kecerahan: {brightness}%</span>
                <button onClick={() => setBrightness(100)} className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded">Reset</button>
              </div>
              <input 
                type="range" 
                min="20" 
                max="200" 
                value={brightness} 
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>
          </div>
        </div>
      )}

      <div 
        className="w-full mx-auto flex flex-col items-center min-h-screen pt-16 transition-all duration-300 bg-black"
        style={{ filter: `brightness(${brightness}%)` }}
      >
        {/* Warning Text */}
        <div className="w-full px-8 py-20 text-center flex items-center justify-center min-h-[300px]">
          <h2 className="text-white text-base sm:text-lg font-bold uppercase tracking-wide leading-relaxed max-w-lg">
            CERITA INI HANYALAH KARANGAN SEMATA, SEMUA YANG TERTURLIS DARI NAMA, TEMPAT DAN LAINNYA TIDAK ADA HUBUNGANNYA DENGAN DUNIA NYATA.
          </h2>
        </div>

        {images.length > 0 ? (
          images.map((img: string, i: number) => (
            <img 
              key={i} 
              src={`/api/image-proxy?url=${encodeURIComponent(img)}`} 
              alt={`Page ${i + 1}`} 
              loading="lazy"
              className="w-full h-auto object-contain block"
            />
          ))
        ) : (
          <div className="py-20 text-zinc-500">Gambar tidak ditemukan atau gagal memuat.</div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181920] border-t border-zinc-800 p-3 sm:px-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        
        {/* Prev Button */}
        {nav?.prevSlug ? (
          <Link href={`/comic/read/${nav.prevSlug}`} className="flex items-center gap-1 sm:gap-2 text-zinc-400 hover:text-white px-2 sm:px-4 py-2 font-bold transition-colors text-xs sm:text-sm">
            <ChevronLeft size={16} />
            Prev
          </Link>
        ) : (
          <button disabled className="flex items-center gap-1 sm:gap-2 text-zinc-600 px-2 sm:px-4 py-2 font-bold cursor-not-allowed text-xs sm:text-sm">
            <ChevronLeft size={16} />
            Prev
          </button>
        )}

        {/* Center Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href={`/comic/detail/${nav?.comicSlug || slug.replace(/-chapter-[\d\.]+.*$/, '').replace(/-ch-[\d\.]+.*$/, '')}`} className="p-2.5 sm:p-3 bg-[#242632] hover:bg-[#2d2f3d] rounded-lg text-white transition-colors border border-zinc-700/50 block">
            <BookOpen size={18} />
          </Link>
          <button onClick={() => setShowChaptersModal(true)} className="p-2.5 sm:p-3 bg-[#242632] hover:bg-[#2d2f3d] rounded-lg text-white transition-colors border border-zinc-700/50 block">
            <List size={18} />
          </button>
        </div>

        {/* Next Button */}
        {nav?.nextSlug ? (
          <Link href={`/comic/read/${nav.nextSlug}`} className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold transition-colors text-xs sm:text-sm min-w-[100px] sm:min-w-[120px] shadow-[0_0_15px_rgba(37,99,235,0.4)]">
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowChaptersModal(false)}>
          <div className="bg-[#151728] w-full sm:w-[400px] max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#1A1C30] rounded-t-2xl sm:rounded-t-2xl">
              <h3 className="text-white font-bold flex items-center gap-2"><List size={18} className="text-blue-400" /> Daftar Chapter</h3>
              <button onClick={() => setShowChaptersModal(false)} className="text-zinc-400 hover:text-white p-1 bg-[#242632] rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {allChapters.map((chap: any, i: number) => {
                const chapSlug = chap.slug || chap.link?.split('/').filter(Boolean).pop() || chap.url?.split('/').filter(Boolean).pop();
                const isCurrent = chapSlug === slug;
                return (
                  <Link 
                    href={`/comic/read/${chapSlug}`} 
                    key={i} 
                    onClick={() => setShowChaptersModal(false)}
                    className={`flex items-center justify-between p-3 sm:p-4 mb-2 rounded-xl transition-colors border ${isCurrent ? 'bg-blue-600/20 border-blue-500/50' : 'bg-[#1A1C30]/50 hover:bg-[#1A1C30] border-transparent hover:border-zinc-700'}`}
                  >
                    <span className={`text-sm font-bold truncate pr-4 ${isCurrent ? 'text-blue-400' : 'text-white'}`}>{chap.title || chap.chapter}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0">{chap.date || 'Baru'}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
