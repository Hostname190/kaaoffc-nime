// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';
import AnimeList from '@/app/components/AnimeList';

export default function GenreDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchGenreData = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/donghua/genre-detail?slug=${slug}&page=${pageNum}`);
      const data = await res.json();
      
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data.data) list = data.data;

      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenreData(page);
  }, [page, slug]);

  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/donghua/genre" className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-white">
            <ChevronLeft size={20} />
          </Link>
          <Grid className="text-rose-500" size={24} />
          <h1 className="text-xl sm:text-2xl font-bold text-white capitalize">
            Genre: {params.slug.replace(/-/g, ' ')}
          </h1>
        </div>

        {loading ? (
          <div className="text-center p-8 text-zinc-500">Memuat genre...</div>
        ) : items.length > 0 ? (
          <>
            <AnimeList items={items} />
            <div className="flex justify-between items-center mt-8 px-4">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 text-sm font-bold flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-zinc-400 text-sm font-bold">Page {page}</span>
              <button 
                disabled={items.length < 20}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 text-sm font-bold flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-8 text-zinc-500">Tidak ada donghua untuk genre ini.</div>
        )}
      </div>
      <Sidebar />
    </>
  );
}
