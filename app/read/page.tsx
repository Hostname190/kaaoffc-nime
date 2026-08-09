'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpCircle, BookOpen, ChevronLeft, ChevronRight, Download, Home, List, Maximize, Settings, X } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

function ReadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');
  const source = searchParams.get('source') || 'webtoons';
  const nextUrl = searchParams.get('next');
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [autoScroll, setAutoScroll] = useState(false);
  const [saveProgress, setSaveProgress] = useState(true);

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
    if (!url) return;
    setLoading(true);
    fetch(`/api/read?url=${encodeURIComponent(url)}&source=${source}`)
      .then(res => res.json())
      .then(data => {
        setImages(data.images || []);
        setLoading(false);
        
        // Berikan EXP untuk membaca (hanya sekali per chapter per sesi)
        if (user && !sessionStorage.getItem(`exp_read_${url}`)) {
          fetch('/api/add-exp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, action: 'read', amount: 5 })
          }).then(() => {
            sessionStorage.setItem(`exp_read_${url}`, 'true');
            import('@/lib/supabase').then(({ supabase }) => {
              supabase.auth.refreshSession();
            });
          }).catch(console.error);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [url, source, user]);

  if (!url) {
    return <div className="min-h-screen bg-[#0D0D11] text-center p-8 text-red-500 font-bold">Error: URL diperlukan</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D11] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 mt-4">Memuat Chapter...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 font-sans selection:bg-blue-500/30 relative">
      
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#181920] border-b border-zinc-800 p-3 sm:px-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()} className="text-white hover:text-blue-500 transition-colors shrink-0 p-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-blue-500 font-bold text-sm sm:text-base line-clamp-1">
              Membaca Chapter
            </h1>
            <p className="text-zinc-400 text-[10px] sm:text-xs line-clamp-1">
              {source === 'webtoons' ? 'Webtoon Reader' : 'Komik Reader'}
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
              className="w-full h-auto object-contain block max-w-2xl"
            />
          ))
        ) : (
          <div className="py-20 text-zinc-500">Gambar tidak ditemukan atau gagal memuat.</div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181920] border-t border-zinc-800 p-3 sm:px-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        
        {/* Prev Button (Placeholder since generic API might not have prev) */}
        <button disabled className="flex items-center gap-1 sm:gap-2 text-zinc-600 px-2 sm:px-4 py-2 font-bold cursor-not-allowed text-xs sm:text-sm">
          <ChevronLeft size={16} />
          Prev
        </button>

        {/* Center Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => router.back()} className="p-2.5 sm:p-3 bg-[#242632] hover:bg-[#2d2f3d] rounded-lg text-white transition-colors border border-zinc-700/50 block">
            <BookOpen size={18} />
          </button>
        </div>

        {/* Next Button */}
        {nextUrl ? (
          <Link href={`/read?url=${encodeURIComponent(nextUrl)}&source=${source}`} className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold transition-colors text-xs sm:text-sm min-w-[100px] sm:min-w-[120px] shadow-[0_0_15px_rgba(37,99,235,0.4)]">
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
    </div>
  );
}

export default function ReadPage() {
  return (
    <div className="flex-1 min-w-0">
      <Suspense fallback={<div className="flex h-[60vh] items-center justify-center text-sm text-zinc-400 animate-pulse">Memulai reader...</div>}>
        <ReadContent />
      </Suspense>
    </div>
  );
}
