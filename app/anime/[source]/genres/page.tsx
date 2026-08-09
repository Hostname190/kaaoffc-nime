'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layers, Search, ChevronLeft } from 'lucide-react';
import { getAnimeGenres } from '@/lib/anime-api';
import AnimeCard3 from '../../components/AnimeCard3';
import Sidebar from '../../../components/Sidebar';

export default function AnimeGenresPage() {
  const params = useParams();
  const router = useRouter();
  const source = (params?.source as string) || 'otakudesu';

  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await getAnimeGenres(source);
        let items = res?.data?.genreList || res?.genreList || res?.genre_list || res?.genres;
        if (!items) {
          items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        }
        setGenres(items);
      } catch (error) {
        console.error("Failed to fetch genres", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGenres();
  }, []);

  const tabs = ['Semua', 'Genre', 'Theme', 'Demographic'];

  const filteredGenres = genres.filter(g => {
    const name = (g.title || g.name || '').toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
    // We don't have actual categories from the API usually, so just show all for now
    return true;
  });

  return (
    <>
      <div className="flex-1 flex flex-col min-h-screen text-white pb-24 font-sans w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-[#2A2B3D] hover:bg-[#3b3c54] flex items-center justify-center transition-colors">
          <ChevronLeft size={18} className="text-zinc-400" />
        </button>
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-[#f40f25]" />
          <h1 className="text-lg sm:text-xl font-bold text-white">Daftar Genre</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Cari genre..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 text-white text-sm rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 flex items-center px-4 py-2 rounded-full font-bold text-xs transition-colors border ${
                isActive 
                  ? 'bg-amber-500 text-black shadow-md border-amber-500' 
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-amber-600 hover:text-white hover:border-amber-500'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Tidak ada genre ditemukan.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredGenres.map((g, i) => {
              const name = g.title || g.name || g.genreId || 'Unknown';
              return (
                <a
                  key={i}
                  href={`/anime/${source}/genre/${g.genreId || g.slug || g.id || name.toLowerCase()}`}
                  className="group relative overflow-hidden rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/50 transition-all p-4 flex flex-col justify-center items-center text-center h-20 hover:bg-amber-500/10"
                >
                  <span className="font-bold text-sm text-zinc-300 group-hover:text-amber-500 transition-colors line-clamp-2">
                    {name}
                  </span>
                  {g.count && (
                    <span className="text-[10px] text-zinc-500 mt-1">{g.count} Anime</span>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
    <Sidebar />
    </>
  );
}
