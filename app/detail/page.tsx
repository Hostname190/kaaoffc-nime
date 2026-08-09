// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Clock, Users, BookOpen, Play, Search, Share2, Tag, Bookmark, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthProvider';
import Sidebar from '../components/Sidebar';
import WidgetTitle from '../components/WidgetTitle';
import CommentSection from '../components/CommentSection';
import StarRating from '../components/StarRating';

function DetailContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const source = searchParams.get('source') || 'webtoons';
  
  const [detail, setDetail] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [epSearch, setEpSearch] = useState('');
  const { user } = useAuth();
  const [epPage, setEpPage] = useState(1);
  const EP_PER_PAGE = 30;

  useEffect(() => {
    setEpPage(1);
  }, [epSearch, sortAsc]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (user && url) {
        try {
          const { data } = await supabase
            .from('user_bookmarks')
            .select('item_url, category')
            .eq('user_id', user.id)
            .eq('item_url', url)
            .single();
          
          if (data) {
            setIsBookmarked(true);
            setBookmarkCat(data.category || 'Donghua');
          }
        } catch(e) {}
      } else {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [url, user]);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    let endpoint = `/api/episodes?url=${encodeURIComponent(url)}&page=1&source=${source}`;
    if (source === 'donghua') {
      endpoint = `/api/donghua/detail?slug=${encodeURIComponent(url)}`;
    }

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        setDetail(data);
        if (source === 'donghua') {
          setEpisodes(data.episodes || []);
          setHasMore(false);
        } else {
          setEpisodes(data.episodesList || []);
          setHasMore(data.hasNext);
        }
        setPage(1);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [url, source]);

  const loadMore = () => {
    if (!url || !hasMore || loadingMore || source === 'donghua') return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetch(`/api/episodes?url=${encodeURIComponent(url)}&page=${nextPage}&source=${source}`)
      .then(res => res.json())
      .then(data => {
        setEpisodes(prev => [...prev, ...(data.episodesList || [])]);
        setHasMore(data.hasNext);
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingMore(false);
      });
  };

  const saveHistory = (ep: any) => {
    if (!url || !detail) return;
    try {
      const historyStr = localStorage.getItem('kaaoffc_history');
      let history: any[] = historyStr ? JSON.parse(historyStr) : [];
      
      history = history.filter(item => item.novelUrl !== url);
      
      history.unshift({
        novelUrl: url,
        title: detail.title,
        thumbnail: detail.thumbnail || detail.poster,
        episodeUrl: source === 'donghua' ? ep.episodeId : ep.url,
        episodeTitle: ep.title,
        source: source,
        timestamp: Date.now()
      });
      
      if (history.length > 100) history.pop();
      localStorage.setItem('kaaoffc_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const toggleBookmark = async () => {
    if (!url || !detail) return;
    if (!user) {
      alert('Silakan login untuk menambahkan ke Watchlist!');
      return;
    }
    
    try {
      if (isBookmarked) {
        await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url: url });
        setIsBookmarked(false);
      } else {
        let categoryName = 'Donghua';
        if (source === 'anime') categoryName = 'Anime';
        else if (source === 'novel') categoryName = 'Novel';
        else if (source === 'comic' || source === 'komik') categoryName = 'Komik';
        else if (source === 'webtoons') categoryName = 'webtoon';
        
        await supabase.from('user_bookmarks').upsert({
          user_id: user.id,
          item_url: url,
          title: detail.title,
          poster: detail.thumbnail || detail.poster,
          category: categoryName
        }, { onConflict: 'user_id,item_url' });
        
        setIsBookmarked(true);
        setBookmarkCat(categoryName);
      }
    } catch (e) {
      console.error('Failed to save bookmark', e);
    }
  };

  const handleShare = async () => {
    if (!detail) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: detail.title,
          text: detail.synopsis ? detail.synopsis.substring(0, 100) + '...' : '',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link berhasil disalin ke clipboard!');
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const changeBookmarkCategory = async (newCat: string) => {
    if (!url || !user) return;
    try {
      await supabase.from('user_bookmarks').update({ category: newCat }).match({ user_id: user.id, item_url: url });
      setBookmarkCat(newCat);
    } catch (e) {}
  };

  // Baca kategori saat init
  const [bookmarkCat, setBookmarkCat] = useState('Donghua');

  if (!url) {
    return <div className="text-center p-8 text-red-500 font-bold">Error: URL tidak ditemukan</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
      </div>
    );
  }

  if (!detail) {
    return <div className="text-center p-8 text-zinc-500">Gagal memuat data</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {source === 'donghua' ? (
        <div className="w-full flex flex-col gap-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col relative pb-6">
            {/* Blurred Background Header */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-[2px] opacity-100" 
                style={{ backgroundImage: `url('/api/image-proxy?url=${encodeURIComponent(detail.thumbnail || detail.poster)}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/10 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-900/40"></div>
            </div>
            
            <div className="relative px-4 sm:px-8 -mt-32 sm:-mt-48 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 w-full">
              {/* Left Column: Poster */}
              <div className="w-32 sm:w-48 lg:w-56 shrink-0 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 mb-2 sm:mb-0 bg-zinc-100 dark:bg-zinc-800">
                <img src={`/api/image-proxy?url=${encodeURIComponent(detail.thumbnail || detail.poster)}`} alt={detail.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
              </div>

              {/* Right Column: Info */}
              <div className="flex-1 flex flex-col items-center sm:items-start w-full">
                {/* Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-center sm:text-left text-zinc-900 dark:text-zinc-100 mb-2 drop-shadow-sm">
                  {detail.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-center sm:text-left italic mb-6 w-full">
                  {detail.alternativeTitle || detail.title}
                </p>

                {/* Pills */}
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-6">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500 text-white shadow-sm">
                    {detail.status || 'Ongoing'}
                  </span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center gap-1.5">
                    <Play size={12} /> Donghua
                  </span>
                  {detail.rating && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                      <Star size={12} fill="currentColor" /> {detail.rating}
                    </span>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-12 gap-y-3 w-full max-w-3xl text-xs sm:text-sm mb-6 px-2 sm:px-0">
                  <div className="flex flex-col gap-3 sm:pr-6">
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Studio</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.studio || '-'}</span></div>
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Season</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.season || '-'}</span></div>
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Total Eps</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.totalEpisodes || episodes.length || '-'}</span></div>
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Released</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.releasedOn || '-'}</span></div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Network</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.network || '-'}</span></div>
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Country</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.country || 'China'}</span></div>
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Duration</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.duration || '-'}</span></div>
                    <div className="flex flex-row sm:items-center justify-between"><span className="text-zinc-500 mb-1 sm:mb-0">Updated</span><span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right sm:text-left">{detail.updatedOn || '-'}</span></div>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex justify-center sm:justify-start flex-wrap gap-2 mb-8 items-center w-full">
                  <span className="text-rose-500 dark:text-rose-400 mr-1"><Tag size={14} className="rotate-90" /></span>
                  {(detail.genres || []).map((g: any, i: number) => (
                    <span key={i} className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {g.name || g}
                    </span>
                  ))}
                  {detail.genre && (
                    <span className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {detail.genre}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 w-full mb-8">
                  <Link href={episodes[0] ? `/watch?url=${episodes[0].episodeId}&source=donghua` : '#'} className="flex-1 sm:flex-none min-w-[120px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-transform hover:scale-105 text-xs sm:text-sm">
                    <Play size={16} className="fill-current" /> Tonton
                  </Link>
                  <button onClick={toggleBookmark} className="flex-1 sm:flex-none min-w-[100px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm">
                    <Bookmark size={16} className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} /> {isBookmarked ? 'Tersimpan' : 'Simpan'}
                  </button>
                  <button onClick={handleShare} className="flex-1 sm:flex-none min-w-[100px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs sm:text-sm">
                    <Share2 size={16} /> Share
                  </button>
                </div>

                {/* Synopsis Card */}
                <div className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 text-left shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Sinopsis</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-justify sm:text-left">
                    {detail.synopsis || "Tidak ada deskripsi."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Daftar Episode <span className="text-zinc-500 text-sm font-normal">({episodes.length})</span>
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari episode..." 
                    value={epSearch}
                    onChange={(e) => setEpSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                {episodes.length > 0 && (
                  <button
 onClick={() => setSortAsc(!sortAsc)}
                    className="shrink-0 text-sm font-medium p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:text-amber-500 transition-colors"
                    title="Urutkan"
                  >
                    {sortAsc ? '↑ Lama' : '↓ Baru'}
                  </button>
                )}
              </div>
            </div>

            {(() => {
              let sorted = sortAsc ? [...episodes].reverse() : episodes;
              if (epSearch) {
                sorted = sorted.filter(ep => ep.title?.toLowerCase().includes(epSearch.toLowerCase()));
              }

              const totalPages = Math.ceil(sorted.length / EP_PER_PAGE);
              const paged = sorted.slice((epPage - 1) * EP_PER_PAGE, epPage * EP_PER_PAGE);

              return (
                <div className="flex flex-col">
                  <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {paged.length > 0 ? paged.map((ep: any, idx: number) => {
                      let epHref = `/watch?url=${ep.episodeId}&source=donghua`;
                      
                      const titleStr = String(ep.title || ep.episode || '');
                      const epNumbers = titleStr.match(/\d+/g);
                      const epNum = epNumbers && epNumbers.length > 0 
                        ? epNumbers[epNumbers.length - 1] 
                        : `${sortAsc ? ((epPage - 1) * EP_PER_PAGE) + idx + 1 : sorted.length - (((epPage - 1) * EP_PER_PAGE) + idx)}`;

                      return (
                        <Link 
                          key={idx}
                          href={epHref}
                          onClick={() => saveHistory(ep)}
                          className="flex items-center gap-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 hover:border-red-500/50 dark:hover:border-red-500/50 transition-colors group"
                        >
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                          </div>
                          <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            Ep {epNum}
                          </span>
                        </Link>
                      );
                    }) : (
                      <div className="text-center p-8 text-zinc-500 text-sm">
                        Episode tidak ditemukan.
                      </div>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <button 
                        onClick={() => setEpPage(p => Math.max(1, p - 1))}
                        disabled={epPage === 1}
                        className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-sm text-zinc-500 font-medium">Halaman {epPage} dari {totalPages}</span>
                      <button 
                        onClick={() => setEpPage(p => Math.min(totalPages, p + 1))}
                        disabled={epPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="min-h-[500px] bg-[#0B0D17] pb-24 font-sans relative w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pt-8 pb-6 flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10">
              <img src={`/api/image-proxy?url=${encodeURIComponent(detail.thumbnail || detail.poster)}`} alt="Background" className="w-full h-full object-cover blur-2xl opacity-20 scale-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0D17]/80 to-[#0B0D17]"></div>
            </div>

            {/* Left Side: Info & Poster */}
            <div className="w-full md:w-[300px] xl:w-[350px] flex flex-col items-center md:items-start shrink-0">
              {/* Poster */}
              <div className="w-44 sm:w-56 md:w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-5 border border-zinc-700/30 bg-zinc-900 flex items-center justify-center">
                {(detail.thumbnail || detail.poster) ? (
                  <img src={`/api/image-proxy?url=${encodeURIComponent(detail.thumbnail || detail.poster)}`} alt={detail.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-bg'); }} />
                ) : (
                  <span className="text-zinc-600 font-bold p-4 text-center">No Image</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center md:text-left mb-4 leading-tight">{detail.title}</h1>

              {/* Badges */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {source === 'webtoons' && <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">Webtoon</span>}
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">{detail.status || 'Ongoing'}</span>
                {detail.releasedOn && <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded flex items-center gap-1"><Clock size={12} /> {detail.releasedOn}</span>}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {(detail.genres || []).slice(0, 4).map((g: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg">{g.name || g}</span>
                ))}
                {(detail.genres || []).length > 4 && (
                  <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg">+{(detail.genres || []).length - 4}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex w-full gap-3">
                <Link href={episodes.length > 0 ? `/read?url=${encodeURIComponent(episodes[episodes.length - 1].url)}&source=${source}` : '#'} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors shadow-lg shadow-blue-600/20">
                  <Play size={18} fill="currentColor" />
                  Ch. Awal
                </Link>
                <Link href={episodes.length > 0 ? `/read?url=${encodeURIComponent(episodes[0].url)}&source=${source}` : '#'} className="flex-1 bg-zinc-800/80 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-colors border border-zinc-700">
                  <Clock size={18} />
                  Lanjut
                </Link>
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
              {/* Synopsis Box */}
              <div className="bg-[#151728] rounded-2xl p-5 border border-zinc-800/50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                    <BookOpen size={20} />
                    Sinopsis
                  </h2>
                  <div className="flex gap-2">
                    <Link href="/comic" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-300"><Home size={14} /> Home</Link>
                    <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/50 text-indigo-300 rounded-lg text-xs font-bold transition-colors hover:bg-indigo-900">
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
                
                <p className="text-zinc-300 text-sm leading-relaxed mb-5 whitespace-pre-wrap">
                  {detail.synopsis || detail.description || 'Tidak ada sinopsis tersedia.'}
                </p>
                
                <div className="w-full h-[1px] bg-zinc-800 mb-5"></div>
                
                <button onClick={toggleBookmark} className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 text-sm transition-colors ${isBookmarked ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                  <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
                  {isBookmarked ? 'Hapus dari Bookmark' : 'Simpan ke Bookmark'}
                </button>
              </div>

              {/* Daftar Chapter */}
              <div className="bg-[#151728] rounded-2xl p-5 border border-zinc-800/50">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen size={20} className="text-blue-400" />
                  <h2 className="text-lg font-bold text-white flex-1">Daftar Chapter</h2>
                  <button onClick={() => setSortAsc(!sortAsc)} className="bg-indigo-900/50 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded cursor-pointer hover:bg-indigo-900 transition-colors">
                    {sortAsc ? 'A-Z' : 'Z-A'}
                  </button>
                </div>

                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Cari chapter..." 
                    value={epSearch}
                    onChange={(e) => setEpSearch(e.target.value)}
                    className="w-full bg-[#0B0D17] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {episodes.length > 0 ? (
                    (sortAsc ? [...episodes].reverse() : episodes)
                    .filter(ep => ep.title?.toLowerCase().includes(epSearch.toLowerCase()))
                    .map((ep, i) => {
                      let epHref = `/read?url=${encodeURIComponent(ep.url)}&source=${source}`;
                      const originalIdx = episodes.indexOf(ep);
                      if (originalIdx > 0) {
                        const nextEp = episodes[originalIdx - 1];
                        epHref += `&next=${encodeURIComponent(nextEp.url)}`;
                      }
                      return (
                        <Link href={epHref} onClick={() => saveHistory(ep)} key={i} className="flex justify-between items-center p-4 bg-[#1A1C30]/50 hover:bg-[#1A1C30] rounded-lg transition-colors border border-transparent hover:border-zinc-700">
                          <span className="text-white text-sm font-bold truncate pr-4">{ep.title || ep.episode || `Chapter ${episodes.length - originalIdx}`}</span>
                          <div className="flex items-center gap-3 shrink-0 text-zinc-500">
                            <span className="text-[10px]">{ep.date || 'Baru'}</span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-sm">Belum ada chapter.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Komentar */}
      <CommentSection itemUrl={url} />
    </div>
  );
}

export default function DetailPage() {
  return (
    <>
      <div className="flex-1 min-w-0">
        <Suspense fallback={<div className="p-8 text-center text-sm animate-pulse">Memuat...</div>}>
          <DetailContent />
        </Suspense>
      </div>
      <Sidebar />
    </>
  );
}
