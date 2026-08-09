// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Search, X, BookOpen, Flame, Clock, Bookmark, List, Star } from 'lucide-react';
import Link from 'next/link';
import AnimeList from '../components/AnimeList'; // Reusing AnimeList since they share similar structure
import WidgetTitle from '../components/WidgetTitle';
import Sidebar from '../components/Sidebar';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';

export default function ComicHubPage() {
  const [data, setData] = useState<any>({ trending: [], popular: [], latest: [], berwarna: [], webtoons: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingIndex, setTrendingIndex] = useState(0);

  useEffect(() => {
    if (data.trending.length === 0) return;
    const interval = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % data.trending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data.trending.length]);

  useEffect(() => {
    const fetchHubData = () => {
      const parseSlug = (link: string) => {
        if (!link) return '';
        if (link.startsWith('/')) {
           const m = link.match(/\/manga\/([^/]+)/);
           if (m) return m[1];
           return link.replace(/^\/|\/$/g, '');
        }
        const urlMatch = link.match(/\/manga\/([^/]+)/);
        return urlMatch ? urlMatch[1] : link;
      };

      const hardcodedGenres = [
        { name: 'Action', slug: 'action' },
        { name: 'Romance', slug: 'romance' },
        { name: 'Fantasy', slug: 'fantasy' },
        { name: 'Adventure', slug: 'adventure' },
        { name: 'Comedy', slug: 'comedy' },
        { name: 'Drama', slug: 'drama' },
        { name: 'Isekai', slug: 'isekai' },
        { name: 'Magic', slug: 'magic' },
        { name: 'Martial Arts', slug: 'martial-arts' },
        { name: 'Shounen', slug: 'shounen' }
      ];

      setData(prev => ({ ...prev, genres: hardcodedGenres }));

      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) setLoading(false); // Stop loading after main APIs (terbaru & populer)
      };

      fetch('/api/comic/populer')
        .then(r => r.json())
        .then(res => {
          const parsedPop = (res.comics || res.data || []).map((c: any) => ({ ...c, slug: parseSlug(c.link || c.href || c.url) }));
          setData(prev => ({ ...prev, popular: parsedPop }));
        })
        .catch(console.error)
        .finally(checkDone);

      fetch('/api/comic/terbaru')
        .then(r => r.json())
        .then(res => {
          const parsedTerbaru = (res.comics || res.data || []).map((c: any) => ({ ...c, slug: parseSlug(c.link || c.href || c.url) }));
          setData(prev => ({ ...prev, latest: parsedTerbaru }));
        })
        .catch(console.error)
        .finally(checkDone);

      fetch('/api/comic/trending')
        .then(r => r.json())
        .then(res => {
          const parsedTrending = (res.trending || res.comics || res.data || []).map((c: any) => ({ ...c, slug: parseSlug(c.link || c.href || c.url) }));
          setData(prev => ({ ...prev, trending: parsedTrending }));
        })
        .catch(console.error);

      fetch('/api/comic/genres')
        .then(r => r.json())
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setData(prev => ({ ...prev, genres: res.data }));
          }
        })
        .catch(console.error);

      fetch('/api/comic/berwarna/1')
        .then(r => r.json())
        .then(res => {
          const parsedColored = (res.data?.results || []).map((c: any) => ({ ...c, slug: parseSlug(c.link || c.href || c.url) }));
          setData(prev => ({ ...prev, berwarna: parsedColored }));
        })
        .catch(console.error);

      fetch('/api/trending?source=webtoons')
        .then(r => r.json())
        .then(res => {
          setData(prev => ({ ...prev, webtoons: res.items || [] }));
        })
        .catch(console.error);
    };
    
    fetchHubData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const [comicRes, webtoonRes] = await Promise.all([
        fetch(`/api/comic/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&source=webtoons`).then(r => r.json()).catch(() => ({}))
      ]);
      
      let results: any[] = [];
      if (comicRes?.data) results = [...results, ...comicRes.data];
      
      if (webtoonRes?.items && Array.isArray(webtoonRes.items)) {
        const wt = webtoonRes.items.map((item: any) => ({ ...item, isWebtoon: true }));
        results = [...results, ...wt];
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
    <div className="flex-1 min-w-0 min-h-screen pb-24">
      <div className="px-4 sm:px-6 flex flex-col gap-8 pt-4">
        
        {/* 1. Slider Trending */}
        {!loading && data.trending.length > 0 && (
          <div className="relative w-full aspect-[4/5] sm:aspect-[21/9] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0a0a0f] group">
            {/* Blurred Background Glow for depth */}
            <div className="absolute inset-0 opacity-50 scale-125 saturate-200 blur-[40px] pointer-events-none transition-all duration-700">
              <img 
                src={`/api/image-proxy?url=${encodeURIComponent(data.trending[trendingIndex]?.poster || data.trending[trendingIndex]?.image)}`} 
                alt="" 
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+' }} 
              />
            </div>

            {/* Main Image */}
            <img 
              key={`hero-img-${trendingIndex}`}
              src={`/api/image-proxy?url=${encodeURIComponent(data.trending[trendingIndex]?.poster || data.trending[trendingIndex]?.image)}`} 
              alt={data.trending[trendingIndex]?.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-60 transition-all duration-1000 ease-out animate-in fade-in"
              onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+' }} 
            />

            {/* Cinematic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/40 to-transparent sm:bg-gradient-to-r sm:from-[#0D0D11] sm:via-[#0D0D11]/80 sm:to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-transparent opacity-90 sm:hidden"></div>

            {/* Content Box */}
            <div className="absolute bottom-0 left-0 p-5 pb-8 sm:p-8 lg:p-12 w-full sm:w-3/4 lg:w-2/3 flex flex-col justify-end h-full z-10">
              
              {/* Badges */}
              <div key={`hero-badges-${trendingIndex}`} className="flex items-center gap-2 mb-2 sm:mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="bg-transparent border border-rose-400/40 text-rose-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                  Trending #{trendingIndex + 1}
                </span>
                <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">
                  KOMIK
                </span>
              </div>

              {/* Title */}
              <h2 key={`hero-title-${trendingIndex}`} className="text-2xl sm:text-4xl font-bold text-white mb-2 leading-[1.2] line-clamp-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                {data.trending[trendingIndex]?.title}
              </h2>

              {/* Description */}
              <p key={`hero-desc-${trendingIndex}`} className="text-zinc-400 text-xs sm:text-sm mb-3 line-clamp-2 max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                Baca kelanjutan cerita seru dari {data.trending[trendingIndex]?.title}. Tersedia update chapter terbaru dengan kualitas terjemahan bahasa Indonesia terbaik.
              </p>

              {/* Info Row */}
              <div key={`hero-info-${trendingIndex}`} className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-zinc-300 mb-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                <span className="flex items-center gap-1.5 uppercase text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> {data.trending[trendingIndex]?.chapter || 'Baru'}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Clock size={14} className="text-zinc-500" /> Hari Ini
                </span>
              </div>

              {/* Action Buttons */}
              <div key={`hero-btn-${trendingIndex}`} className="flex flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <Link href={`/comic/detail/${data.trending[trendingIndex]?.slug}`} className="flex items-center justify-center gap-2 bg-[#b48796] hover:bg-[#a37685] text-[#1a1a1a] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-300 text-[11px] sm:text-sm hover:scale-105 active:scale-95 whitespace-nowrap">
                  <BookOpen size={16} className="fill-current" /> Baca Sekarang
                </Link>
              </div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 sm:bottom-6 right-5 sm:right-8 flex items-center gap-2 z-20">
              {data.trending.slice(0, 5).map((_: any, i: number) => (
                <button 
                  key={i}
                  onClick={(e) => { e.preventDefault(); setTrendingIndex(i); }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${trendingIndex === i ? 'w-6 sm:w-8 bg-blue-500' : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/60'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2. Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari judul komik..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-24 text-white text-sm focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors">
              Cari
            </button>
          </div>
          <Link href="/comic/advanced-search" className="w-12 h-[50px] bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </Link>
        </form>

        {/* Render Search Results if searching */}
        {(isSearching || searchResults.length > 0) ? (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">Hasil Pencarian</h2>
              <button onClick={() => {setSearchResults([]); setSearchQuery('');}} className="text-red-500 text-xs font-bold">Tutup</button>
            </div>
            {isSearching ? <div className="text-zinc-500">Mencari...</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                {searchResults.map((c: any, i: number) => (
                  <AnimeCard3 
                    key={i} 
                    item={{...c, type: c.isWebtoon ? 'Webtoon' : 'Komik'}} 
                    href={c.isWebtoon ? `/detail?url=${encodeURIComponent(c.url)}&source=webtoons` : `/comic/detail/${c.slug}`} 
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>


            {/* 3. Genres Horizontal Scroll */}
            <section>
              <h2 className="text-xs font-bold text-zinc-500 tracking-wider mb-3 uppercase">Genres</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {data.genres?.map((g: any, i: number) => (
                  <Link 
                    key={i} 
                    href={`/comic/list?genre=${g.slug}`}
                    className="whitespace-nowrap px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-xs text-zinc-300 hover:bg-amber-600 hover:text-white hover:border-amber-500 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* 4. Quick Menu */}
            <section>
              <h2 className="text-xs font-bold text-zinc-500 tracking-wider mb-3 uppercase">Quick Menu</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 bg-[#151728] p-4 rounded-2xl mb-8 border border-zinc-800/50 w-full">
                <Link href="/comic/bookmarks" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <Bookmark className="text-amber-400 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Bookmarks</span>
                </Link>
                <Link href="/comic/pustaka" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <BookOpen className="text-emerald-400 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Pustaka</span>
                </Link>
                <Link href="/comic/list?sort=trending" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <Flame className="text-orange-500 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Trending</span>
                </Link>
                <Link href="/comic/list?status=ongoing" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <Clock className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Ongoing</span>
                </Link>
                <Link href="/comic/list?status=completed" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Tamat</span>
                </Link>
                <Link href="/comic/type/manhwa" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  {/* South Korea Flag */}
                  <div className="w-7 h-5 rounded overflow-hidden group-hover:scale-110 transition-transform shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="28" height="20">
                      <rect width="900" height="600" fill="white"/>
                      {/* Trigrams - black bars simplified */}
                      <g fill="none" stroke="black" strokeWidth="30">
                        {/* Top-left trigram (Qian) */}
                        <line x1="132" y1="138" x2="212" y2="58"/>
                        <line x1="171" y1="178" x2="251" y2="98"/>
                        {/* Top-right trigram (Kan) */}
                        <line x1="688" y1="138" x2="768" y2="58"/>
                        <line x1="649" y1="178" x2="729" y2="98"/>
                        {/* Bottom-right trigram (Kon) */}
                        <line x1="688" y1="462" x2="768" y2="542"/>
                        <line x1="649" y1="422" x2="729" y2="502"/>
                        {/* Bottom-left trigram (Li) */}
                        <line x1="132" y1="462" x2="212" y2="542"/>
                        <line x1="171" y1="422" x2="251" y2="502"/>
                      </g>
                      {/* Taeguk circle */}
                      <circle cx="450" cy="300" r="130" fill="#cd2e3a"/>
                      <path d="M450 170 a130 130 0 0 1 0 260 a65 65 0 0 1 0-130 a65 65 0 0 0 0-130z" fill="#0047a0"/>
                      <circle cx="450" cy="235" r="32.5" fill="#0047a0"/>
                      <circle cx="450" cy="365" r="32.5" fill="#cd2e3a"/>
                    </svg>
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Manhwa</span>
                </Link>
                <Link href="/comic/type/manhua" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  {/* China Flag */}
                  <div className="w-7 h-5 rounded overflow-hidden group-hover:scale-110 transition-transform shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="28" height="20">
                      <rect width="900" height="600" fill="#DE2910"/>
                      {/* Large star */}
                      <polygon points="150,75 179,168 87,109 213,109 121,168" fill="#FFDE00"/>
                      {/* 4 small stars */}
                      <polygon points="255,30 264,57 240,41 270,41 246,57" fill="#FFDE00"/>
                      <polygon points="300,90 309,117 285,101 315,101 291,117" fill="#FFDE00"/>
                      <polygon points="300,165 309,192 285,176 315,176 291,192" fill="#FFDE00"/>
                      <polygon points="255,225 264,252 240,236 270,236 246,252" fill="#FFDE00"/>
                    </svg>
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Manhua</span>
                </Link>
                <Link href="/comic/type/manga" className="flex flex-col items-center justify-center gap-2 group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                  {/* Japan Flag */}
                  <div className="w-7 h-5 rounded overflow-hidden group-hover:scale-110 transition-transform shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="28" height="20">
                      <rect width="900" height="600" fill="white"/>
                      <circle cx="450" cy="300" r="180" fill="#BC002D"/>
                    </svg>
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium text-center">Manga</span>
                </Link>
              </div>
            </section>

          {/* Berwarna Section */}
          {data.berwarna.length > 0 && (
            <section className="mt-6 mb-2">
              <WidgetTitle title="Komik Full Warna" icon={<Flame size={20} className="text-orange-500" />} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-4 max-w-[1200px] mx-auto">
                {data.berwarna.slice(0, 10).map((c: any, i: number) => (
                  <AnimeCard3 
                    key={i} 
                    item={{...c, type: 'Full Warna'}} 
                    href={`/comic/detail/${c.slug}`} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* Webtoon Populer Section */}
          {data.webtoons && data.webtoons.length > 0 && (
            <section className="mt-6 mb-2">
              <WidgetTitle title="Webtoon Populer" href="/explore?source=webtoons" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-4 max-w-[1200px] mx-auto">
                {data.webtoons.slice(0, 10).map((item: any, i: number) => (
                  <AnimeCard3 
                    key={i} 
                    item={{...item, type: 'Webtoon'}} 
                    href={`/detail?url=${encodeURIComponent(item.url)}&source=webtoons`} 
                  />
                ))}
              </div>
            </section>
          )}
            {/* 5. Rekomendasi Populer */}
            {data.popular.length > 0 && (
              <section className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-yellow-400 rounded-full"></div>
                    Rekomendasi Populer
                  </h2>
                  <Link href="/comic/list?sort=populer" className="text-xs text-yellow-500 font-medium hover:text-yellow-400 transition-colors">Lihat Semua →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 max-w-[1200px] mx-auto">
                  {data.popular.slice(0, 10).map((c: any, i: number) => (
                    <AnimeCard3 
                      key={i} 
                      item={{...c, type: c.type || 'Manhwa', episode: c.chapter || c.episode}} 
                      href={`/comic/detail/${c.slug}`} 
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 6. Update Terbaru */}
            {data.latest.length > 0 && (
              <section className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                    Update Terbaru
                  </h2>
                  <Link href="/comic/pustaka" className="text-xs text-blue-400 font-medium hover:text-blue-300 transition-colors">Lihat Semua →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 max-w-[1200px] mx-auto">
                  {data.latest.map((c: any, i: number) => (
                    <AnimeCard3 
                      key={i} 
                      item={{...c, type: c.type || 'Manhwa', episode: c.chapter || c.episode}} 
                      href={`/comic/detail/${c.slug}`} 
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
    <Sidebar />
    </>
  );
}
