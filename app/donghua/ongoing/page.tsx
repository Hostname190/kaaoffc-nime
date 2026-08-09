'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import AnimeList from '../../components/AnimeList';
import Sidebar from '../../components/Sidebar';

export default function OngoingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/donghua/ongoing?page=${page}`);
        const data = await res.json();
        
        // Ensure data is array and mapped correctly
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data.items) list = data.items;
        else if (data.donghuaList) list = data.donghuaList;

        // Force status to "Ongoing" for UI rendering
        const mappedList = list.map((item: any) => ({ ...item, status: 'Ongoing' }));

        if (page === 1) {
          setItems(mappedList);
        } else {
          setItems(prev => [...prev, ...mappedList]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  return (
    <>
      <div className="flex-1 min-w-0">

        
        {items.length === 0 && loading ? (
          <div className="flex flex-col gap-8">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <AnimeList items={items} />
            
            <div className="flex justify-center mt-4">
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="px-6 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-bold rounded-xl transition-colors"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          </div>
        )}
      </div>
      <Sidebar />
    </>
  );
}
