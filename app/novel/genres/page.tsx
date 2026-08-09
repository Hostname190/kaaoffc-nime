'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

export default function NovelGenresPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/novel/sakuranovel/genres')
      .then(r => r.json())
      .then(json => {
        let results: any[] = [];
        if (json?.data?.results) results = json.data.results;
        else if (Array.isArray(json?.data)) results = json.data;
        else if (json?.result?.items) results = json.result.items;
        else if (Array.isArray(json?.result)) results = json.result;
        
        setGenres(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredGenres = genres.filter(g => (g.name || g.title || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <>
    <div className="flex-1 min-w-0">
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-20">
      <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center max-w-[1600px] mx-auto">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2">
            <List size={18} className="text-pink-500" /> Genre Novel
          </h1>
        </div>
        <div className="w-9" />
      </div>

      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Cari genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1C1D2A] text-white text-sm rounded-full pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-pink-500 border border-zinc-800"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
            {filteredGenres.map((g, i) => (
              <Link
                key={i}
                href={`/novel/genre/sakura-${g.slug || g.id}`}
                className="bg-[#1C1D2A] p-4 rounded-xl hover:bg-pink-600 transition-colors border border-zinc-800 text-center font-bold text-sm text-zinc-300 hover:text-white shadow-lg"
              >
                {g.name || g.title}
              </Link>
            ))}
            {filteredGenres.length === 0 && (
              <div className="col-span-full text-center py-10 text-zinc-500 flex flex-col items-center justify-center gap-2">
                <List size={40} className="opacity-30" />
                <p>Genre tidak ditemukan.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}
