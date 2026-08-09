'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, PlayCircle, Trash2, Play, Heart, HeartOff } from 'lucide-react';
import WidgetTitle from '../components/WidgetTitle';

import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'history'|'bookmarks'>('history');
  const [activeCategory, setActiveCategory] = useState<'all'|'ongoing'|'plan'|'completed'>('all');

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('kaaoffc_history');
      if (historyStr) {
        setHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', 'Donghua')
          .order('created_at', { ascending: false });
        if (data) setBookmarks(data);
      } catch (e) {}
    };
    fetchBookmarks();
  }, [user]);

  const clearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
      localStorage.removeItem('kaaoffc_history');
      setHistory([]);
    }
  };

  const removeBookmark = async (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      setBookmarks(prev => prev.filter(b => b.item_url !== url && b.novelUrl !== url));
      await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: url });
    } catch(e) {}
  };

  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex gap-6 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-0">
          <button 
 onClick={() => setActiveTab('history')}
            className={`font-bold px-1 py-3 transition-colors -mb-[1px] border-b-2 ${activeTab === 'history' ? 'border-amber-600 text-amber-600' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          >
            Riwayat Bacaan
          </button>
          <button 
 onClick={() => setActiveTab('bookmarks')}
            className={`font-bold px-1 py-3 transition-colors -mb-[1px] border-b-2 ${activeTab === 'bookmarks' ? 'border-rose-500 text-rose-500' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          >
            Favorit Saya
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <WidgetTitle title={activeTab === 'history' ? "Riwayat Bacaan" : "Favorit Saya"} />
          {activeTab === 'history' && history.length > 0 && (
            <button onClick={clearHistory} className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Hapus Semua Riwayat">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {activeTab === 'history' && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <BookOpen size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
            <h2 className="text-zinc-900 dark:text-zinc-100 font-bold mb-2">Riwayat Kosong</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Anda belum membaca atau menonton apapun.</p>
            <Link href="/search" className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors">
              Mulai Jelajahi
            </Link>
          </div>
        )}

        {activeTab === 'history' && history.length > 0 && (
          <div className="flex flex-col gap-3">
            {history.map((item, idx) => {
              const isDonghua = item.source === 'donghua';
              const readLink = isDonghua 
                ? `/watch?url=${encodeURIComponent(item.episodeUrl)}&source=donghua`
                : `/read?url=${encodeURIComponent(item.episodeUrl)}&source=${item.source || 'webtoons'}`;
              
              return (
                <Link 
                  key={idx}
                  href={`/detail?url=${encodeURIComponent(item.novelUrl)}&source=${item.source || 'webtoons'}`}
                  className="flex items-center gap-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700/50 transition-all group"
                >
                  <div className="w-16 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                    {item.thumbnail ? (
                      <img 
                        src={`/api/image-proxy?url=${encodeURIComponent(item.thumbnail)}`} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400"><BookOpen size={20} /></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{item.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Clock size={12} className="text-amber-500" />
                      <span className="truncate">Terakhir: {item.episodeTitle}</span>
                    </div>
                    {isDonghua && <span className="text-[10px] mt-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded w-fit">Donghua</span>}
                  </div>

                  <Link href={readLink} onClick={(e) => e.stopPropagation()} className="shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-colors">
                    {isDonghua ? <Play size={14} fill="currentColor" /> : <PlayCircle size={18} />}
                  </Link>
                </Link>
              );
            })}
          </div>
        )}

        {activeTab === 'bookmarks' && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <HeartOff size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
            <h2 className="text-zinc-900 dark:text-zinc-100 font-bold mb-2">Belum ada Favorit</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Tambahkan komik atau donghua favorit Anda ke sini.</p>
            <Link href="/search" className="px-6 py-2.5 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors">
              Mulai Jelajahi
            </Link>
          </div>
        )}

        {activeTab === 'bookmarks' && bookmarks.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <button onClick={() => setActiveCategory('all')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeCategory === 'all' ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}>Semua</button>
              <button onClick={() => setActiveCategory('ongoing')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeCategory === 'ongoing' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}>Sedang Ditonton/Dibaca</button>
              <button onClick={() => setActiveCategory('plan')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeCategory === 'plan' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}>Rencana Ditonton</button>
              <button onClick={() => setActiveCategory('completed')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeCategory === 'completed' ? 'bg-green-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}>Selesai</button>
            </div>

            <div className="flex flex-col gap-3">
              {bookmarks.filter(b => activeCategory === 'all' || (b.category || 'Donghua') === activeCategory).map((item, idx) => {
                const isDonghua = true;
                const catLabel = 'Donghua';
                const catColor = 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
                
                const url = item.item_url || item.novelUrl;

                return (
                  <Link 
                    key={idx}
                    href={`/detail?url=${encodeURIComponent(url)}&source=donghua`}
                    className="flex items-center gap-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-700/50 transition-all group"
                  >
                    <div className="w-16 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                      {(item.poster || item.thumbnail) ? (
                        <img 
                          src={`/api/image-proxy?url=${encodeURIComponent(item.poster || item.thumbnail)}`} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400"><BookOpen size={20} /></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">{item.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${catColor}`}>{catLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Ditambahkan: {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => removeBookmark(url, e)} 
                      className="shrink-0 p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-full transition-colors"
                      title="Hapus dari Favorit"
                    >
                      <Heart size={20} fill="currentColor" />
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
