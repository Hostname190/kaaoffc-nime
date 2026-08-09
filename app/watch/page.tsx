// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Monitor, Download, Users, List, ExternalLink } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CommentSection from '../components/CommentSection';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../components/AuthProvider';

function WatchContent() {
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('url');
  const source = searchParams.get('source') || 'donghua';
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState(0);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(false);
  const [extractedVideoUrl, setExtractedVideoUrl] = useState<string | null>(null);
  const [processedServerUrl, setProcessedServerUrl] = useState<string>('');

  useEffect(() => {
    setIsAutoPlayEnabled(localStorage.getItem('pref_autoplay') === 'true');
  }, []);

  useEffect(() => {
    if (!episodeId) return;
    setLoading(true);
    fetch(`/api/donghua/episode?id=${encodeURIComponent(episodeId)}`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
        
        // Berikan EXP untuk menonton (hanya sekali per episode per sesi)
        if (user && !sessionStorage.getItem(`exp_watch_${episodeId}`)) {
          fetch('/api/add-exp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, action: 'watch', amount: 5 })
          }).then(() => {
            sessionStorage.setItem(`exp_watch_${episodeId}`, 'true');
            // Refresh session secara background agar exp UI update
            import('@/lib/supabase').then(({ supabase }) => {
              supabase.auth.refreshSession();
            });
          }).catch(console.error);
        }

        // Simpan ke riwayat bacaan / nonton
        try {
          const novelUrl = result.animeId;
          if (novelUrl) {
            const titleStr = String(result.title || '');
            const seriesTitle = titleStr.includes(' Episode ') ? titleStr.split(' Episode ')[0] : titleStr;
            const historyItem = {
              novelUrl: novelUrl,
              title: seriesTitle,
              thumbnail: result.poster,
              episodeUrl: episodeId,
              episodeTitle: result.title,
              source: source,
              timestamp: Date.now()
            };
            
            // Local storage fallback for guest
            const historyStr = localStorage.getItem('kaaoffc_history');
            let history = historyStr ? JSON.parse(historyStr) : [];
            history = history.filter((h: any) => h.novelUrl !== novelUrl);
            history.unshift(historyItem);
            if (history.length > 50) history.pop();
            localStorage.setItem('kaaoffc_history', JSON.stringify(history));

            // Supabase Database Sync
            if (user) {
              let categoryName = 'Anime';
              if (source === 'donghua') categoryName = 'Donghua';
              else if (source === 'novel') categoryName = 'Novel';
              else if (source === 'comic' || source === 'komik' || source === 'webtoons') categoryName = 'Komik';
              
              // 1. Simpan ke Riwayat
              supabase.from('user_history').upsert({
                user_id: user.id,
                item_url: novelUrl,
                title: seriesTitle,
                poster: result.poster,
                category: categoryName,
                last_episode: result.title,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,item_url' }).then(res => {
                  if(res.error) console.error("History sync error:", res.error);
              });

              // 2. Simpan ke Aktivitas
              supabase.from('user_activities').insert({
                user_id: user.id,
                activity_type: 'EPISODE DITONTON',
                target_title: result.title,
                target_url: episodeId,
                xp_earned: 5
              }).then();
            }
          }
        } catch (e) {
          console.error("Failed to save history", e);
        }

      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [episodeId, user]);

  if (!episodeId) {
    return <div className="text-center p-8 text-red-500 font-bold">Error: Episode ID tidak ditemukan</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse w-full">
        <div className="w-full aspect-video bg-zinc-800 rounded-xl"></div>
        <div className="h-8 w-2/3 bg-zinc-800 rounded-lg"></div>
        <div className="h-12 bg-zinc-800 rounded-lg"></div>
      </div>
    );
  }

  if (!data || data.error) {
    return <div className="text-center p-8 text-zinc-500">Gagal memuat episode. {data?.error}</div>;
  }

  const currentServerUrl = data.servers?.[activeServer]?.url || data.defaultStreamingUrl;
  const titleStrData = String(data.title || '');
  const seriesTitle = titleStrData.includes(' Episode ') ? titleStrData.split(' Episode ')[0] : titleStrData;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Video Player */}
      <div className="w-full aspect-video bg-black sm:rounded-xl overflow-hidden border-b sm:border border-zinc-800 shadow-2xl relative mb-4">
        {currentServerUrl ? (
          <>
            <iframe
              key={currentServerUrl}
              src={currentServerUrl}
              className="w-full h-full"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            {/* Fallback button in case iframe is blocked by browser/adblocker */}
            <a 
              href={currentServerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-colors text-xs font-semibold flex items-center gap-1.5 opacity-50 hover:opacity-100 z-10"
              title="Buka Video di Tab Baru"
            >
              <Monitor size={14} /> Buka di Tab Baru
            </a>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 flex-col gap-3">
            <Play size={48} className="text-zinc-600" />
            <p className="text-sm">Video tidak tersedia</p>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-0 flex flex-col gap-6">
        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">{data.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {isAutoPlayEnabled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] sm:text-xs font-bold rounded-xl w-fit">
                <Play size={12} className="fill-current" /> Auto-Play
              </span>
            )}
            <button
              onClick={() => {
                if (!user) {
                  alert('Silakan login terlebih dahulu untuk membuat ruang Nobar!');
                  return;
                }
                const roomId = Math.random().toString(36).substring(2, 10);
                window.location.href = `/nobar?room=${roomId}&url=${encodeURIComponent(episodeId || '')}&host=${user.id}`;
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg w-fit transition-colors"
            >
              <Users size={12} className="fill-current" /> Nobar
            </button>
          </div>
        </div>

        {/* Server Selection */}
        {data.servers && data.servers.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-zinc-400" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Server</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.servers.map((server: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveServer(idx)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    idx === activeServer 
                      ? 'bg-rose-300 text-rose-900 dark:bg-rose-400 dark:text-rose-950' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {server.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-row items-center justify-between gap-2 mt-2 w-full">
          {data.prevEpisode ? (
            <Link 
              href={`/watch?url=${data.prevEpisode}&source=donghua`}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] sm:text-xs font-bold transition-colors"
            >
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Prev</span>
            </Link>
          ) : <div className="flex-1" />}

          {data.animeId && (
            <Link 
              href={`/detail?url=${data.animeId}&source=donghua`}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] sm:text-xs font-bold transition-colors"
            >
              <List size={16} /> Semua Episode
            </Link>
          )}

          {data.nextEpisode ? (
            <Link 
              href={`/watch?url=${data.nextEpisode}&source=donghua`}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] sm:text-xs font-bold transition-colors"
            >
              <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
            </Link>
          ) : <div className="flex-1" />}
        </div>

        {/* Series Details Card */}
        <Link href={data.animeId ? `/detail?url=${data.animeId}&source=donghua` : '#'} className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 flex items-center gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group cursor-pointer">
          <div className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700">
            {data.poster ? (
              <img src={`/api/image-proxy?url=${encodeURIComponent(data.poster)}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={seriesTitle} />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Monitor size={24} className="text-zinc-400" /></div>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">{seriesTitle}</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">Donghua</span>
          </div>
        </Link>

        {/* Downloads */}
        {data.downloads && data.downloads.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Download size={18} className="text-rose-400" />
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Download</h2>
            </div>
            <div className="flex flex-col gap-3">
              {data.downloads.map((dl: any, idx: number) => (
                <div key={idx} className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
                  <span className="font-black text-xs text-rose-500 dark:text-rose-400 mb-3">{dl.resolution}</span>
                  <div className="flex flex-wrap gap-2.5">
                    {dl.links.map((link: any, lidx: number) => (
                      <a 
                        key={lidx} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <ExternalLink size={14} /> {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comment Section */}
        <div className="mt-8">
          {episodeId && <CommentSection itemUrl={episodeId} />}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <>
      <div className="flex-1 min-w-0">
        <Suspense fallback={<div className="p-8 text-center text-sm animate-pulse">Memuat video...</div>}>
          <WatchContent />
        </Suspense>
      </div>
      <Sidebar />
    </>
  );
}
