import Link from 'next/link';
import { Clock, Film } from 'lucide-react';
import AnimeCard3 from '../anime/components/AnimeCard3';

export default function AnimeList({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return <div className="text-center p-8 text-zinc-500 font-medium">Data tidak tersedia</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 px-2 sm:px-0 mb-8 max-w-[1200px] mx-auto">
      {items.map((item, idx) => {
        // Map common properties for AnimeCard3
        const mappedItem = {
          ...item,
          title: item.title || item.name || item.anime_name,
          poster: item.poster || item.thumb || item.thumbnail || item.image,
          status: item.status || item.status_or_day || (item.type === 'Movie' ? 'TAMAT' : 'ONGOING'),
          views: item.score || item.rating || undefined,
          chapter: item.chapter || item.latest_chapter || item.episodes || item.episode || item.time || '',
          type: item.type || 'SERIES',
          year: item.year || '2025'
        };
        const href = item.href || `/anime/otakudesu/detail/${item.animeId || item.id || item.slug || item.endpoint}`;

        return (
          <AnimeCard3 
            key={idx} 
            item={mappedItem} 
            href={href} 
            type="explore" 
          />
        );
      })}
    </div>
  );
}
