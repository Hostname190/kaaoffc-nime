'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Bookmark, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';
import AnimeCard3 from '@/app/anime/components/AnimeCard3';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';

export default function ComicBookmarksPage() {
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
          .in('category', ['Komik', 'comic', 'webtoon'])
          .order('created_at', { ascending: false });
          
        if (data) setBookmarks(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    try {
      setBookmarks(prev => prev.filter(b => b.item_url !== url));
      await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: url });
    } catch(e) {}
  };

  return (
    <>
    <div className="flex-1 min-w-0">
    <div className="min-h-screen bg-[#0D0D11] pb-24 font-sans text-white">
      <div className="sticky top-16 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-bold text-sm sm:text-base">Bookmarks Komik</h1>
        <div className="w-9"></div> {/* spacer */}
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-zinc-500 mt-4">Memuat bookmark...</p>
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {bookmarks.map((c: any, i: number) => {
              const rawUrl = c.item_url || c.novelUrl || c.url;
              const cat = (c.category || '').toLowerCase();
              
              // Webtoon URLs are external (http...) and need wrapping
              // Comic URLs are slugs and go to /comic/detail/slug
              const isWebtoon = cat === 'webtoon' || (rawUrl && rawUrl.startsWith('http'));
              const href = isWebtoon 
                ? `/detail?url=${encodeURIComponent(rawUrl)}&source=webtoons`
                : `/comic/detail/${rawUrl}`;
              
              // For images: poster field already has the image URL
              const imgUrl = c.poster || c.image || c.image_url || c.thumbnail || c.cover || '';
              const finalSrc = imgUrl.startsWith('http') ? `/api/image-proxy?url=${encodeURIComponent(imgUrl)}` : imgUrl;
              
              return (
                <div key={i} className="relative group">
                  <AnimeCard3 
                    item={{...c, type: isWebtoon ? 'Webtoon' : (c.type || 'Komik'), episode: c.chapter, poster: imgUrl}} 
                    href={href} 
                  />
                  <button 
                    onClick={(e) => removeBookmark(rawUrl, e)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-red-500 backdrop-blur-md rounded-full text-white z-20 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
            <Bookmark size={48} className="mb-4 opacity-50" />
            <p>{!user ? 'Silakan login untuk melihat Watchlist' : 'Belum ada komik yang di-bookmark.'}</p>
          </div>
        )}
      </div>
    </div>
    </div>
    <Sidebar />
    </>
  );
}
