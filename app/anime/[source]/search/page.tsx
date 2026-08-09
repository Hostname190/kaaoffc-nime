'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Search as SearchIcon, Compass, Flame, Sparkles, Star, Heart, PlayCircle, CheckCircle } from 'lucide-react';
import {  useRouter, useSearchParams , useParams } from 'next/navigation';
import AnimeCard3 from '../../components/AnimeCard3';
import { searchAnime, getAnimeOngoing } from '@/lib/anime-api';
import Sidebar from '../../../components/Sidebar';

function AnimeSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const source = (params?.source as string) || 'otakudesu';
  const urlQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(urlQuery);
  const [list, setList] = useState<any[]>([]);
  const [exploreList, setExploreList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!urlQuery);
  const [activeTab, setActiveTab] = useState('Semua');

  // 1. Fetch Explore Tabs
  useEffect(() => {
    if (!hasSearched) {
      const fetchExploreTab = async () => {
        setLoading(true);
        try {
          const { getAllAnime, getAnimePopular, getAnimeLatest, getAnimeOngoing, getAnimeCompleted } = await import('@/lib/anime-api');
          let res;
          
          if (activeTab === 'Semua') res = await getAllAnime(source);
          else if (activeTab === 'Hot' || activeTab === 'Ongoing') res = await getAnimeOngoing(1, source);
          else if (activeTab === 'Terbaru') res = await getAnimeLatest(1, source);
          else if (activeTab === 'Popular' || activeTab === 'Untukmu') res = await getAnimePopular(1, source);
          else if (activeTab === 'Tamat') res = await getAnimeCompleted(1, source);
          else res = await getAnimeOngoing(1, source);
          
          let items = res?.data?.animeList || res?.animeList || res?.animes || res?.data || res || [];
          if (!Array.isArray(items)) {
            items = [];
          }
          
          // Map to standard format if needed
          const mapped = items.map((item: any) => ({
            ...item,
            title: item.title || item.name,
            poster: item.poster || item.thumb,
            href: `/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`,
            type: 'explore',
            status: item.status || item.status_or_day || (activeTab === 'Tamat' ? 'TAMAT' : 'ONGOING')
          }));
          
          setExploreList(mapped);
        } catch (error) {
          console.error("Failed to fetch explore tab", error);
        } finally {
          setLoading(false);
        }
      };
      fetchExploreTab();
    }
  }, [activeTab, source, hasSearched]);

  // 2. Perform Search based on URL Query
  useEffect(() => {
    const performSearch = async (q: string) => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchAnime(q, 1, source);
        const items = res?.data?.animeList || res?.animeList || res?.animes || res?.search_results || (Array.isArray(res?.data) ? res.data : []);
        const mapped = (Array.isArray(items) ? items : []).map((item: any) => ({
          title: item.title,
          poster: item.poster || item.thumb,
          href: `/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`,
          type: item.type || 'explore',
          status: item.status || item.status_or_day || 'UNKNOWN',
          year: item.year || '2025',
          views: item.score || item.rating || item.episode || 'N/A'
        }));
        setList(mapped);
      } catch (error) {
        console.error("Failed to search anime", error);
      } finally {
        setLoading(false);
      }
    };

    if (urlQuery.trim()) {
      setQuery(urlQuery); // Sync local state
      performSearch(urlQuery);
    } else {
      setHasSearched(false);
      setList([]);
    }
  }, [urlQuery, source]);

  // 3. Handle Submit (Only updates URL)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.replace(`/anime/${source}/search?q=${encodeURIComponent(query)}`);
    } else {
      router.replace(`/anime/${source}/search`);
    }
  };

  const tabs = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Ongoing', label: 'Ongoing', icon: PlayCircle },
    { id: 'Tamat', label: 'Tamat', icon: CheckCircle },
    { id: 'Hot', label: 'Hot', icon: Flame },
    { id: 'Terbaru', label: 'Terbaru', icon: Sparkles },
    { id: 'Popular', label: 'Popular', icon: Star },
    { id: 'Untukmu', label: 'Untukmu', icon: Heart }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen text-white pb-24 font-sans w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-[#2A2B3D] hover:bg-[#3b3c54] flex items-center justify-center transition-colors">
            <ArrowLeft size={18} className="text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            <Compass size={20} className="text-[#f40f25]" />
            <h1 className="text-lg sm:text-xl font-bold text-white">Explore & Cari Anime</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="relative w-full md:w-[400px] flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari anime..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-20 text-white text-sm focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors">
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* Filter Pills */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveTab(tab.id);
                if (hasSearched) {
                  setQuery('');
                  router.replace(`/anime/${source}/search`);
                }
              }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-colors border ${
                isActive 
                  ? 'bg-amber-500 text-black shadow-md border-amber-500' 
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-amber-600 hover:text-white hover:border-amber-500'
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-black' : 'text-amber-500'} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : hasSearched && list.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Tidak ada hasil ditemukan untuk "{query}".</div>
        ) : hasSearched ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-white">Hasil Pencarian</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {list.map((item, i) => (
                <AnimeCard3 key={i} item={item} href={item.href} type="explore" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Explore Section Header */}
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-2 mb-2">
              <Flame size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-white">{activeTab}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {exploreList.map((item, i) => (
                <AnimeCard3 key={i} item={item} href={item.href || `/anime/${source}/detail/${item.animeId || item.id}`} type="explore" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnimeSearchPage() {
  const params = useParams();
  const source = (params?.source as string) || 'otakudesu';

  return (
    <>
      <Suspense fallback={<div className="min-h-screen pt-16 flex items-center justify-center"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <AnimeSearchContent />
      </Suspense>
      <Sidebar />
    </>
  );
}
