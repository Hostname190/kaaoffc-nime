'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Film, Layers, MonitorPlay, Zap, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import AnimeCard3 from '../../../components/AnimeCard3';
import { getAnimeByGenre } from '@/lib/anime-api';
import Sidebar from '../../../../components/Sidebar';

export default function AnimeGenreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const source = (params?.source as string) || 'otakudesu';

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchByGenre = async (p: number) => {
    setLoading(true);
    try {
      let res;
      if (slug.toLowerCase() === 'movie') {
        const { getAnimeMovies } = await import('@/lib/anime-api');
        res = await getAnimeMovies(p, source);
      } else if (slug.toLowerCase() === 'series' && source === 'animasu') {
        const { getAnimeOngoing } = await import('@/lib/anime-api');
        res = await getAnimeOngoing(p, source);
      } else if (slug.toLowerCase() === 'series' || slug.toLowerCase() === 'special' || slug.toLowerCase() === 'ona' || slug.toLowerCase() === 'ova') {
        // Fallback for types that might not have explicit endpoints
        const { getAnimeOngoing } = await import('@/lib/anime-api');
        res = await getAnimeOngoing(p, source);
      } else {
        res = await getAnimeByGenre(slug, p, source);
      }

      const items = res?.data?.animeList || res?.animeList || res?.animes || (Array.isArray(res?.data) ? res.data : []);
      const mapped = items.map((item: any) => ({
        title: item.title,
        poster: item.poster || item.thumb,
        href: `/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`,
        type: slug.toUpperCase() === 'MOVIE' ? 'MOVIE' : 'SERIES',
        status: item.status || 'UNKNOWN',
        year: item.year || '2026',
        views: item.episodes || item.episode || 'N/A Eps'
      }));
      setList(mapped);
    } catch (error) {
      console.error("Failed to fetch anime by genre", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    fetchByGenre(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, page]);

  const isFormatPage = ['movie', 'series', 'special', 'ona', 'ova'].includes(slug.toLowerCase());

  const formatTabs = [
    { id: 'movie', label: 'Movie', icon: Film },
    { id: 'series', label: 'Series', icon: MonitorPlay },
    { id: 'special', label: 'Special', icon: Zap },
    { id: 'ona', label: 'ONA', icon: Tv }
  ];

  return (
    <>
      <div className="flex-1 flex flex-col min-h-screen text-white pb-24 font-sans w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      
      {/* Header */}
      {isFormatPage ? (
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-[#2A2B3D] hover:bg-[#3b3c54] flex items-center justify-center transition-colors">
            <ChevronLeft size={18} className="text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            <Film size={20} className="text-[#f40f25]" />
            <h1 className="text-lg sm:text-xl font-bold text-white capitalize">
              Format: {slug}
            </h1>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-[#2A2B3D] hover:bg-[#3b3c54] flex items-center justify-center transition-colors">
            <ChevronLeft size={18} className="text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-[#f40f25]" />
            <h1 className="text-lg sm:text-xl font-bold text-white capitalize">
              Genre: {slug.replace(/-/g, ' ')}
            </h1>
          </div>
        </div>
      )}

      {/* Filter Pills for Format Pages */}
      {isFormatPage && (
        <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2">
          {formatTabs.map((tab, idx) => {
            const isActive = slug === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={idx}
                onClick={() => router.push(`/anime/${source}/genre/${tab.id}`)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
                  isActive 
                    ? 'bg-[#60a5fa] text-blue-950 shadow-md' 
                    : 'bg-[#2A2B3D] text-zinc-300 hover:bg-[#3b3c54]'
                }`}
              >
                {Icon && <Icon size={14} className={isActive ? 'text-blue-950' : 'text-amber-500'} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Tidak ada anime untuk genre ini.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {list.map((item, i) => (
                <AnimeCard3 key={i} item={item} href={item.href} type={slug === 'movie' ? 'movie' : 'explore'} />
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
              <span className="font-bold text-[#60a5fa] bg-[#60a5fa]/10 w-10 h-10 flex items-center justify-center rounded-xl">
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
