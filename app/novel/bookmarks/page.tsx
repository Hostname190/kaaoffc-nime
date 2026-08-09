'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';

import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function NovelBookmarksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('user_bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', 'Novel')
          .order('created_at', { ascending: false });
        if (data) setBookmarks(data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (url: string) => {
    if (!user) return;
    try {
      setBookmarks(prev => prev.filter(b => b.item_url !== url && b.novelUrl !== url));
      await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: url });
    } catch (e) {}
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
          <h1 className="text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2">
            <BookOpen size={18} className="text-pink-500" /> Novel Tersimpan
          </h1>
        </div>
        <div className="w-9" />
      </div>

      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p>{!user ? 'Silakan login untuk melihat Watchlist' : 'Belum ada novel yang di-bookmark.'}</p>
            <Link href="/novel" className="mt-6 px-6 py-2.5 bg-green-600 font-bold text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-900/50">Cari Novel</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
            {bookmarks.map((b, i) => {
              const url = b.item_url || b.novelUrl || b.url;
              let displayChap = 'Top';
              const raw = b.chapter || b.latest_chapter;
              if (raw) {
                let clean = raw;
                if (b.title && clean.toLowerCase().includes(b.title.toLowerCase())) {
                  clean = clean.replace(new RegExp(b.title, 'ig'), '').trim();
                }
                clean = clean.replace(/^[-–—:\s]+|[-–—:\s]+$/g, '');
                const chapMatch = clean.match(/chapter\s*\d+/i);
                displayChap = chapMatch ? chapMatch[0] : (clean || 'Top');
              }
              
              return (
                <div key={i} className="relative group">
                  <AnimeCard3 
                    item={{
                      ...b, 
                      type: 'Novel', 
                      episode: displayChap, 
                      poster: b.poster,
                      rating: b.score || b.rating
                    }} 
                    href={url} 
                  />
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeBookmark(url); }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-red-500 backdrop-blur-md rounded-full text-white z-20 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}
