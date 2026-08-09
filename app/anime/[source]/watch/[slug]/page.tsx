// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Download, Search, Settings, ShieldAlert, Monitor, Server, VolumeX, List, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import Link from 'next/link';
import { getAnimeEpisode, getAnimeOngoing } from '@/lib/anime-api';
import CommentSection from '../../../../components/CommentSection';
import { useAuth } from '../../../../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import MissionTracker from '../../../../components/MissionTracker';
import Sidebar from '../../../../components/Sidebar';

export default function AnimeWatchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const source = (params?.source as string) || 'otakudesu';
  const searchParams = useSearchParams();
  const detailSlugParam = searchParams.get('detail_slug');
  const { user } = useAuth();

  const [epData, setEpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rawServerUrl, setRawServerUrl] = useState<string>('');
  const [activeServer, setActiveServer] = useState<string>('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [epsQuery, setEpsQuery] = useState('');
  const [epsPage, setEpsPage] = useState(1);
  const itemsPerPage = 30;
  const [rekomendasi, setRekomendasi] = useState<any[]>([]);
  const [extractedVideoUrl, setExtractedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const res = await getAnimeEpisode(slug, source);
        const data = res?.data || res?.episode_detail || res;
        
        // Pick first server by default so video can play instantly
        let defaultServer = '';
        if (data?.defaultStreamingUrl) defaultServer = data.defaultStreamingUrl;
        else if (data?.stream_servers?.length > 0) defaultServer = data.stream_servers[0].iframe;
        else if (data?.streams?.length > 0) defaultServer = data.streams[0].url;
        else if (data?.streamUrl) defaultServer = data.streamUrl;
        
        setRawServerUrl(defaultServer);
        setEpData(data);
        setLoading(false); // Stop loading immediately so player shows up
        
        // Asynchronously fetch full episodes from Detail API so we don't block the player
        let animeSlug = detailSlugParam || data?.anime_id || data?.anime_slug;
        if (!animeSlug && data?.title) {
           const match = data.title.match(/(.+) Episode/i);
           if (match) {
             animeSlug = match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
           }
        }
        
        if (animeSlug) {
           import('@/lib/anime-api').then(async ({ getAnimeDetail }) => {
             try {
               const detailRes = await getAnimeDetail(animeSlug, source);
               // Handle different API response structures (e.g. animasu wraps in detailRes.detail)
               const detailData = detailRes?.detail || detailRes?.data || detailRes?.anime_detail || detailRes;
               
               // Merge episodes
               const fullEps = detailData?.episodeList || detailData?.episode_list || detailData?.episodes || [];
               const currentEps = data?.info?.episodeList || data?.episodeList || [];
               
               if (fullEps.length > currentEps.length) {
                  setEpData((prev: any) => {
                     const newData = { ...prev };
                     if (newData.info) {
                        newData.info.episodeList = fullEps;
                     } else {
                        newData.episodeList = fullEps;
                     }
                     return newData;
                  });
               }
             } catch(e) {
               console.error("Could not fetch full episodes", e);
             }
           });
        }
      } catch (err: any) {
        console.error("Error:", err);
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

    fetchData();
    fetchRek();
  }, [slug]);
    
  // Auto-save history & EXP
  useEffect(() => {
    if (epData && epData.title) {
      const syncHistory = async () => {
        try {
          const histStr = localStorage.getItem('kaaoffc_anime_history') || '[]';
          let hist = JSON.parse(histStr);
          const parsedAnimeId = epData.anime_id || epData.title.split(' Episode ')[0];
          hist = hist.filter((h: any) => h.animeId !== parsedAnimeId && h.title !== parsedAnimeId);
          
          const epsMatchTitle = epData.title.match(/Episode\s*(\d+)/i);
          const epsMatchSlug = slug.match(/\d+/);
          const epsNum = epsMatchTitle ? epsMatchTitle[1] : (epsMatchSlug ? epsMatchSlug[0] : '1');

          let poster = epData.thumb || epData.poster || epData.image || '';
          
          if (!poster) {
            try {
              const { getAnimeDetail } = await import('@/lib/anime-api');
              const detailRes = await getAnimeDetail(parsedAnimeId, source);
              const detailData = detailRes?.data || detailRes?.anime_detail || detailRes;
              if (detailData?.poster || detailData?.thumb) {
                poster = detailData.poster || detailData.thumb;
              }
            } catch (e) {
              console.error("Failed to fetch poster for history fallback", e);
            }
          }

          hist.unshift({
            title: parsedAnimeId,
            animeId: parsedAnimeId,
            episodeId: slug,
            lastEpisode: epsNum,
            poster: poster,
          });
          localStorage.setItem('kaaoffc_anime_history', JSON.stringify(hist.slice(0, 20)));

          if (user) {
            await supabase.from('user_history').upsert({
              user_id: user.id,
              item_url: parsedAnimeId,
              title: parsedAnimeId,
              category: 'Anime',
              poster: poster,
              last_episode: epsNum,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,item_url' });

            if (!sessionStorage.getItem(`exp_watch_anime_${slug}`)) {
              fetch('/api/add-exp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, action: 'watch', amount: 5 })
              }).then(() => {
                sessionStorage.setItem(`exp_watch_anime_${slug}`, 'true');
                supabase.auth.refreshSession();
              }).catch(console.error);
            }
          }
        } catch (e) {
          console.error("History sync error", e);
        }
      };
      syncHistory();
    }
  }, [slug, epData, user]);

  useEffect(() => {
    if (!rawServerUrl) return;
    
    const resolveAndPlay = async () => {
      try {
        let resolvedUrl = rawServerUrl;

        // If the URL is a relative server path (e.g. /anime/server/...),
        // resolve it through our proxy API first to get the actual iframe URL
        if (rawServerUrl.startsWith('/anime/server/') || rawServerUrl.startsWith('/anime/')) {
          const serverRes = await fetch(`/api/anime${rawServerUrl.startsWith('/anime') ? rawServerUrl.replace('/anime', '') : rawServerUrl}`);
          const serverData = await serverRes.json();
          if (serverData?.data?.url) {
            resolvedUrl = serverData.data.url;
          } else if (serverData?.url) {
            resolvedUrl = serverData.url;
          }
        }

        // If it's still a relative path, prefix the base URL
        if (resolvedUrl.startsWith('/')) {
          resolvedUrl = `https://www.sankavollerei.com${resolvedUrl}`;
        }

        // Try to extract direct video source
        const extractRes = await fetch(`/api/anime/extract?url=${encodeURIComponent(resolvedUrl)}`);
        const extractData = await extractRes.json();
        if (extractData.success && extractData.sources?.length > 0) {
          setExtractedVideoUrl(extractData.sources[0]);
          setActiveServer('');
        } else {
          setExtractedVideoUrl(null);
          // Use the resolved URL directly in an iframe (not through proxy for external embeds)
          if (resolvedUrl.startsWith('http')) {
            setActiveServer(resolvedUrl);
          } else {
            setActiveServer(`/api/anime/iframe-proxy?url=${encodeURIComponent(resolvedUrl)}`);
          }
        }
      } catch {
        setExtractedVideoUrl(null);
        if (rawServerUrl.startsWith('http')) {
          setActiveServer(rawServerUrl);
        } else {
          setActiveServer(`/api/anime/iframe-proxy?url=${encodeURIComponent('https://www.sankavollerei.com' + rawServerUrl)}`);
        }
      }
    };
    resolveAndPlay();
  }, [rawServerUrl]);

  // Auto-navigate pagination to the page containing the active episode
  useEffect(() => {
    if (!epData) return;
    const episodeList = epData?.info?.episodeList || epData.episodeList || epData.all_episodes || [];
    if (episodeList.length > 0 && epsQuery === '') {
      const idx = episodeList.findIndex((ep: any) => (ep.episodeId || ep.slug) === slug);
      if (idx !== -1) {
        const correctPage = Math.floor(idx / itemsPerPage) + 1;
        setEpsPage(prev => prev !== correctPage ? correctPage : prev);
      }
    }
  }, [slug, epData?.episodeList, epData?.info?.episodeList, epData?.all_episodes, epsQuery, itemsPerPage]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="min-h-screen pt-16 text-white p-4 flex flex-col items-center justify-center">
        <p className="text-zinc-500 mb-4">Gagal memuat episode.</p>
        <button onClick={() => router.back()} className="text-[#60a5fa] hover:underline">Kembali</button>
      </div>
    );
  }

  // Parse downloads to fit the "360p", "480p", "720p", "1080p" pill UI
  const downloads = epData?.downloadUrl?.qualities || epData.download_urls || epData.downloads || [];
  
  // Extract episodes for the list
  const episodeList = epData?.info?.episodeList || epData.episodeList || epData.all_episodes || [];
  const filteredEpisodes = episodeList.filter((ep: any) => 
    (ep.title || ep.name || ep.episode || '').toLowerCase().includes(epsQuery.toLowerCase())
  );

  const totalEpsPages = Math.ceil(filteredEpisodes.length / itemsPerPage);
  const paginatedEpisodes = filteredEpisodes.slice((epsPage - 1) * itemsPerPage, epsPage * itemsPerPage);
  const startEps = (epsPage - 1) * itemsPerPage + 1;
  const endEps = Math.min(epsPage * itemsPerPage, filteredEpisodes.length);

  const streamServers = epData.server?.qualities?.flatMap((q: any) => 
    q.serverList.map((s: any) => ({ server: `${q.title} - ${s.title}`, iframe: s.href }))
  ) || epData.stream_servers || (epData.streams ? epData.streams.map((s: any) => ({ server: s.name, iframe: s.url })) : []);

  let prevUrl = '#';
  let nextUrl = '#';
  const currentEpIndex = episodeList.findIndex((ep: any) => (ep.episodeId || ep.slug) === slug);
  if (currentEpIndex !== -1) {
    // Usually episode lists are sorted latest first (index 0 = newest)
    if (currentEpIndex > 0) {
      const nextEp = episodeList[currentEpIndex - 1];
      nextUrl = `/anime/${source}/watch/${nextEp.episodeId || nextEp.slug}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}`;
    }
    if (currentEpIndex < episodeList.length - 1) {
      const prevEp = episodeList[currentEpIndex + 1];
      prevUrl = `/anime/${source}/watch/${prevEp.episodeId || prevEp.slug}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}`;
    }
  } else {
    // Fallback to API provided links
    const getSafeUrl = (url: string) => {
       if (!url) return '#';
       if (url.startsWith('http')) {
          const m = url.match(/([^\/]+)\/?$/);
          return m ? `/anime/${source}/watch/${m[1]}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}` : '#';
       }
       return `/anime/${source}/watch/${url.replace(/^\//, '')}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}`;
    };
    prevUrl = epData.prevEpisode?.episodeId ? `/anime/${source}/watch/${epData.prevEpisode.episodeId}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}` : getSafeUrl(epData.prev_episode_url);
    nextUrl = epData.nextEpisode?.episodeId ? `/anime/${source}/watch/${epData.nextEpisode.episodeId}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}` : getSafeUrl(epData.next_episode_url);
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#09090b] font-sans text-white">
      <div className="flex-1 w-full lg:w-[calc(100%-320px)] xl:w-[calc(100%-360px)] min-h-screen pb-24 relative">
        <MissionTracker actionType="watch_episode" />
        {/* VIDEO PLAYER */}
        <div className="w-full aspect-video bg-black sticky sm:relative top-[53px] sm:top-0 z-40">
        {extractedVideoUrl ? (
          <video 
            src={extractedVideoUrl} 
            controls 
            autoPlay 
            className="w-full h-full"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        ) : activeServer ? (
          <iframe 
            src={activeServer} 
            className="w-full h-full border-none" 
            allowFullScreen 
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            Video tidak tersedia.
          </div>
        )}
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-4xl mx-auto">
        {/* TITLE & EPS */}
        <div className="text-center py-4 px-4">
          <h1 className="text-[15px] sm:text-lg font-bold text-white leading-tight">
            {epData.title ? epData.title.split(' Episode ')[0] : 'Anime Title'}
          </h1>
          <h2 className="text-[#60a5fa] font-bold text-[13px] mt-0.5">
            Episode {slug.match(/\d+/)?.[0] || '1'}
          </h2>
        </div>

        {/* TOGGLES ROW */}
        <div className="flex items-center justify-center gap-3 mb-6 px-4">
          <label className="flex items-center gap-2 bg-[#2A2B3D] px-4 py-1.5 rounded-full cursor-pointer hover:bg-[#3b3c54] transition-colors">
            <span className="text-[11px] font-medium text-zinc-300">Auto Play</span>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${autoPlay ? 'bg-[#60a5fa]' : 'bg-zinc-600'}`}>
              <div className={`absolute top-[2px] bottom-[2px] w-[10px] h-[10px] bg-[#1c1c24] rounded-full transition-all ${autoPlay ? 'right-[2px]' : 'left-[2px]'}`}></div>
            </div>
            <input type="checkbox" className="hidden" checked={autoPlay} onChange={() => setAutoPlay(!autoPlay)} />
          </label>
          
          <label className="flex items-center gap-2 bg-[#2A2B3D] px-4 py-1.5 rounded-full cursor-pointer hover:bg-[#3b3c54] transition-colors">
            <span className="text-[11px] font-medium text-zinc-300">Auto Next</span>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${autoNext ? 'bg-[#60a5fa]' : 'bg-zinc-600'}`}>
              <div className={`absolute top-[2px] bottom-[2px] w-[10px] h-[10px] bg-[#1c1c24] rounded-full transition-all ${autoNext ? 'right-[2px]' : 'left-[2px]'}`}></div>
            </div>
            <input type="checkbox" className="hidden" checked={autoNext} onChange={() => setAutoNext(!autoNext)} />
          </label>

          <button className="flex items-center gap-1.5 bg-[#2A2B3D] px-4 py-1.5 rounded-full hover:bg-[#3b3c54] transition-colors text-[11px] font-medium text-zinc-300">
            Skip OP <ChevronRight size={12} className="text-zinc-500" />
          </button>
        </div>

        {/* SERVER SELECTION */}
        {streamServers && streamServers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 px-4">
            {streamServers.map((s: any, i: number) => (
              <button 
                key={i} 
                onClick={() => setRawServerUrl(s.iframe)}
                className={`px-3 py-1 text-[11px] font-medium rounded-[6px] transition-colors ${rawServerUrl === s.iframe ? 'bg-[#60a5fa] text-blue-950' : 'bg-[#2A2B3D] text-zinc-400 hover:text-white'}`}
              >
                {s.server}
              </button>
            ))}
          </div>
        )}

        {/* DOWNLOAD ROW */}
        <div className="border-t border-b border-zinc-800/60 py-3 mb-6">
          <div className="flex items-center w-full px-4 gap-3 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-medium shrink-0">
              <Download size={14} /> Download:
            </div>
            {downloads.length > 0 ? (
              downloads.map((q: any, i: number) => (
                <div key={i} className="flex flex-col gap-1 shrink-0 bg-[#16161d] p-1.5 rounded-[6px] border border-zinc-800">
                  <div className="text-[#5eead4] px-2 py-0.5 text-[11px] font-bold text-center border-b border-zinc-800/60 pb-1 mb-0.5">
                    {q.title || q.resolution || 'Download'} {q.size ? `(${q.size})` : ''}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {(q.serverList || q.urls || []).length > 0 ? (
                      (q.serverList || q.urls).map((s: any, j: number) => (
                        <a key={j} href={s.href || s.url || '#'} target="_blank" rel="noopener noreferrer" className="bg-[#2A2B3D] hover:bg-[#3b3c54] text-zinc-300 px-2 py-0.5 rounded-[4px] text-[10px] transition-colors whitespace-nowrap">
                          {s.server || s.title || 'Link'}
                        </a>
                      ))
                    ) : (
                      <a href={q.url || q.link || '#'} target="_blank" rel="noopener noreferrer" className="bg-[#1b3d2b] hover:bg-[#224c36] text-[#5eead4] px-2 py-0.5 rounded-[4px] text-[10px] transition-colors">
                        Link Download
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              ['360p', '480p', '720p', '1080p'].map((res) => (
                <button key={res} className="bg-[#1b3d2b] hover:bg-[#224c36] text-[#5eead4] px-3 py-1 rounded-[4px] text-[11px] font-medium transition-colors shrink-0">
                  {res}
                </button>
              ))
            )}
          </div>
        </div>

        {/* NAVIGATION ROW */}
        <div className="flex items-center justify-between mb-8 px-4 w-full">
          <Link 
            href={prevUrl} 
            className={`flex items-center gap-1.5 px-5 py-2 rounded-[8px] text-[11px] font-medium transition-colors ${prevUrl !== '#' ? 'bg-[#2A2B3D] hover:bg-[#3b3c54] text-zinc-300' : 'bg-[#2A2B3D] text-zinc-600 cursor-not-allowed pointer-events-none'}`}
          >
            <ChevronLeft size={14} /> Prev
          </Link>
          <button className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-[11px] font-medium">
            <List size={14} /> List
          </button>
          <Link 
            href={nextUrl} 
            className={`flex items-center gap-1.5 px-5 py-2 rounded-[8px] text-[11px] font-medium transition-colors ${nextUrl !== '#' ? 'bg-[#2A2B3D] hover:bg-[#3b3c54] text-zinc-300' : 'bg-[#2A2B3D] text-zinc-600 cursor-not-allowed pointer-events-none'}`}
          >
            Next <ChevronRight size={14} />
          </Link>
        </div>

        {/* DAFTAR EPISODE */}
        <div className="mb-8 px-4 w-full">
          <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2">
            <List size={16} className="text-[#f40f25]" /> Daftar Episode
          </h3>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder={`Cari (1-${episodeList.length || 12})`}
                value={epsQuery}
                onChange={(e) => { setEpsQuery(e.target.value); setEpsPage(1); }}
                className="w-full bg-[#1C1D2A] border border-zinc-800 text-zinc-300 text-[11px] rounded-[8px] pl-9 pr-4 py-2 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
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
            {episodeList.length > 0 ? (
              paginatedEpisodes.map((ep: any, i: number) => {
                const titleStr = String(ep.title || ep.name || ep.episode || '');
                let epNum;
                const epMatch = titleStr.match(/(?:episode|eps|ep)\s*-?\s*(\d+)/i);
                if (epMatch) {
                  epNum = epMatch[1];
                } else {
                  const allNumbers = titleStr.match(/\d+/g);
                  epNum = allNumbers ? allNumbers[allNumbers.length - 1] : episodeList.length - ((epsPage - 1) * itemsPerPage + i);
                }
                const isActive = slug === (ep.episodeId || ep.slug);
                return (
                  <Link 
                    key={i} 
                    href={`/anime/${source}/watch/${ep.episodeId || ep.slug}${detailSlugParam ? `?detail_slug=${detailSlugParam}` : ''}`} 
                    className={`${isActive ? 'bg-[#ffb6c1] text-[#2c131b]' : 'bg-[#2A2B3D] border-zinc-800/50 hover:bg-[#3b3c54] text-zinc-300'} font-bold text-[11px] sm:text-xs py-2.5 rounded-[8px] transition-all flex items-center justify-center`}
                  >
                    {epNum}
                  </Link>
                );
              })
            ) : (
              Array.from({length: 12}).map((_, i) => (
                <div key={i} className="bg-[#2A2B3D] border border-zinc-800/50 rounded-[8px] text-zinc-300 font-bold text-[11px] sm:text-xs flex items-center justify-center py-2.5">
                  {12 - i}
                </div>
              ))
            )}
          </div>
        </div>

        {/* COMMENTS SECTION */}
        <div className="px-4 w-full mb-10">
          <CommentSection itemUrl={`/anime/${source}/watch/${slug}`} />
        </div>

        {/* REKOMENDASI */}
        {rekomendasi.length > 0 && (
          <div className="px-4 w-full mb-10">
            <h3 className="text-[15px] font-bold text-white mb-4 flex items-center gap-2">
              <Film size={18} className="text-[#60a5fa]" /> Rekomendasi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {rekomendasi.map((item, i) => (
                <Link key={i} href={`/anime/${source}/detail/${item.animeId || item.id || item.slug || item.endpoint}`} className="group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#2A2B3D] mb-2 relative">
                    <img src={`/api/image-proxy?url=${encodeURIComponent(item.poster || item.thumb)}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-[#60a5fa] text-blue-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm shadow-sm uppercase">SERIES</div>
                  </div>
                  <h4 className="font-bold text-[11px] sm:text-xs text-white line-clamp-2">{item.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
    <Sidebar />
    </>
  );
}
