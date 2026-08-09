'use client';

import { useState, useEffect } from 'react';
import WidgetTitle from '../components/WidgetTitle';
import AnimeList from '../components/AnimeList';
import Sidebar from '../components/Sidebar';
import { Play, Calendar, List } from 'lucide-react';
import Link from 'next/link';

export default function DonghuaPage() {
  const [donghua, setDonghua] = useState<any>({ recent: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/donghua/home');
        const data = await res.json();
        if (data && !data.error) {
          setDonghua(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto slide hero banner
  useEffect(() => {
    if (!donghua.recent || donghua.recent.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(5, donghua.recent.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [donghua.recent]);

  const heroItem = donghua.recent?.[heroIndex];

  return (
    <>
      <div className="flex-1 min-w-0">

        
        {loading ? (
          <div className="flex flex-col gap-8">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {heroItem && (
              <div className="relative w-full aspect-[4/5] sm:aspect-[21/9] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0a0a0f] group">
                {/* Blurred Background Glow for depth */}
                <div className="absolute inset-0 opacity-50 scale-125 saturate-200 blur-[40px] pointer-events-none transition-all duration-700">
                  <img 
                    src={`/api/image-proxy?url=${encodeURIComponent(heroItem.poster)}`} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Main Image */}
                <img 
                  key={`hero-img-${heroIndex}`}
                  src={`/api/image-proxy?url=${encodeURIComponent(heroItem.poster)}`} 
                  alt={heroItem.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-60 transition-all duration-1000 ease-out animate-in fade-in"
                />

                {/* Cinematic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/40 to-transparent sm:bg-gradient-to-r sm:from-[#0D0D11] sm:via-[#0D0D11]/80 sm:to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-transparent opacity-90 sm:hidden"></div>

                {/* Content Box */}
                <div className="absolute bottom-0 left-0 p-5 pb-8 sm:p-8 lg:p-12 w-full sm:w-3/4 lg:w-2/3 flex flex-col justify-end h-full z-10">
                  
                  {/* Badges */}
                  <div key={`hero-badges-${heroIndex}`} className="flex items-center gap-2 mb-2 sm:mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="bg-transparent border border-rose-400/40 text-rose-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                      Trending #{heroIndex + 1}
                    </span>
                    <span className="bg-purple-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">
                      DONGHUA
                    </span>
                  </div>

                  {/* Title */}
                  <h2 key={`hero-title-${heroIndex}`} className="text-2xl sm:text-4xl font-bold text-white mb-2 leading-[1.2] line-clamp-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    {heroItem.title}
                  </h2>

                  {/* Description */}
                  <p key={`hero-desc-${heroIndex}`} className="text-zinc-400 text-xs sm:text-sm mb-3 line-clamp-2 max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                    Saksikan kelanjutan petualangan seru dari {heroItem.title} dengan kualitas terbaik dan subtitle Indonesia. Jangan sampai ketinggalan episode terbarunya!
                  </p>

                  {/* Info Row (Status & Episodes) */}
                  <div key={`hero-info-${heroIndex}`} className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-zinc-300 mb-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    <span className="flex items-center gap-1.5 uppercase">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {heroItem.status || 'ONGOING'}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Calendar size={14} className="text-zinc-400" /> {heroItem.episode || 'Baru'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div key={`hero-btn-${heroIndex}`} className="flex flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <Link href={heroItem.href} className="flex items-center justify-center gap-2 bg-[#b48796] hover:bg-[#a37685] text-[#1a1a1a] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-300 text-[11px] sm:text-sm hover:scale-105 active:scale-95 whitespace-nowrap">
                      <Play size={16} className="fill-current" /> Mulai Nonton
                    </Link>
                    <Link href={heroItem.href} className="flex items-center justify-center gap-2 bg-[#2a2a35] hover:bg-[#383846] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-300 text-[11px] sm:text-sm hover:scale-105 active:scale-95 whitespace-nowrap">
                      <List size={16} /> Detail
                    </Link>
                  </div>
                </div>
                
                {/* Carousel Indicators */}
                <div className="absolute bottom-4 sm:bottom-6 right-5 sm:right-8 flex items-center gap-2 z-20">
                  {donghua.recent.slice(0, 5).map((_: any, i: number) => (
                    <button 
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${heroIndex === i ? 'w-6 sm:w-8 bg-rose-500' : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/60'}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <section>
              <WidgetTitle title="Episode Terbaru" href="/donghua/ongoing" />
              <AnimeList items={donghua.recent.slice(0, 15)} />
            </section>

            <section>
              <WidgetTitle title="Donghua Tamat" href="/search?source=donghua" />
              <AnimeList items={donghua.completed.slice(0, 15)} />
            </section>
          </div>
        )}
      </div>
      <Sidebar />
    </>
  );
}
