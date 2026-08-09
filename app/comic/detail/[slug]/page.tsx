// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Star, Clock, AlertTriangle, ArrowLeft, Bookmark, Download, Share2, BookOpen, MessageCircle, List, Home } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CommentSection from '../../../components/CommentSection';
import { useAuth } from '../../../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Sidebar from '../../../components/Sidebar';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';

export default function ComicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const checkBookmark = async () => {
      if (user && data) {
        try {
          const { data: bkm } = await supabase
            .from('user_bookmarks')
            .select('item_url')
            .eq('user_id', user.id)
            .eq('item_url', slug)
            .single();
          
          if (bkm) setIsBookmarked(true);
        } catch (e) {}
      } else {
        setIsBookmarked(false);
      }
    };
    
    checkBookmark();
  }, [data, slug, user]);

  const toggleBookmark = async () => {
    if (!user) {
      alert('Silakan login untuk menambahkan ke Watchlist!');
      return;
    }
    
    try {
      if (isBookmarked) {
        await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: slug });
        setIsBookmarked(false);
      } else {
        await supabase.from('user_bookmarks').upsert({
          user_id: user.id,
          item_url: slug,
          title: data.title,
          poster: data.image || data.poster || data.thumbnail,
          category: 'Komik'
        }, { onConflict: 'user_id,item_url' });
        setIsBookmarked(true);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!slug) return;
    
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/comic/comic/${slug}`);
        const json = await res.json();
        
        if (json && !json.error) {
          setData(json);
        }
        
        // Fetch recommendations
        try {
          const recRes = await fetch('/api/comic/recommendations');
          const recJson = await recRes.json();
          if (recJson && recJson.recommendations) {
            // Parse slug
            const parsedRecs = recJson.recommendations.map((r: any) => {
              let parsedSlug = r.link;
              if (parsedSlug.startsWith('/')) {
                const m = parsedSlug.match(/\/manga\/([^/]+)/);
                parsedSlug = m ? m[1] : parsedSlug.replace(/^\/|\/$/g, '');
              } else {
                const urlMatch = parsedSlug.match(/\/manga\/([^/]+)/);
                parsedSlug = urlMatch ? urlMatch[1] : parsedSlug;
              }
              return { ...r, slug: parsedSlug };
            });
            setRecommendations(parsedRecs.slice(0, 5)); // show top 5
          }
        } catch (e) {}

      } catch (error) {
        console.error("Failed to fetch comic detail:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetail();
  }, [slug]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getHistoryChap = () => {
    // If we have history later we can route there, for now return the first chapter of the array
    return chapters[0]?.slug || slug;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6 flex flex-col gap-8 animate-pulse">
        <div className="h-64 bg-zinc-900 rounded-2xl w-full"></div>
        <div className="h-96 bg-zinc-900 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Komik tidak ditemukan</h1>
        <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Kembali</button>
      </div>
    );
  }

  const image = data.image || data.poster;
  const status = data.metadata?.status || data.status || 'Ongoing';
  const type = data.metadata?.type || data.type || 'COMIC';
  const author = data.metadata?.author || data.author || 'Unknown Author';
  const year = data.metadata?.year || data.year || '2024';
  const genres = data.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || [];
  const chapters = data.chapters || data.chapterList || [];

  return (
    <>
    <div className="flex-1 min-w-0">
    <div className="min-h-screen bg-transparent pb-24 font-sans relative">
      {/* 1. Blurred Background Top Section */}
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pt-8 pb-6 flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Blurred Background Layer */}
        <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10">
          <img src={`/api/image-proxy?url=${encodeURIComponent(image)}`} alt="Background" className="w-full h-full object-cover blur-2xl opacity-20 scale-110" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/80 to-[#09090b]"></div>
        </div>

        {/* Left Side: Info & Poster */}
        <div className="w-full md:w-[300px] xl:w-[350px] flex flex-col items-center md:items-start shrink-0">
          {/* Poster */}
          <div className="w-44 sm:w-56 md:w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-5 border border-zinc-700/30">
            <img src={`/api/image-proxy?url=${encodeURIComponent(image)}`} alt={data.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+' }} />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center md:text-left mb-4 leading-tight">{data.title}</h1>

          {/* Badges */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">{status}</span>
            <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded flex items-center gap-1"><Clock size={12} /> {year}</span>
            <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded uppercase tracking-wider">{type}</span>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
            {genres.slice(0, 4).map((g: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg">{g}</span>
            ))}
            {genres.length > 4 && (
              <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg">+{genres.length - 4}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <Link href={`/comic/read/${chapters[chapters.length - 1]?.slug || slug}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors shadow-lg shadow-blue-600/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Ch. Awal
            </Link>
            <Link href={`/comic/read/${chapters[0]?.slug || slug}`} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors border border-zinc-700">
              <Clock size={18} />
              Lanjut Baca
            </Link>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
        {/* 2. Synopsis Box */}
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <BookOpen size={20} />
              Sinopsis
            </h2>
            <div className="flex gap-2">
              <Link href="/comic" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-300"><Home size={14} /> Home</Link>
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/50 text-indigo-300 rounded-lg text-xs font-bold transition-colors hover:bg-indigo-900">
                <Share2 size={14} /> {copySuccess ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>
          
          <p className="text-zinc-300 text-sm leading-relaxed mb-2 whitespace-pre-wrap">
            {isExpanded 
              ? (data.synopsis || data.description || 'Tidak ada sinopsis tersedia.')
              : (data.synopsis?.substring(0, 150) || data.description?.substring(0, 150) || 'Tidak ada sinopsis tersedia.') + '...'}
          </p>
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-500 text-sm font-bold mb-5 hover:underline">
            {isExpanded ? 'Tutup' : 'Selengkapnya...'}
          </button>
          
          <div className="w-full h-[1px] bg-zinc-800 mb-5"></div>
          
          <button onClick={toggleBookmark} className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 text-sm transition-colors ${isBookmarked ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
            <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
            {isBookmarked ? 'Hapus dari Bookmark' : 'Simpan ke Bookmark'}
          </button>
        </div>

        {/* 3. Daftar Chapter */}
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-5">
            <List size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white flex-1">Daftar Chapter</h2>
            <span className="bg-indigo-900 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded">Z-A</span>
          </div>

          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Cari chapter..." 
              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {chapters.length > 0 ? (
              chapters.map((chap: any, i: number) => (
                <Link href={`/comic/read/${chap.slug}`} key={i} className="flex justify-between items-center p-4 bg-[#1A1C30]/50 hover:bg-[#1A1C30] rounded-lg transition-colors border border-transparent hover:border-zinc-700">
                  <span className="text-white text-sm font-bold truncate pr-4">{chap.title || chap.chapter}</span>
                  <div className="flex items-center gap-3 shrink-0 text-zinc-500">
                    <Download size={16} className="hover:text-white transition-colors" />
                    <span className="text-[10px]">{chap.date || 'Baru'}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">Belum ada chapter.</div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="bg-[#151728] rounded-2xl p-4 sm:p-5 border border-zinc-800/50 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star size={20} className="text-yellow-500 fill-yellow-500" /> Komik Serupa
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {recommendations.map((rec: any, i: number) => (
                <AnimeCard3 
                  key={i} 
                  item={{...rec, type: rec.type || 'Komik', episode: rec.chapter, poster: rec.image}} 
                  href={`/comic/detail/${rec.slug}`} 
                />
              ))}
            </div>
          </div>
        )}
        <CommentSection itemUrl={`/comic/detail/${slug}`} />

      </div>
      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}
