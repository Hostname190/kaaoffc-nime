'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimeList from '../../components/AnimeList';
import Sidebar from '../../components/Sidebar';

export default function DonghuaSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Parse q from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      executeSearch(q);
    }
  }, []);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const res = await fetch(`/api/donghua/search?q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      
      let list = [];
      if (Array.isArray(json)) list = json;
      else if (json.data && Array.isArray(json.data)) list = json.data;
      else if (json.search && Array.isArray(json.search)) list = json.search;
      else if (json.results && Array.isArray(json.results)) list = json.results;

      setResults(list);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    params.set('q', query);
    router.replace(`?${params.toString()}`);
    executeSearch(query);
  };

  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg text-zinc-900 dark:text-white transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-xl sm:text-2xl flex items-center gap-2">
            <Search className="text-amber-500" /> Pencarian Donghua
          </h1>
        </div>

        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul donghua..."
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!query.trim() || loading}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={20} /> <span className="hidden sm:inline">Cari</span>
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : hasSearched ? (
          results.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">{results.length} hasil ditemukan untuk &quot;{query}&quot;</span>
              </div>
              <AnimeList items={results} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-zinc-400">Donghua tidak ditemukan</p>
              <p className="text-sm">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Masukkan judul donghua untuk mulai mencari.</p>
          </div>
        )}
      </div>
      <Sidebar />
    </>
  );
}
