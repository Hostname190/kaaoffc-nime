'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Star, Clock, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';
import Sidebar from '@/app/components/Sidebar';

export default function AdvancedSearchPage() {
  const router = useRouter();
  const [genres, setGenres] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form states
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('update');

  useEffect(() => {
    // Fetch genres for the filter dropdown
    fetch('/api/comic/genres')
      .then(r => r.json())
      .then(json => {
        if (json?.data && Array.isArray(json.data)) setGenres(json.data);
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedOrder) params.append('order', selectedOrder);

      // We'll proxy through our existing search endpoint
      // The API endpoint on sankavollerei is /comic/search
      const res = await fetch(`/api/comic/search?${params.toString()}`);
      const json = await res.json();

      const parseSlug = (link: string) => {
        if (!link) return '';
        if (link.startsWith('/')) {
          const m = link.match(/\/manga\/([^/]+)/);
          if (m) return m[1];
          return link.replace(/^\/|\/$/g, '');
        }
        const urlMatch = link.match(/\/manga\/([^/]+)/);
        return urlMatch ? urlMatch[1] : link;
      };

      let raw: any[] = [];
      if (Array.isArray(json)) raw = json;
      else if (json?.comics && Array.isArray(json.comics)) raw = json.comics;
      else if (json?.data && Array.isArray(json.data)) raw = json.data;
      else if (json?.results && Array.isArray(json.results)) raw = json.results;

      const parsed = raw.map((c: any) => ({ ...c, slug: c.slug || parseSlug(c.link || c.href || c.url || '') }));
      setResults(parsed);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="flex-1 min-w-0">
    <div className="min-h-screen bg-[#0D0D11] pb-24 font-sans text-white">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-sm sm:text-base flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-pink-500" /> Pencarian Spesifik
        </h1>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Filter Panel */}
        <div className="w-full lg:w-80 shrink-0">
          <form onSubmit={handleSearch} className="bg-[#151728] border border-zinc-800 rounded-2xl p-5 sticky top-24">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <Filter size={18} /> Filter Komik
            </h2>

            {/* Keyword */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Kata Kunci</label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari judul..."
                className="w-full bg-[#0D0D11] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            {/* Tipe */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tipe</label>
              <select 
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-[#0D0D11] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition-colors appearance-none"
              >
                <option value="">Semua Tipe</option>
                <option value="manga">Manga (Jepang)</option>
                <option value="manhwa">Manhwa (Korea)</option>
                <option value="manhua">Manhua (China)</option>
              </select>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-[#0D0D11] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition-colors appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="ongoing">Sedang Berjalan</option>
                <option value="completed">Tamat</option>
              </select>
            </div>

            {/* Urutan */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Urutkan Berdasarkan</label>
              <select 
                value={selectedOrder}
                onChange={e => setSelectedOrder(e.target.value)}
                className="w-full bg-[#0D0D11] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition-colors appearance-none"
              >
                <option value="update">Update Terbaru</option>
                <option value="popular">Terpopuler</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="title">A-Z Judul</option>
              </select>
            </div>

            {/* Genre */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Genre</label>
              <select 
                value={selectedGenre}
                onChange={e => setSelectedGenre(e.target.value)}
                className="w-full bg-[#0D0D11] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 transition-colors appearance-none"
              >
                <option value="">Semua Genre</option>
                {genres.map(g => (
                  <option key={g.slug} value={g.slug}>{g.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-600/20">
              <Search size={18} /> Cari Komik
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="flex-1 min-w-0">
          {!hasSearched ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-[#151728]/50 border border-zinc-800/50 rounded-2xl text-zinc-500">
              <Search size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Atur filter di samping untuk mencari komik spesifik.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-[#151728]/50 border border-zinc-800/50 rounded-2xl text-zinc-500">
              <p>Tidak ada komik yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Hasil Pencarian</h2>
                <span className="text-zinc-500 text-xs">{results.length} komik ditemukan</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {results.map((c: any, i: number) => (
                  <AnimeCard3 
                    key={i} 
                    item={{...c, type: c.type || 'Komik', episode: c.latest_chapter}} 
                    href={`/comic/detail/${c.slug}`} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  );
}
