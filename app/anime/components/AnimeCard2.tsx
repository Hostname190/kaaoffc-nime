import Link from 'next/link';
import { Eye } from 'lucide-react';

interface AnimeCard2Props {
  item: {
    title: string;
    poster: string;
    href: string;
    type?: string; // SERIES, MOVIE, SPECIAL, ONA
    status?: string; // ONGOING, TAMAT, WAITING
    year?: string;
    views?: string | number;
  };
}

export default function AnimeCard2({ item }: AnimeCard2Props) {
  // Determine top-left tag color
  let typeBg = 'bg-[#60a5fa] text-blue-950'; // Default pinkish for SERIES
  if (item.type?.toUpperCase() === 'MOVIE') typeBg = 'bg-[#60a5fa] text-blue-950';
  if (item.type?.toUpperCase() === 'SPECIAL') typeBg = 'bg-[#60a5fa] text-blue-950';
  if (item.type?.toUpperCase() === 'ONA') typeBg = 'bg-[#60a5fa] text-blue-950';

  // Determine bottom-right status tag color
  let statusBg = 'bg-emerald-500 text-white'; // Default ongoing green
  const stat = item.status?.toUpperCase() || '';
  if (stat === 'TAMAT' || stat === 'COMPLETED') statusBg = 'bg-blue-600 text-white';
  else if (stat === 'WAITING') statusBg = 'bg-yellow-500 text-black';

  return (
    <Link href={item.href} className="group flex flex-col gap-2 relative">
      <div className="w-full aspect-[3/4] relative rounded-xl overflow-hidden bg-[#232330] shadow-md border border-zinc-800/50">
        {item.poster ? (
          <img 
            src={(item.poster).startsWith('/') || (item.poster).startsWith('data:') ? item.poster : `/api/image-proxy?url=${encodeURIComponent(item.poster)}`} 
            alt={item.title} 
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22600%22%20fill%3D%22%2327272a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%2371717a%22%3ENot%20Found%3C%2Ftext%3E%3C%2Fsvg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-[#1A1A22]">No Image</div>
        )}
        
        {/* Top Left Badge: Type */}
        <div className={`absolute top-2 left-2 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-sm shadow-sm z-10 uppercase ${typeBg}`}>
          {item.type || 'SERIES'}
        </div>

        {/* Bottom Right Badge: Status */}
        {item.status && (
          <div className={`absolute bottom-2 right-2 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-sm shadow z-10 uppercase ${statusBg}`}>
            {item.status === 'COMPLETED' ? 'TAMAT' : item.status}
          </div>
        )}
      </div>

      <div className="flex flex-col px-0.5">
        <h3 className="font-bold text-[11px] sm:text-xs text-zinc-100 line-clamp-2 leading-tight mb-1 group-hover:text-[#60a5fa] transition-colors">{item.title}</h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">{item.year || 'UNKNOWN'}</span>
          {item.views !== undefined && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-500 font-medium">
              <Eye size={12} /> {item.views}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
