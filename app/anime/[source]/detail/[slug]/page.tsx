// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Eye, Heart, Film, Calendar, Building2, Play, Bookmark, List, Copy, SortDesc, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getAnimeDetail, getAnimeOngoing } from '@/lib/anime-api';
import CommentSection from '../../../../components/CommentSection';
import { useAuth } from '../../../../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Sidebar from '../../../../components/Sidebar';

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const source = (params?.source as string) || 'otakudesu';
  const { user } = useAuth();
  
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [epsSortAsc, setEpsSortAsc] = useState(false);
  const [epsQuery, setEpsQuery] = useState('');
  const [epsPage, setEpsPage] = useState(1);
  const itemsPerPage = 30;
  const [rekomendasi, setRekomendasi] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const checkBookmark = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('user_bookmarks')
            .select('item_url')
            .eq('user_id', user.id)
            .eq('item_url', `/anime/${source}/detail/${slug}`)
            .single();
          
          if (data) setIsBookmarked(true);
        } catch (e) {}
      } else {
        setIsBookmarked(false);
      }
    };
    
    checkBookmark();
  }, [slug, user]);

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      try {
        const res = await getAnimeDetail(slug, source);
        setDetail(res?.detail || res?.data || res?.anime_detail || res);
      } catch (error) {
        console.error("Failed to fetch anime detail", error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRek = async () => {
      try {
        const res = await getAnimeOngoing(1, source);
        const items = res?.animeList || res?.data || res || [];
        const arr = Array.isArray(items) ? items : [];
        const randoms = [...arr].sort(() => 0.5 - Math.random()).slice(0, 4);
        setRekomendasi(randoms);
      } catch (e) { }
    };

    fetchDetail();
    fetchRek();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen pt-16 text-white p-4 flex flex-col items-center justify-center">
        <p className="text-zinc-500 mb-4">Anime tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-[#60a5fa] hover:underline">Kembali</button>
      </div>
    );
  }

  let episodes = detail.episodeList || detail.episode_list || detail.episodes || [];
  
  // Sorting episodes
  const displayedEpisodes = [...episodes].reverse(); // default is from latest, let's reverse if requested
  if (epsSortAsc) {
    displayedEpisodes.reverse(); 
  }
  
  const filteredEpisodes = displayedEpisodes.filter((ep: any) => 
    (ep.title || ep.episode || '').toLowerCase().includes(epsQuery.toLowerCase())
  );
  
  const totalEpsPages = Math.ceil(filteredEpisodes.length / itemsPerPage);
  const paginatedEpisodes = filteredEpisodes.slice((epsPage - 1) * itemsPerPage, epsPage * itemsPerPage);
  const startEps = (epsPage - 1) * itemsPerPage + 1;
  const endEps = Math.min(epsPage * itemsPerPage, filteredEpisodes.length);

  let synopsisText = "Tidak ada sinopsis.";
  if (typeof detail.synopsis === 'string') {
    synopsisText = detail.synopsis;
  } else if (detail.synopsis && detail.synopsis.paragraphs) {
    synopsisText = detail.synopsis.paragraphs.join("\n\n");
  }
  const isSynopsisLong = synopsisText.length > 200;

  return (
    <>
    <div className="flex-1 min-w-0 bg-[#0f0f13]">
    <div className="min-h-screen pb-24 font-sans text-white">
      
      {/* HEADER BANNER - Blurred Background */}
      <div className="relative w-full h-[240px] sm:h-[300px] md:h-[350px] overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <img 
            src={`/api/image-proxy?url=${encodeURIComponent(detail.poster || detail.thumb)}`} 
            alt="background" 
            className="w-full h-full object-cover opacity-50 blur-md scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f13]/80 to-transparent"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 relative -mt-32 sm:-mt-40 flex flex-col items-center">
        
        {/* POSTER */}
        <div className="w-36 sm:w-48 aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 mb-5 sm:mb-6">
          <img 
            src={`/api/image-proxy?url=${encodeURIComponent(detail.poster || detail.thumb)}`} 
            alt={detail.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* TITLES */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-center text-white mb-2 leading-tight drop-shadow-md">
          {detail.title}
        </h1>
        <p className="text-sm italic text-zinc-400 text-center mb-6">
          {detail.japanese || detail.title}
        </p>

        {/* BADGES */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold ${
            (typeof detail.status === 'string' && detail.status?.toLowerCase() === 'ongoing') ? 'bg-[#00d285] text-white' : 'bg-sky-500 text-white'
          }`}>
            {typeof detail.status === 'object' ? (detail.status?.name || 'Ongoing') : (detail.status || 'Ongoing')}
          </span>
          <span className="bg-[#1C1D2A] border border-zinc-700/50 text-zinc-300 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
            <Play size={14} className="text-zinc-400" /> {typeof detail.type === 'object' ? (detail.type?.name || 'Series') : (detail.type || 'Series')}
          </span>
          <span className="bg-[#1C1D2A] border border-amber-900/50 text-amber-500 text-xs sm:text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="text-[10px]">⭐</span> {detail.score || detail.rating || 'N/A'}
          </span>
        </div>

        {/* METADATA LIST */}
        <div className="w-full max-w-2xl bg-transparent border-t border-b border-zinc-800/60 py-4 mb-6">
          <div className="flex flex-col gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Studio</span>
              <span className="text-white font-bold text-right">{typeof detail.studio === 'object' ? detail.studio?.name : (detail.studio || '-')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Season</span>
              <span className="text-white font-bold text-right">{typeof detail.season === 'object' ? detail.season?.name : (detail.season || detail.year || '-')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Total Eps</span>
              <span className="text-white font-bold text-right">{typeof detail.episodes === 'object' ? detail.episodes?.name : (detail.episodes || detail.episode || '-')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Released</span>
              <span className="text-white font-bold text-right">{typeof detail.release_date === 'object' ? detail.release_date?.name : (detail.release_date || detail.aired || '-')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Duration</span>
              <span className="text-white font-bold text-right">{typeof detail.duration === 'object' ? detail.duration?.name : (detail.duration || detail.time || '-')}</span>
            </div>
          </div>
        </div>

        {/* GENRES */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-8 max-w-2xl">
          <span className="text-rose-500 mr-1"><Bookmark size={14} className="fill-current" /></span>
          {(detail.genre_list || detail.genres || []).map((g: any, i: number) => (
            <Link key={i} href={`/anime/${source}/genre/${g.genreId || g.slug}`} className="bg-[#1C1D2A] border border-zinc-700/50 text-zinc-300 hover:text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full transition-colors">
              {g.genreName || g.name}
            </Link>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full max-w-2xl flex flex-row gap-2 sm:gap-3 mb-10">
          <Link href={episodes.length > 0 ? `/anime/${source}/watch/${episodes[episodes.length - 1]?.episodeId || episodes[episodes.length - 1]?.slug}` : '#'} className="flex-[2] sm:flex-[3] bg-[#f40f25] hover:bg-[#d60a1e] text-white font-extrabold px-2 sm:px-5 py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-[13px] sm:text-sm">
            <Play size={16} className="fill-current" /> Tonton
          </Link>
          <button 
            onClick={async () => {
              if (!user) {
                alert('Silakan login untuk menambahkan ke Watchlist!');
                return;
              }
              try {
                if (isBookmarked) {
                  await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: `/anime/${source}/detail/${slug}` });
                  setIsBookmarked(false);
                } else {
                  await supabase.from('user_bookmarks').upsert({ 
                    user_id: user.id, 
                    item_url: `/anime/${source}/detail/${slug}`, 
                    title: detail.title, 
                    poster: detail.poster || detail.thumb, 
                    category: 'Anime' 
                  }, { onConflict: 'user_id,item_url' });
                  setIsBookmarked(true);
                }
              } catch(e) {}
            }}
            className={`flex-[1.5] sm:flex-[2] font-bold px-2 sm:px-5 py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-[13px] sm:text-sm border ${isBookmarked ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500 text-white' : 'bg-[#1C1D2A] border-zinc-800/50 hover:bg-[#2b2c3d] text-zinc-300'}`}>
            <Bookmark size={14} className={isBookmarked ? "fill-current" : ""} /> {isBookmarked ? 'Hapus' : 'Simpan'}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link dicopy!'); }} className="flex-[1.5] sm:flex-[2] bg-[#1C1D2A] hover:bg-[#2b2c3d] border border-zinc-800/50 text-zinc-300 font-bold px-2 sm:px-5 py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-[13px] sm:text-sm">
            <Copy size={14} /> Share
          </button>
        </div>

        {/* BOTTOM CONTENT AREA */}
        <div className="w-full max-w-4xl flex flex-col gap-8">
          
          {/* SYNOPSIS */}
          <div className="w-full bg-[#1C1D2A] p-5 sm:p-6 rounded-2xl border border-zinc-800/50">
            <h3 className="text-base sm:text-lg font-black text-white mb-4">
              Sinopsis
            </h3>
            <div className="text-zinc-400 text-[13px] sm:text-sm leading-relaxed mb-3 text-left space-y-3 whitespace-pre-wrap">
              {showFullSynopsis ? synopsisText : synopsisText.slice(0, 250) + (isSynopsisLong ? '...' : '')}
            </div>
            {isSynopsisLong && (
              <button onClick={() => setShowFullSynopsis(!showFullSynopsis)} className="text-[#f40f25] text-xs sm:text-sm font-bold hover:underline">
                {showFullSynopsis ? 'Sembunyikan' : 'Selengkapnya'}
              </button>
            )}
          </div>

        {/* EPISODE LIST */}
        <div className="w-full bg-[#1C1D2A] p-5 sm:p-6 rounded-2xl border border-zinc-800/50">
          <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2 justify-center sm:justify-start">
            <List size={20} className="text-[#f40f25]" /> Daftar Episode
          </h3>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder={`Cari eps (1-${episodes.length})`}
                value={epsQuery}
                onChange={(e) => { setEpsQuery(e.target.value); setEpsPage(1); }}
                className="w-full bg-[#1C1D2A] border border-zinc-800 text-white text-sm rounded-lg pl-9 pr-16 py-2 focus:outline-none focus:border-zinc-600"
              />
              <button className="absolute right-1 top-1 bottom-1 px-3 bg-[#2A2B3D] text-xs font-bold rounded-lg text-[#f40f25] hover:bg-[#3b3c54]">Cari</button>
            </div>
            <button onClick={() => setEpsSortAsc(!epsSortAsc)} className="bg-[#2A2B3D] hover:bg-[#3b3c54] border border-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0">
              Urutan: {epsSortAsc ? '1 -> 99' : '99 -> 1'}
            </button>
            <button className="bg-[#2A2B3D] hover:bg-[#3b3c54] border border-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0">
              <Copy size={14} /> Salin
            </button>
          </div>

          {/* Pagination Controls */}
          {totalEpsPages > 1 && (
            <div className="flex items-center justify-between bg-[#1C1D2A] border border-zinc-800/60 rounded-xl p-3 mb-4">
              <button 
                onClick={() => setEpsPage(p => Math.max(1, p - 1))} 
                disabled={epsPage === 1}
                className="text-zinc-400 hover:text-white p-2 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-zinc-300 text-xs font-bold">Page <span className="text-[#f40f25]">{epsPage}</span></span>
                <span className="text-zinc-500 text-[10px]">Eps {startEps} - {endEps}</span>
              </div>
              <button 
                onClick={() => setEpsPage(p => Math.min(totalEpsPages, p + 1))} 
                disabled={epsPage === totalEpsPages}
                className="text-zinc-400 hover:text-white p-2 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
            {paginatedEpisodes.map((ep: any, i: number) => {
              // Extract episode number from string if possible
              const titleStr = String(ep.title || ep.name || ep.episode || '');
              let epNum;
              const epMatch = titleStr.match(/(?:episode|eps|ep)\s*-?\s*(\d+)/i);
              if (epMatch) {
                epNum = epMatch[1];
              } else {
                const allNumbers = titleStr.match(/\d+/g);
                epNum = allNumbers ? allNumbers[allNumbers.length - 1] : (episodes.length - ((epsPage - 1) * itemsPerPage + i));
              }
              return (
                <Link key={i} href={`/anime/${source}/watch/${ep.episodeId || ep.slug}?detail_slug=${slug}`} className="bg-[#2A2B3D] hover:bg-[#3b3c54] rounded-xl flex flex-col items-center justify-center py-2.5 gap-0.5 border border-zinc-800/50 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-400">EP</span>
                  <span className="text-xs sm:text-sm font-bold text-white">{epNum}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <div className="w-full">
          <CommentSection itemUrl={`/anime/${source}/detail/${slug}`} />
        </div>

        {/* REKOMENDASI */}
        {rekomendasi.length > 0 && (
          <div className="w-full mb-10 bg-[#1C1D2A] p-5 sm:p-6 rounded-2xl border border-zinc-800/50">
            <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Film size={20} className="text-[#60a5fa]" /> Rekomendasi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {rekomendasi.map((item, i) => (
                <Link key={i} href={`/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#2A2B3D] mb-2 relative">
                    <img src={`/api/image-proxy?url=${encodeURIComponent(item.poster || item.thumb)}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-[#60a5fa] text-blue-950 text-[10px] font-extrabold px-2 py-0.5 rounded-sm shadow-sm uppercase">SERIES</div>
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-2">{item.title}</h4>
                </Link>
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
