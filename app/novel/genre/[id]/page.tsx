'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';

export default function NovelGenrePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [novels, setNovels] = useState<any[]>([]);
  const [genreName, setGenreName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchGenre = async () => {
      try {
        // Support both sakura- prefix and raw slug
        const slug = id.startsWith('sakura-') ? id.replace('sakura-', '') : id;
        const res = await fetch(`/api/novel/sakuranovel/genre/${slug}`);
        const json = await res.json();
        
        let items: any[] = [];
        if (json?.data?.results) items = json.data.results;
        else if (json?.result?.items) items = json.result.items;
        else if (Array.isArray(json?.result)) items = json.result;
        else if (json?.data?.items) items = json.data.items;
        else if (Array.isArray(json?.data)) items = json.data;
        else if (Array.isArray(json)) items = json;
        
        setNovels(items);
        setGenreName(json?.result?.genre_name || json?.result?.name || slug);
      } catch (error) {
        console.error("Failed to fetch novel genre:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGenre();
  }, [id]);

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

  return (
    <>
    <div className="flex-1 min-w-0">
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-20">
      <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center max-w-[1600px] mx-auto">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-white font-bold text-sm sm:text-base capitalize">
            Genre: <span className="text-pink-500">{genreName || 'Memuat...'}</span>
          </h1>
        </div>
        <div className="w-9" />
      </div>

      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : novels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
            {novels.map((item: any, i: number) => {
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
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Tidak ada novel di genre ini.
          </div>
        )}
      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}
