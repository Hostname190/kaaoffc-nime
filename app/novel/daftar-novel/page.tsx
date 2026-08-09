'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';
import Sidebar from '../../components/Sidebar';

const ITEMS_PER_PAGE = 20;

export default function DaftarNovelPage() {
  const router = useRouter();
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchDaftar = async () => {
      try {
        const res = await fetch('/api/novel/sakuranovel/daftar-novel');
        const json = await res.json();
        
        let items: any[] = [];
        if (json?.data?.results) items = json.data.results;
        else if (json?.result?.items) items = json.result.items;
        else if (Array.isArray(json?.result)) items = json.result;
        else if (Array.isArray(json?.data)) items = json.data;
        else if (Array.isArray(json)) items = json;
        
        setNovels(items);
      } catch (error) {
        console.error("Failed to fetch daftar novel:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDaftar();
  }, []);

  // Reset page when searching
  useEffect(() => {
    setPage(1);
  }, [search]);

  const getImageUrl = (item: any) => {
    const src = item?.poster || item?.cover || item?.thumbnail || '';
    if (!src) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48L3N2Zz4=';
    let finalSrc = typeof src === 'string' ? src : src.url || '';
    if (finalSrc.includes('sakuranovel.id')) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48L3N2Zz4=';
    if (finalSrc && finalSrc.includes('http')) {
      return `/api/image-proxy?url=${encodeURIComponent(finalSrc)}`;
    }
    return finalSrc;
  };

  const filtered = novels.filter(n => !search || n.title?.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0a0c] text-white pb-24">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-zinc-800">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari novel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1C1D2A] text-white text-sm rounded-full pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
          <h1 className="text-xl font-bold">Daftar Novel</h1>
          <span className="ml-auto text-xs text-zinc-500">{filtered.length} novel</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Tidak ada novel ditemukan.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {paginated.map((item: any, i: number) => {
                let displayChap = 'Top';
                const raw = item.latest_chapter || item.chapter;
                if (raw) {
                  let clean = raw;
                  if (item.title && clean.toLowerCase().includes(item.title.toLowerCase())) {
                    clean = clean.replace(new RegExp(item.title, 'ig'), '').trim();
                  }
                  clean = clean.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '');
                  const chapMatch = clean.match(/chapter\s*\d+/i);
                  displayChap = chapMatch ? chapMatch[0] : (clean || 'Top');
                }

                return (
                  <AnimeCard3 
                    key={i} 
                    item={{
                      ...item, 
                      type: 'Novel', 
                      episode: displayChap, 
                      poster: getImageUrl(item),
                      rating: item.score || item.rating
                    }} 
                    href={`/novel/detail/sakura-${item.slug}`} 
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-6">
                {/* Prev button */}
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                  {getPageNumbers().map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`ellipsis-${i}`} className="text-zinc-500 px-0.5 sm:px-1 text-[10px] sm:text-xs">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                          page === p
                            ? 'bg-pink-600 text-white scale-110'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                {/* Next button */}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-zinc-600 text-[10px] mt-3">
                Halaman {page} dari {totalPages} • Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} novel
              </p>
            )}
          </>
        )}
      </div>
    </div>
    <Sidebar />
    </>
  );
}
