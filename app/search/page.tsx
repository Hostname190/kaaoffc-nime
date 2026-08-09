'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AnimeList from '../components/AnimeList';
import WidgetTitle from '../components/WidgetTitle';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialSource = searchParams.get('source') || 'donghua';
  const [query, setQuery] = useState(initialQ);
  const [source, setSource] = useState(initialSource);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!initialQ);
  const [genres, setGenres] = useState<{title: string, genreId: string}[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  useEffect(() => {
    if (source === 'donghua') {
      fetch('/api/donghua/genres')
        .then(res => res.json())
        .then(data => setGenres(data || []))
        .catch(console.error);
    } else {
      setSelectedGenre('');
    }
  }, [source]);

  const fetchResults = (q: string, src: string, genreSlug?: string) => {
    if (!q && !genreSlug) return;
    setLoading(true);
    let endpoint = `/api/search?q=${encodeURIComponent(q)}&source=${src}`;
    if (src === 'donghua') {
      if (genreSlug) {
        endpoint = `/api/donghua/genre?slug=${encodeURIComponent(genreSlug)}`;
      } else {
        endpoint = `/api/donghua/search?q=${encodeURIComponent(q)}`;
      }
    } else if (src === 'komik') {
      endpoint = `/api/comic/search?q=${encodeURIComponent(q)}`;
    }
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (src === 'donghua') {
          setResults(data);
        } else if (src === 'komik') {
          setResults(data.data || []);
        } else {
          setResults(data.items || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialQ) {
      fetchResults(initialQ, initialSource);
    }
  }, [initialQ, initialSource]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if(query.trim()) {
      setSelectedGenre('');
      window.history.replaceState({}, '', `/search?q=${encodeURIComponent(query)}&source=${source}`);
      fetchResults(query, source);
    }
  };

  const handleGenreClick = (slug: string) => {
    setQuery('');
    setSelectedGenre(slug);
    window.history.replaceState({}, '', `/search?source=${source}`);
    fetchResults('', source, slug);
  };

  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    if (query.trim()) {
      window.history.replaceState({}, '', `/search?q=${encodeURIComponent(query)}&source=${newSource}`);
      fetchResults(query, newSource);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex gap-2">
        <button 
 onClick={() => handleSourceChange('donghua')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${source === 'donghua' ? 'bg-amber-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          Donghua
        </button>
        <button 
 onClick={() => handleSourceChange('webtoons')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${source === 'webtoons' ? 'bg-green-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          Webtoon
        </button>
        <button 
 onClick={() => handleSourceChange('novels')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${source === 'novels' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          Novel
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-within:border-amber-500 transition-colors">
        <input 
          type="text" 
          placeholder={`Cari di ${source}...`} 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 px-4 py-3 outline-none placeholder:text-zinc-500 text-sm"
          autoFocus={!initialQ}
        />
        <button 
 type="submit"
 className="px-5 bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-colors"
 >
          <SearchIcon size={18} />
        </button>
      </form>




      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="flex flex-col gap-5">
          <WidgetTitle title={selectedGenre ? `Genre: ${genres.find(g => g.genreId === selectedGenre)?.title || selectedGenre}` : `Hasil Pencarian: ${query}`} />
          <AnimeList items={results.map((r: any) => ({
            ...r,
            poster: r.thumbnail || r.poster,
            href: source === 'donghua' ? r.href : source === 'novels' ? `/novel/${r.slug || r.id}` : source === 'komik' ? `/comic/detail/${r.slug}` : `/detail?url=${encodeURIComponent(r.url)}&source=${source}`,
            episodes: source === 'novels' ? (r.chapters ? `${r.chapters.length} Ch` : '0 Ch') : source === 'komik' ? (r.description || '') : r.episodes
          }))} />
        </div>
      ) : (query || selectedGenre) && !loading ? (
        <div className="p-12 text-center text-zinc-500">
          <p>Tidak ada hasil ditemukan.</p>
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <div className="flex-1 min-w-0">
        <Suspense fallback={<div className="p-8 text-center text-sm animate-pulse">Memuat...</div>}>
          <SearchContent />
        </Suspense>
      </div>
      <Sidebar />
    </>
  );
}
