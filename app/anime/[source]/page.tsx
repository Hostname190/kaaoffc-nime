// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Search, Play, History, Calendar, Flame, Clock, Film, Eye, ChevronRight, Sparkles, CheckCircle, LayoutGrid, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import {  useRouter , useParams } from 'next/navigation';
import AnimeList from '../../components/AnimeList';
import Sidebar from '../../components/Sidebar';
import WidgetTitle from '../../components/WidgetTitle';
import { getAnimeHome, getAnimePopular } from '@/lib/anime-api';

export default function AnimeHomePage() {
  const params = useParams();
  const source = (params?.source as string) || 'animasu';

  const router = useRouter();
  const [homeData, setHomeData] = useState<any>(null);
  const [popularData, setPopularData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, popRes] = await Promise.all([
          getAnimeHome(source),
          getAnimePopular(1, source).catch(() => null)
        ]);
        setHomeData(homeRes?.data || homeRes?.home || homeRes);
        setPopularData(popRes?.animes || popRes?.data || []);
      } catch (error) {
        console.error("Failed to fetch anime data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [source]);

  let ongoingData = [];
  if (Array.isArray(homeData?.ongoing)) ongoingData = homeData.ongoing;
  else if (homeData?.ongoing?.animeList) ongoingData = homeData.ongoing.animeList;
  else if (homeData?.on_going) ongoingData = homeData.on_going;

  let completedData = [];
  if (Array.isArray(homeData?.completed)) completedData = homeData.completed;
  else if (homeData?.completed?.animeList) completedData = homeData.completed.animeList;
  else if (homeData?.complete) completedData = homeData.complete;

  // Auto slide hero
  useEffect(() => {
    if (ongoingData.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(5, ongoingData.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [ongoingData]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/anime/${source}/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const ongoingList = ongoingData.map((item: any) => ({
    title: item.title,
    poster: item.poster || item.thumb,
    href: `/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`,
    type: 'SERIES',
    status: 'ONGOING',
    episodes: item.episode || item.episodes
  }));

  const completeList = completedData.map((item: any) => ({
    title: item.title,
    poster: item.poster || item.thumb,
    href: `/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`,
    type: 'SERIES',
    status: 'TAMAT',
    episodes: item.episode || item.episodes
  }));

  const popularList = popularData.map((item: any) => ({
    title: item.title,
    poster: item.poster || item.thumb,
    href: `/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`,
    type: item.type || 'SERIES',
    status: item.status_or_day || item.status,
    episodes: item.episode || item.episodes
  }));

  const heroItem = ongoingList[heroIndex] || null;

  return (
    <>
      <div className="flex-1 min-w-0">

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm font-medium animate-pulse">Memuat data anime...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* HERO BANNER - Premium Redesign without shadows */}
          {heroItem && (
            <div className="relative w-full aspect-[4/5] sm:aspect-[21/9] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0a0a0f] group">
              {/* Blurred Background Glow for depth */}
              <div className="absolute inset-0 opacity-50 scale-125 saturate-200 blur-[40px] pointer-events-none">
                <img 
                  src={`/api/image-proxy?url=${encodeURIComponent(heroItem.poster)}`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Main Image */}
              <img 
                src={`/api/image-proxy?url=${encodeURIComponent(heroItem.poster)}`} 
                alt={heroItem.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-60 transition-all duration-1000 ease-out"
              />

              {/* Cinematic Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/40 to-transparent sm:bg-gradient-to-r sm:from-[#0D0D11] sm:via-[#0D0D11]/80 sm:to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-transparent opacity-90 sm:hidden"></div>

              {/* Content Box */}
              <div className="absolute bottom-0 left-0 p-5 pb-12 sm:pb-8 sm:p-8 lg:p-12 w-full sm:w-3/4 lg:w-2/3 flex flex-col justify-end h-full z-10">
                
                {/* Badges */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <span className="bg-transparent border border-rose-400/40 text-rose-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    Trending #{heroIndex + 1}
                  </span>
                  <span className="bg-purple-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">
                    {heroItem.type}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 leading-[1.2] line-clamp-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                  {heroItem.title}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 text-xs sm:text-sm mb-3 line-clamp-2 max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                  {heroItem.synopsis || `Saksikan kelanjutan cerita seru dari ${heroItem.title} dengan kualitas terbaik dan subtitle Indonesia. Jangan sampai ketinggalan episode terbarunya!`}
                </p>

                {/* Info Row (Status & Episodes) */}
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-zinc-300 mb-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Play size={10} className="fill-current text-zinc-400" /> {heroItem.status}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-zinc-400" /> {heroItem.episodes || 'TBA'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  <Link href={heroItem.href} className="flex items-center justify-center gap-2 bg-[#b48796] hover:bg-[#a37685] text-[#1a1a1a] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-300 text-[11px] sm:text-sm hover:scale-105 active:scale-95 whitespace-nowrap">
                    <Play size={14} className="fill-current" />
                    <span>Mulai Nonton</span>
                  </Link>
                  <Link href={heroItem.href} className="flex items-center justify-center bg-[#2a2a35] hover:bg-[#383846] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-300 text-[11px] sm:text-sm hover:scale-105 active:scale-95 whitespace-nowrap">
                    <span>Detail</span>
                  </Link>
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-5 sm:bottom-8 right-5 sm:right-8 flex gap-2 z-30">
                {ongoingList.slice(0, 5).map((_: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setHeroIndex(idx)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out ${
                      idx === heroIndex 
                        ? 'w-8 sm:w-10 bg-amber-500' 
                        : 'w-2 sm:w-2.5 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* QUICK MENU */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 w-full pt-2 pb-4">
            <Link href={`/anime/${source}/popular`} className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1D2A] flex items-center justify-center text-rose-500 hover:scale-110 transition-transform">
                <Flame size={22} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-300">Trending</span>
            </Link>
            <Link href={`/anime/${source}/ongoing`} className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1D2A] flex items-center justify-center text-blue-500 hover:scale-110 transition-transform">
                <PlayCircle size={22} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-300">Ongoing</span>
            </Link>
            <Link href={`/anime/${source}/completed`} className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1D2A] flex items-center justify-center text-emerald-500 hover:scale-110 transition-transform">
                <CheckCircle size={22} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-300">Tamat</span>
            </Link>
            <Link href={`/anime/${source}/schedule`} className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1D2A] flex items-center justify-center text-amber-500 hover:scale-110 transition-transform">
                <Calendar size={22} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-300">Jadwal</span>
            </Link>
            <Link href={`/anime/${source}/genre/movie`} className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1D2A] flex items-center justify-center text-purple-500 hover:scale-110 transition-transform">
                <Film size={22} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-300">Movie</span>
            </Link>
            <Link href={`/anime/${source}/unlimited`} className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1C1D2A] flex items-center justify-center text-zinc-400 hover:scale-110 transition-transform">
                <LayoutGrid size={22} className="sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-300">A-Z</span>
            </Link>
          </div>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} className="relative w-full flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Cari anime, movie, atau series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors bg-white/50 dark:bg-zinc-900/80 backdrop-blur-sm"
              />
            </div>
            <button type="submit" onClick={handleSearch} className="px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors shrink-0">
              Cari
            </button>
          </form>

          {/* POPULER */}
          {popularList.length > 0 && (
            <section>
              <WidgetTitle title="Anime Populer" href={`/anime/${source}/popular`} />
              <AnimeList items={popularList.slice(0, 15)} />
            </section>
          )}

          {/* SEDANG TAYANG */}
          {ongoingList.length > 0 && (
            <section>
              <WidgetTitle title="Sedang Tayang" href={`/anime/${source}/ongoing`} />
              <AnimeList items={ongoingList.slice(0, 15)} />
            </section>
          )}

          {/* TAMAT */}
          {completeList.length > 0 && (
            <section>
              <WidgetTitle title="Anime Tamat" href={`/anime/${source}/completed`} />
              <AnimeList items={completeList.slice(0, 15)} />
            </section>
          )}

          {/* UPDATE TERBARU */}
          {ongoingList.length > 5 && (
            <section>
              <WidgetTitle title="Update Terbaru" href={`/anime/${source}/ongoing`} />
              <AnimeList items={ongoingList.slice(5, 20)} />
            </section>
          )}

        </div>
      )}

    </div>
    <Sidebar />
    </>
  );
}
