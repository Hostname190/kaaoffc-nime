'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';

export default function NovelTagPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [novels, setNovels] = useState<any[]>([]);
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchTag = async () => {
      try {
        const slug = id.startsWith('sakura-') ? id.replace('sakura-', '') : id;
        const res = await fetch(`/api/novel/sakuranovel/tag/${slug}`);
        const json = await res.json();

        let items: any[] = [];
        if (json?.data?.results) items = json.data.results;
        else if (json?.result?.items) items = json.result.items;
        else if (Array.isArray(json?.result)) items = json.result;
        else if (json?.data?.items) items = json.data.items;
        else if (Array.isArray(json?.data)) items = json.data;
        else if (Array.isArray(json)) items = json;

        setNovels(items);
        setTagName(json?.result?.tag_name || json?.result?.name || slug);
      } catch (error) {
        console.error("Failed to fetch tag novels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTag();
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0a0c] text-white">
      <header className="sticky top-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold capitalize">{tagName || id.replace('sakura-', '')}</h1>
          <p className="text-xs text-zinc-500">Tag • Kaaoffc</p>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : novels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
            Tidak ada novel dengan tag ini.
          </div>
        )}
      </div>
    </div>
  );
}
