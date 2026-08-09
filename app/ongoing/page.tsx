'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import WidgetTitle from '../components/WidgetTitle';
import AnimeList from '../components/AnimeList';

export default function OngoingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/donghua/ongoing?page=${page}`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [page]);

  return (
    <>
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div>
          <WidgetTitle title="Donghua Ongoing" />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-zinc-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              <AnimeList items={items} />
              
              <div className="flex justify-center mt-8 gap-4">
                <button 
 onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-full font-semibold hover:bg-amber-600 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-300"
                >
                  Sebelumnya
                </button>
                <button 
 onClick={() => setPage(p => p + 1)}
                  className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-full font-semibold hover:bg-amber-600 hover:text-white transition-colors"
                >
                  Selanjutnya
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
