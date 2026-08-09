import Link from 'next/link';
import { Eye, Clock, PlayCircle } from 'lucide-react';

interface AnimeCard3Props {
  item: any;
  href: string;
  type?: 'schedule' | 'movie' | 'explore' | 'genre';
  genreName?: string;
}

export default function AnimeCard3({ item, href, type = 'explore', genreName }: AnimeCard3Props) {
  const isSchedule = type === 'schedule';
  const isMovie = type === 'movie';
  const isGenre = type === 'genre';

  const title = item.title || item.anime_name || item.name || '';
  const poster = item.poster || item.thumb || item.thumbnail || item.image || '';
  
  if (isGenre) {
    return (
      <Link href={href} className="group relative block w-full aspect-[2/1] rounded-xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-950">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 group-hover:opacity-40 transition-opacity">
          {/* We can use a pattern or just gradient for genre */}
          <div className="w-full h-full bg-gradient-to-l from-transparent to-zinc-950"></div>
        </div>
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-[#60a5fa]/20 text-[#60a5fa] text-[10px] font-black uppercase tracking-wider backdrop-blur-sm border border-[#60a5fa]/30">
          GENRE
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-white text-lg sm:text-xl drop-shadow-md truncate">{title}</h3>
        </div>
      </Link>
    );
  }

  const isOngoing = item.status?.toLowerCase().includes('ongoing') || item.status_or_day?.toLowerCase().includes('ongoing');
  const isCompleted = item.status?.toLowerCase().includes('completed') || item.status?.toLowerCase().includes('tamat') || item.status?.toLowerCase().includes('selesai') || item.status_or_day?.toLowerCase().includes('tamat') || isMovie;
  const displayStatus = isOngoing ? 'ONGOING' : isCompleted ? (item.status || 'SELESAI ✔') : (item.status || item.status_or_day || 'ONGOING').toUpperCase();
  const displayType = item.type || (isMovie ? 'Movie' : 'Series');

  return (
    <Link href={href} className="group flex flex-col gap-2 relative">
      <div className="w-full aspect-[3/4] relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-md group-hover:border-amber-500/30 transition-colors">
        <img 
          src={poster.startsWith('/') || poster.startsWith('data:') ? poster : `/api/image-proxy?url=${encodeURIComponent(poster)}`} 
          alt={title} 
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22600%22%20fill%3D%22%2327272a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%2371717a%22%3ENot%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
          }}
        />
        
        {/* Top Right: Status Badge & Type */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
          <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 border ${
            isOngoing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-md' : 
            isCompleted ? 'bg-white/20 text-white border-transparent backdrop-blur-md' : 
            'bg-zinc-800/50 text-zinc-300 border-zinc-700/50 backdrop-blur-md'
          }`}>
            {isOngoing && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>}
            {displayStatus}
          </div>
          
          {displayType && (
            <div className="bg-black/60 backdrop-blur-md text-white/90 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center">
              {displayType}
            </div>
          )}
        </div>

        {/* Bottom Gradient Area for Details (Episodes, Time, Rating) */}
        <div className="absolute bottom-0 left-0 right-0 pt-12 pb-2 px-2 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end z-10">
          <div className="flex items-end justify-between w-full">
            <div className="flex flex-col gap-0.5">
              {/* Rating */}
              {(item.rating || item.score || item.likes) && (
                <div className="flex items-center gap-1 text-[10px] font-black text-amber-400">
                  <span className="text-[9px]">⭐</span> {item.rating || item.score || item.likes}
                </div>
              )}
              {/* Episodes / Time */}
              {(item.episodes || item.episode || item.time || item.views || item.chapter) && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-white">
                  {item.time ? <Clock size={10} className="text-zinc-300" /> : <PlayCircle size={10} className="fill-white text-black" />}
                  <span className="truncate max-w-[100px]">{item.time || item.episodes || item.episode || item.chapter || item.views}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <h3 className="text-[11px] sm:text-xs font-bold text-white line-clamp-2 group-hover:text-[#60a5fa] transition-colors mt-1 leading-tight">
        {title}
      </h3>
    </Link>
  );
}
