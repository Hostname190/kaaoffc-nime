'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, PlayCircle, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import {  useRouter , useParams } from 'next/navigation';
import AnimeCard3 from '../../components/AnimeCard3';
import { getAnimePopular } from '@/lib/anime-api';

import Sidebar from '../../../components/Sidebar';

export default function AnimePopularPage() {
  const params = useParams();
  const source = (params?.source as string) || 'otakudesu';

  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPopular = async (p: number) => {
    setLoading(true);
    try {
      const res = await getAnimePopular(p, source);
      const items = res?.data?.animeList || res?.animeList || res?.popular_anime || res?.animes || (Array.isArray(res?.data) ? res.data : []);
      const mapped = items.map((item: any) => ({
        title: item.title,
        poster: item.poster || item.thumb,
        href: `/anime/${source}/detail/${item.animeId || item.id}`,
        type: 'explore',
        status: item.status || item.status_or_day || 'POPULAR',
        year: '2026',
        views: item.episodes || item.episode || 'Hot'
      }));
      setList(mapped);
    } catch (error) {
      console.error("Failed to fetch popular", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopular(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <>
    <div className="flex-1 flex flex-col min-h-screen text-white pb-24 font-sans w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-[#2A2B3D] hover:bg-[#3b3c54] flex items-center justify-center transition-colors">
          <ChevronLeft size={18} className="text-zinc-400" />
        </button>
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-[#f40f25]" />
          <h1 className="text-lg sm:text-xl font-bold text-white">Anime Trending / Populer</h1>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Belum ada anime populer.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {list.map((item, i) => (
                <AnimeCard3 key={i} item={item} href={item.href} type="explore" />
              ))}
            </div>

            <div className="flex justify-center items-center gap-4 mt-8">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A2B3D] hover:bg-[#3b3c54] disabled:opacity-50 rounded-xl font-bold text-sm transition-colors text-zinc-300"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="font-bold text-rose-500 bg-rose-500/10 w-10 h-10 flex items-center justify-center rounded-xl">
                {page}
              </span>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={list.length < 10}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A2B3D] hover:bg-[#3b3c54] disabled:opacity-50 rounded-xl font-bold text-sm transition-colors text-zinc-300"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    <Sidebar />
    </>
  );
}
