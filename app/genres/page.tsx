'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import WidgetTitle from '../components/WidgetTitle';
import { Tag } from 'lucide-react';

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/donghua/genres`)
      .then(res => res.json())
      .then(data => {
        setGenres(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="flex-1 min-w-0">
        <WidgetTitle title="Daftar Genre" />
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {genres.map((genre: any, idx: number) => (
              <Link 
 key={idx} 
 href={`/genres/${genre.genreId}`}
 className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
 >
                <Tag size={14} className="text-zinc-400 group-hover:text-amber-500" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-500">{genre.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Sidebar />
    </>
  );
}
