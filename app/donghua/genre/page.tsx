'use client';

import { useState, useEffect } from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';

export default function GenrePage() {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/donghua/genres');
        const data = await res.json();
        
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data.items) list = data.items;
        else if (data.genreList) list = data.genreList;

        setGenres(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="flex-1 min-w-0">

        
        {loading ? (
          <div className="flex flex-col gap-8">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((g, idx) => (
              <Link 
                key={idx} 
                href={g.href || `/donghua/genres/${g.genreId || g.slug || g.title?.toLowerCase()}`}
                className="flex items-center justify-between p-4 bg-[#1A1A22] hover:bg-[#20202a] rounded-2xl border border-transparent hover:border-zinc-700 transition-colors group"
              >
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white">{g.title || g.name}</span>
                <ChevronRight size={16} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <Sidebar />
    </>
  );
}
