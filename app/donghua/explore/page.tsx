'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDownAZ } from 'lucide-react';
import AnimeList from '../../components/AnimeList';
import Sidebar from '../../components/Sidebar';

const ALPHABET = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

export default function ExplorePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState('A');
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const slug = activeLetter === '#' ? '0-9' : activeLetter.toLowerCase();
        const res = await fetch(`/api/donghua/az-list?letter=${slug}&page=${page}`);
        const data = await res.json();
        
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data.items) list = data.items;
        else if (data.donghuaList) list = data.donghuaList;

        if (page === 1) {
          setItems(list);
        } else {
          setItems(prev => [...prev, ...list]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeLetter, page]);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    setPage(1);
    setItems([]);
  };

  return (
    <>
      <div className="flex-1 min-w-0">


        <div 
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-2"
        >
          {ALPHABET.map(letter => {
            const isActive = letter === activeLetter;
            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl font-bold text-sm sm:text-base transition-all ${
                  isActive 
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
        
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Menampilkan huruf</span>
          <span className="text-amber-600 dark:text-amber-500 font-black text-lg">{activeLetter}</span>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-600 ml-2">(Hal. {page})</span>
        </div>

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
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
