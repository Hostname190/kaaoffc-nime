'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, BookOpen } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import Sidebar from '../../components/Sidebar';
import WidgetTitle from '../../components/WidgetTitle';
import CommentSection from '../../components/CommentSection';
import StarRating from '../../components/StarRating';
import { supabase } from '@/lib/supabase';

function NovelDetailContent() {
  const { user } = useAuth();
  const { id } = useParams();
  const [novel, setNovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [bookmarkCat, setBookmarkCat] = useState('ongoing');

  useEffect(() => {
    const checkBookmark = async () => {
      if (user && id) {
        try {
          const { data } = await supabase
            .from('user_bookmarks')
            .select('item_url, category')
            .eq('user_id', user.id)
            .eq('item_url', `/novel/${id}`)
            .single();
          
          if (data) {
            setIsBookmarked(true);
            setBookmarkCat(data.category || 'Novel');
          }
        } catch(e) {}
      } else {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [id, user]);

  useEffect(() => {
    if (id) {
      fetch(`/api/novels/${id}`)
        .then(res => res.json())
        .then(data => {
          setNovel(data);
          setLoading(false);
        });
    }
  }, [id]);

  const toggleBookmark = async () => {
    if (!id || !novel) return;
    if (!user) {
      alert('Silakan login untuk menambahkan ke Watchlist!');
      return;
    }
    try {
      const url = `/novel/${id}`;
      if (isBookmarked) {
        await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: url });
        setIsBookmarked(false);
      } else {
        await supabase.from('user_bookmarks').upsert({
          user_id: user.id,
          item_url: url,
          title: novel.title,
          poster: novel.thumbnail,
          category: 'Novel'
        }, { onConflict: 'user_id,item_url' });
        setIsBookmarked(true);
        setBookmarkCat('Novel');
      }
    } catch (e) {}
  };

  const changeBookmarkCategory = async (newCat: string) => {
    if (!id || !user) return;
    try {
      const url = `/novel/${id}`;
      await supabase.from('user_bookmarks').update({ category: newCat }).match({ user_id: user.id, item_url: url });
      setBookmarkCat(newCat);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
      </div>
    );
  }

  if (!novel || novel.error) {
    return <div className="text-center p-8 text-red-500">Novel tidak ditemukan.</div>;
  }

  const chapters = novel.chapters || [];

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row p-6 gap-6">
        <div className="w-48 shrink-0 aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mx-auto sm:mx-0">
          {novel.thumbnail ? (
            <img 
              src={novel.thumbnail.startsWith('/') ? novel.thumbnail : `/api/image-proxy?url=${encodeURIComponent(novel.thumbnail)}`} 
              alt={novel.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400"><BookOpen size={32}/></div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">{novel.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {isBookmarked && (
                <select 
                  value={bookmarkCat} 
                  onChange={(e) => {
                    setBookmarkCat(e.target.value);
                    changeBookmarkCategory(e.target.value);
                  }}
                  className="text-xs font-bold rounded-full px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 focus:outline-none dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50 appearance-none cursor-pointer"
                >
                  <option value="ongoing">Sedang Diikuti</option>
                  <option value="plan">Rencana Dibaca</option>
                  <option value="completed">Sudah Selesai</option>
                </select>
              )}
              <button 
 onClick={toggleBookmark}
 className={`p-2 shrink-0 rounded-full border transition-all ${
 isBookmarked 
 ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400 -500/10' 
 : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:text-rose-400 dark:hover:border-rose-800/50 dark:hover:bg-rose-900/20'
 }`}
 title={isBookmarked ? "Hapus dari Favorit" : "Tambah ke Favorit"}
 >
                <Heart size={20} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Oleh {novel.author}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {novel.status}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {novel.genre}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Novel Teks
            </span>
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border border-zinc-200 dark:border-zinc-800 mb-6 whitespace-pre-line">
            {novel.synopsis || "Tidak ada deskripsi."}
          </div>

          <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Beri Rating Novel Ini</h3>
            <StarRating url={`/novel/${novel.id}`} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <WidgetTitle title="Daftar Chapter" />
          {chapters.length > 0 && (
            <button
 onClick={() => setSortAsc(!sortAsc)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-500 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              {sortAsc ? '↓ Chapter Awal' : '↑ Chapter Terbaru'}
            </button>
          )}
        </div>
        
        {(() => {
          const sorted = sortAsc ? [...chapters] : [...chapters].reverse();
          const GRID_LIMIT = 50;
          const shown = expanded ? sorted : sorted.slice(0, GRID_LIMIT);

          if (chapters.length === 0) {
             return <div className="p-8 text-center border border-dashed border-zinc-700 rounded-xl text-zinc-500">Belum ada chapter yang dirilis.</div>;
          }

          return (
            <>
              {/* Untuk Novel kita biarkan bentuk list atau grid kotak besar agar judul chapter muat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {shown.map((ch: any, idx: number) => {
                  const chNumber = sortAsc ? idx + 1 : chapters.length - idx;
                  return (
                    <Link 
                      key={ch.id}
                      href={`/novel/${novel.slug || novel.id}/${ch.id}`}
                      className="flex flex-col p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-500">Ch. {chNumber}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto">{new Date(ch.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        {ch.title}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {sorted.length > GRID_LIMIT && (
                <button 
 onClick={() => setExpanded(!expanded)}
                  className="w-full mt-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold text-sm hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-500 transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {expanded ? `Sembunyikan` : `Tampilkan Semua (${sorted.length} Chapter)`}
                </button>
              )}
            </>
          );
        })()}
      </div>

      <CommentSection itemUrl={`/novel/${id}`} />
    </div>
  );
}

export default function LocalNovelDetailPage() {
  return (
    <>
      <div className="flex-1 min-w-0">
        <Suspense fallback={<div className="p-8 text-center text-sm animate-pulse">Memuat...</div>}>
          <NovelDetailContent />
        </Suspense>
      </div>
      <Sidebar />
    </>
  );
}
