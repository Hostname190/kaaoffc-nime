'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllAnime } from '@/lib/anime-api';
import AnimeCard3 from '../../components/AnimeCard3';
import Sidebar from '../../../components/Sidebar';

export default function AnimeUnlimitedPage() {
  const params = useParams();
  const source = (params?.source as string) || 'otakudesu';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getAllAnime(page, source);
        
        let items = res?.data?.animeList || res?.animeList || res?.animes || res?.data || res || [];
        if (!Array.isArray(items) && items?.anime_list) {
          items = items.anime_list;
        }
        if (!Array.isArray(items)) items = [];
        
        // Handle pagination state if available
        if (res?.pagination) {
          setHasNext(res.pagination.hasNext);
        } else if (items.length < 10) {
          setHasNext(false);
        } else {
          setHasNext(true);
        }

        setData(items);
      } catch (error) {
        console.error("Failed to fetch unlimited anime", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, source]);

  return (
    <>
    <div className="min-h-screen pt-16 text-white pb-24">
      <div className="w-full h-[180px] sm:h-[220px] relative overflow-hidden flex items-center justify-center mb-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2A2B3D] to-[#1a1a2e] z-0"></div>
        <div className="absolute inset-0 opacity-20 z-0 bg-[url('https://otakudesu.blog/wp-content/uploads/2021/05/One-Piece-Sub-Indo.jpg')] bg-cover bg-center blur-sm"></div>
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 tracking-tight flex items-center justify-center gap-3">
            <Sparkles className="text-[#60a5fa] w-8 h-8 sm:w-12 sm:h-12" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Unlimited Anime
            </span>
            <Sparkles className="text-[#60a5fa] w-8 h-8 sm:w-12 sm:h-12" />
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto font-medium">
            Jelajahi seluruh koleksi anime tanpa batas. Temukan tontonan favoritmu dari berbagai genre dan musim.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {data.map((item: any, i: number) => {
                const mappedItem = {
                  title: item.title || item.name || '',
                  poster: item.poster || item.thumb || '',
                  animeId: item.animeId || item.slug || item.id || item.endpoint,
                  status: item.status || item.status_or_day || 'ONGOING',
                  type: item.type || 'explore',
                  score: item.score || item.rating,
                  episodes: item.episodes || item.episode || item.episode_count || 'N/A'
                };
                
                return (
                  <AnimeCard3 
                    key={i}
                    item={{
                      ...mappedItem,
                      views: mappedItem.episodes
                    }}
                    href={`/anime/${source}/detail/${mappedItem.animeId}`}
                    type="explore"
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-12 mb-4">
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
                disabled={!hasNext}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A2B3D] hover:bg-[#3b3c54] disabled:opacity-50 rounded-xl font-bold text-sm transition-colors text-zinc-300"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64 text-zinc-500 font-bold">
            Tidak ada data anime.
          </div>
        )}
      </div>
    </div>
    <Sidebar />
    </>
  );
}
