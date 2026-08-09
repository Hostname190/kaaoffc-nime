// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, List, BookOpen, Bookmark, Home, Share2, Download, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CommentSection from '../../../components/CommentSection';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function NovelDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const getImageUrl = (item: any) => {
    const src = item?.poster || item?.cover || item?.thumbnail || '';
    if (!src) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48L3N2Zz4=';
    let finalSrc = typeof src === 'string' ? src : src.url || '';
    if (finalSrc && finalSrc.includes('http')) {
      return `/api/image-proxy?url=${encodeURIComponent(finalSrc)}`;
    }
    return finalSrc;
  };

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const isOriginal = !id.startsWith('sakura-');
        let dataPayload;

        if (!isOriginal) {
          const slug = id.replace('sakura-', '');
          const res = await fetch(`/api/novel/sakuranovel/detail/${slug}`);
          const raw = await res.json();
          dataPayload = raw?.data || raw?.result;
          if (dataPayload) {
            dataPayload.source = 'sakura';
            dataPayload._slug = slug;
          }
        } else {
          // Admin original novel
          const res = await fetch(`/api/novels/${id}`);
          const raw = await res.json();
          if (raw && !raw.error) {
            dataPayload = raw;
            dataPayload.source = 'admin';
            dataPayload._slug = id;
            if (!dataPayload.title) dataPayload.title = dataPayload.judul || 'Novel Original';
          }
        }

        if (dataPayload) {
          setData(dataPayload);
        }
      } catch (error) {
        console.error("Failed to fetch novel detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (user && data) {
        try {
          const { data: bkm } = await supabase
            .from('user_bookmarks')
            .select('item_url')
            .eq('user_id', user.id)
            .eq('item_url', `/novel/detail/${id}`)
            .single();
          if (bkm) setIsBookmarked(true);
        } catch (e) {}
      } else {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [data, id, user]);

  const chapters: any[] = data?.chapters || [];

  const toggleBookmark = async () => {
    if (!user) {
      alert('Silakan login untuk menambahkan ke Watchlist!');
      return;
    }
    try {
      if (isBookmarked) {
        await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: `/novel/detail/${id}` });
        setIsBookmarked(false);
      } else {
        await supabase.from('user_bookmarks').upsert({
          user_id: user.id,
          item_url: `/novel/detail/${id}`,
          title: data.title,
          poster: getImageUrl(data),
          category: 'Novel'
        }, { onConflict: 'user_id,item_url' });
        setIsBookmarked(true);
      }
    } catch (e) {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex flex-col gap-8 animate-pulse">
        <div className="h-64 bg-zinc-900 rounded-2xl w-full"></div>
        <div className="h-96 bg-zinc-900 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Novel tidak ditemukan</h1>
        <button onClick={() => router.back()} className="px-6 py-2 bg-pink-600 rounded-lg hover:bg-pink-700">Kembali</button>
      </div>
    );
  }

  const image = getImageUrl(data);
  const status = data.status || 'Ongoing';
  const year = data.year || data.released || '';
  const rawGenres = Array.isArray(data.genres) ? data.genres : [];
  const rawTags = Array.isArray(data.tags) ? data.tags : typeof data.tags === 'string' ? data.tags.split(' ') : [];
  const genres = [...rawGenres, ...rawTags].map((g: any) => typeof g === 'string' ? g : g.name || '').filter(Boolean).slice(0, 8);

  const getChapterHref = (ch: any) => {
    if (!ch) return '#';
    const isOriginal = !id.startsWith('sakura-');
    if (isOriginal) return `/novel/read/${ch.id}`;
    const slug = ch.slug || ch.id;
    return `/novel/read/sakura-${slug}`;
  };

  const sortedChapters = [...chapters]
    .filter((ch: any) => !searchQuery || (ch.title || ch.chapter || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => {
      const aDate = new Date(a.date || a.created_at || 0).getTime();
      const bDate = new Date(b.date || b.created_at || 0).getTime();
      return sortAsc ? aDate - bDate : bDate - aDate;
    });

  const firstChapterHref = getChapterHref(chapters[chapters.length - 1]);
  const latestChapterHref = getChapterHref(chapters[0]);
  const slug = data._slug || (id.startsWith('sakura-') ? id.replace('sakura-', '') : id);

  return (
    <>
    <div className="flex-1 min-w-0">
    <div className="min-h-screen bg-zinc-950 pb-24 font-sans relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pt-8 pb-6 flex flex-col md:flex-row gap-6 md:gap-10">
        <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10">
          <img src={image} alt="bg" referrerPolicy="no-referrer" className="w-full h-full object-cover blur-2xl opacity-20 scale-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950"></div>
        </div>

        {/* Left Side: Info & Poster */}
        <div className="w-full md:w-[300px] xl:w-[350px] flex flex-col items-center md:items-start shrink-0">
          {/* Poster */}
          <div className="w-44 sm:w-56 md:w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-5 border border-zinc-700/30">
            <img src={image} alt={data.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjAwIDMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxNTE3MjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjNkI3MjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+' }} />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center md:text-left mb-4 leading-tight">{data.title}</h1>

          {/* Badges */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
            <span className="px-3 py-1 bg-pink-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">Kaaoffc</span>
            <span className={`px-3 py-1 text-white text-[10px] font-bold rounded uppercase tracking-wider ${status.toLowerCase() === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'}`}>{status}</span>
            {year && <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded flex items-center gap-1"><Clock size={12} /> {year}</span>}
            {data.score && (
              <span className="px-3 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded flex items-center gap-1"><Star size={12} className="fill-black" /> {data.score}</span>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
            {genres.slice(0, 6).map((g: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg">{g}</span>
            ))}
            {genres.length > 6 && (
              <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg">+{genres.length - 6}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <Link href={firstChapterHref} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors shadow-lg shadow-pink-600/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Ch. Awal
            </Link>
            <Link href={latestChapterHref} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors border border-zinc-700">
              <Clock size={18} />
              Lanjut Baca
            </Link>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
        {/* Synopsis Box */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-pink-400 flex items-center gap-2">
              <BookOpen size={20} />
              Sinopsis
            </h2>
            <div className="flex gap-2">
              <Link href="/novel" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-300"><Home size={14} /> Home</Link>
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/50 text-indigo-300 rounded-lg text-xs font-bold transition-colors hover:bg-indigo-900">
                <Share2 size={14} /> {copySuccess ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed mb-2 whitespace-pre-wrap">
            {isExpanded
              ? (data.summary || data.synopsis || data.description || 'Tidak ada sinopsis tersedia.')
              : (data.summary?.substring(0, 150) || data.synopsis?.substring(0, 150) || data.description?.substring(0, 150) || 'Tidak ada sinopsis tersedia.') + '...'}
          </p>
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-pink-500 text-sm font-bold mb-5 hover:underline">
            {isExpanded ? 'Tutup' : 'Selengkapnya...'}
          </button>

          <div className="w-full h-[1px] bg-zinc-800 mb-5"></div>

          <button onClick={toggleBookmark} className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 text-sm transition-colors ${isBookmarked ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
            <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
            {isBookmarked ? 'Hapus dari Bookmark' : 'Simpan ke Bookmark'}
          </button>
        </div>

        {/* Daftar Chapter */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-5">
            <List size={20} className="text-pink-400" />
            <h2 className="text-lg font-bold text-white flex-1">Daftar Chapter ({chapters.length})</h2>
            <button onClick={() => setSortAsc(!sortAsc)} className="bg-pink-900/50 text-pink-300 text-[10px] font-bold px-2 py-1 rounded cursor-pointer hover:bg-pink-900 transition-colors">
              {sortAsc ? 'A-Z' : 'Z-A'}
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Cari chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-zinc-600 focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedChapters.length > 0 ? (
              sortedChapters.map((chap: any, i: number) => {
                const chapterHref = getChapterHref(chap);
                
                const formatChapterTitle = (rawTitle: string, novelTitle: string) => {
                  if (!rawTitle) return `Chapter ${i + 1}`;
                  let clean = rawTitle;
                  if (novelTitle && clean.toLowerCase().includes(novelTitle.toLowerCase())) {
                    clean = clean.replace(new RegExp(novelTitle, 'ig'), '').trim();
                  }
                  clean = clean.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '');
                  const chapMatch = clean.match(/chapter\s*\d+/i);
                  if (chapMatch) return chapMatch[0];
                  return clean || rawTitle;
                };
                
                const displayTitle = formatChapterTitle(chap.title || chap.chapter || '', data.title);

                return (
                  <Link href={chapterHref} key={chap.slug || i} className="flex justify-between items-center p-4 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-zinc-700">
                    <span className="text-white text-sm font-bold truncate pr-4 capitalize">{displayTitle}</span>
                    <div className="flex items-center gap-3 shrink-0 text-zinc-500">
                      <span className="text-[10px]">{chap.date || chap.released || 'Baru'}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">Belum ada chapter yang cocok.</div>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <CommentSection itemUrl={`/novel/detail/${id}`} />

      </div>
      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}
