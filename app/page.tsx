'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Flame, Clock, Compass, BookOpen, Tv, ArrowRight, ChevronRight, History, Heart, Zap, Trophy, Users, Star, Gift, Coffee, Sparkles, TrendingUp, Crown } from 'lucide-react';
import AnimeList from './components/AnimeList';
import { getAnimeOngoing } from '@/lib/anime-api';

export default function HomePage() {
  const [heroItems, setHeroItems] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [histories, setHistories] = useState<any[]>([]);
  
  const [donghua, setDonghua] = useState<any>({ recent: [], completed: [] });
  const [anime, setAnime] = useState<any[]>([]);
  const [webtoons, setWebtoons] = useState<any[]>([]);
  const [comics, setComics] = useState<any[]>([]);
  const [novels, setNovels] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ anime: 0, donghua: 0, comic: 0, novel: 0 });
  const [supportUrl, setSupportUrl] = useState('https://saweria.co/kaaoffc');

  useEffect(() => {
    // 1. Fetch Histories from local storage for "Lanjutkan Menonton / Membaca"
    const loadedHistories = [];
    try {
      // Donghua history
      const hDonghua = JSON.parse(localStorage.getItem('kaaoffc_history') || '[]');
      if (hDonghua[0] && (hDonghua[0].episodeUrl || hDonghua[0].episodeId || hDonghua[0].url)) {
        const dUrl = hDonghua[0].url || (hDonghua[0].episodeUrl ? `/watch?url=${hDonghua[0].episodeUrl}&source=donghua` : null);
        if (dUrl) loadedHistories.push({...hDonghua[0], type: 'Donghua', url: dUrl});
      }
      
      // Anime history
      const hAnime = JSON.parse(localStorage.getItem('kaaoffc_anime_history') || '[]');
      if (hAnime[0] && hAnime[0].episodeId) {
        loadedHistories.push({...hAnime[0], type: 'Anime', url: `/anime/watch/${hAnime[0].episodeId}`});
      }
      
      // Comic history
      const hComic = JSON.parse(localStorage.getItem('kaaoffc_comic_history') || '[]');
      if (hComic[0] && hComic[0].chapterId) {
        loadedHistories.push({...hComic[0], type: 'Komik', url: `/comic/read/${hComic[0].chapterId}`});
      }
      
      // Novel history
      const hNovel = JSON.parse(localStorage.getItem('novel_history') || '[]');
      if (hNovel[0] && hNovel[0].chapterId) {
        loadedHistories.push({...hNovel[0], type: 'Novel', url: `/novel/read/${hNovel[0].chapterId}`});
      }
      
      setHistories(loadedHistories);
    } catch (e) {}

    // 2. Fetch Data from all APIs
    const fetchData = async () => {
      try {
        const [dhRes, anRes, wtRes, comicRes, novelRes, settingsRes] = await Promise.all([
          fetch('/api/donghua/home').then(r => r.json()).catch(() => ({ recent: [], completed: [] })),
          getAnimeOngoing(1).catch(() => ({ animeList: [] })),
          fetch('/api/trending?source=webtoons&day=trending').then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/comic/populer').then(r => r.json()).catch(() => ({comics: []})),
          fetch('/api/novels').then(r => r.json()).catch(() => []),
          fetch('/api/admin/settings').then(r => r.json()).catch(() => ({}))
        ]);

        if (settingsRes && settingsRes.support_url) {
          setSupportUrl(settingsRes.support_url);
        }

        let combinedHero = [];

        // Parse Donghua
        if (dhRes && !dhRes.error) {
          setDonghua(dhRes);
          if (dhRes.recent[0]) combinedHero.push({
            ...dhRes.recent[0], 
            tag: 'Donghua', 
            desc: 'Episode terbaru donghua sedang tayang!'
          });
        }
        
        // Parse Anime
        const animeItems = anRes?.animeList || anRes?.data || [];
        if (animeItems.length > 0) {
          const formattedAnime = animeItems.map((a: any) => ({
            title: a.title,
            poster: a.poster || a.thumb,
            href: `/anime/detail/${a.animeId || a.id || a.slug}`,
            episodes: a.episode || a.status || 'New'
          }));
          setAnime(formattedAnime);
          if (formattedAnime[0]) combinedHero.push({
            ...formattedAnime[0], 
            tag: 'Anime',
            desc: 'Saksikan kelanjutan seri anime terbaik minggu ini.'
          });
        }

        // Parse Webtoons
        if (wtRes && wtRes.items) {
          const formattedWt = wtRes.items.map((i: any) => ({ 
            ...i, 
            href: `/detail?url=${encodeURIComponent(i.url)}&source=webtoons` 
          }));
          setWebtoons(formattedWt);
        }

        // Parse Comics
        if (comicRes && comicRes.comics) {
          const parseSlug = (link: string) => {
            if (!link) return '';
            const match = link.match(/\/manga\/([^/]+)/);
            return match ? match[1] : link.replace(/^\/|\/$/g, '');
          };
          const formattedComics = comicRes.comics.map((c: any) => ({
            ...c,
            poster: c.thumbnail || c.poster || c.image,
            href: `/comic/detail/${parseSlug(c.link || c.url || c.href)}`,
            episodes: c.chapter || 'New'
          }));
          setComics(formattedComics);
          if (formattedComics[0]) combinedHero.push({
            ...formattedComics[0], 
            tag: 'Komik',
            desc: 'Komik paling populer yang banyak dibaca minggu ini.'
          });
        }

        // Parse Novels — FIX: link ke /novel/detail/{id} bukan /novel/{id}
        if (Array.isArray(novelRes)) {
          const formattedNovels = novelRes.map((n: any) => ({
            ...n,
            poster: n.thumbnail,
            href: `/novel/detail/${n.id}`,
            episodes: n.chapters ? `${n.chapters.length} Bab` : '0 Bab'
          }));
          setNovels(formattedNovels);
          if (formattedNovels[0]) combinedHero.push({
            ...formattedNovels[0], 
            tag: 'Novel',
            desc: 'Novel ringan terbaru dengan cerita yang epik.'
          });
        }

        setHeroItems(combinedHero);

        // Set stats
        setStats({
          anime: animeItems.length || 0,
          donghua: (dhRes?.recent?.length || 0) + (dhRes?.completed?.length || 0),
          comic: comicRes?.comics?.length || 0,
          novel: Array.isArray(novelRes) ? novelRes.length : 0,
        });

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto Hero Slider
  useEffect(() => {
    if (heroItems.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroItems]);

  const activeHero = heroItems[heroIndex];

  return (
    <div className="w-full bg-[#09090b] min-h-screen pb-20 overflow-x-hidden font-sans">
      
      {/* ═══════════════════════════════════════════════════
          1. HERO CAROUSEL — Sinematik dengan rounded edges
         ═══════════════════════════════════════════════════ */}
      {loading ? (
        <div className="w-full px-0 lg:px-6 pt-0 lg:pt-4">
          <div className="w-full h-[45vh] sm:h-[50vh] lg:h-[500px] bg-zinc-900 animate-pulse lg:rounded-3xl"></div>
        </div>
      ) : activeHero ? (
        <div className="w-full px-0 lg:px-6 pt-0 lg:pt-4">
          <div className="relative w-full h-[45vh] sm:h-[50vh] lg:h-[500px] overflow-hidden lg:rounded-3xl lg:shadow-2xl lg:shadow-black/40 group">
            <div className="absolute inset-0 transition-opacity duration-1000">
              <img 
                src={`/api/image-proxy?url=${encodeURIComponent(activeHero.poster || activeHero.thumbnail || activeHero.image)}`} 
                alt={activeHero.title} 
                className="w-full h-full object-cover opacity-50 scale-105 group-hover:scale-100 transition-transform duration-[10000ms]"
              />
              {/* Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/30 to-transparent"></div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 lg:p-14 lg:w-3/5 z-10 flex flex-col justify-end h-full">
              <span className="w-max px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[#60a5fa] text-[10px] sm:text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                {activeHero.tag} HIGHLIGHT
              </span>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight line-clamp-2 drop-shadow-2xl">
                {activeHero.title}
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm lg:text-base mb-6 line-clamp-2 max-w-lg">
                {activeHero.desc}
              </p>
              
              <div className="flex items-center gap-3">
                <Link href={activeHero.href} className="flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-blue-950 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
                  <Play size={16} className="fill-current" />
                  <span>Lihat Detail</span>
                </Link>
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-6 right-6 flex gap-2 z-10">
              {heroItems.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setHeroIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === heroIndex ? 'w-8 bg-[#60a5fa]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════
          2. QUICK HUB NAVIGATION — Tetap di atas
         ═══════════════════════════════════════════════════ */}
      {!loading && (
        <div className="px-4 sm:px-6 lg:px-8 mt-6 lg:mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:gap-4">
            <Link href="/anime" className="relative overflow-hidden group bg-gradient-to-br from-indigo-900/30 to-indigo-950/20 border border-indigo-500/15 p-3 lg:p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500/40 hover:bg-indigo-900/40 transition-all duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform"><Tv size={20} /></div>
              <div>
                <h3 className="text-white font-bold text-xs sm:text-sm">Anime Hub</h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Sub Indo</p>
              </div>
            </Link>
            <Link href="/donghua" className="relative overflow-hidden group bg-gradient-to-br from-amber-900/30 to-amber-950/20 border border-amber-500/15 p-3 lg:p-4 rounded-2xl flex items-center gap-3 hover:border-amber-500/40 hover:bg-amber-900/40 transition-all duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform"><Flame size={20} /></div>
              <div>
                <h3 className="text-white font-bold text-xs sm:text-sm">Donghua Hub</h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Animasi China</p>
              </div>
            </Link>
            <Link href="/comic" className="relative overflow-hidden group bg-gradient-to-br from-emerald-900/30 to-emerald-950/20 border border-emerald-500/15 p-3 lg:p-4 rounded-2xl flex items-center gap-3 hover:border-emerald-500/40 hover:bg-emerald-900/40 transition-all duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Compass size={20} /></div>
              <div>
                <h3 className="text-white font-bold text-xs sm:text-sm">Komik Hub</h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Manga & Manhwa</p>
              </div>
            </Link>
            <Link href="/novel" className="relative overflow-hidden group bg-gradient-to-br from-pink-900/30 to-pink-950/20 border border-pink-500/15 p-3 lg:p-4 rounded-2xl flex items-center gap-3 hover:border-pink-500/40 hover:bg-pink-900/40 transition-all duration-300">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform"><BookOpen size={20} /></div>
              <div>
                <h3 className="text-white font-bold text-xs sm:text-sm">Novel Hub</h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs mt-0.5">Light Novel</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          3. MAIN LAYOUT — 2 Kolom di Desktop
         ═══════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8 lg:mt-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* ─── KOLOM KIRI: KONTEN UTAMA (75%) ─── */}
          <div className="flex-1 min-w-0 flex flex-col gap-10 lg:gap-12">

            {/* ANIME */}
            {!loading && anime.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-[#60a5fa] pl-3">Anime Populer</h2>
                  <Link href="/anime" className="text-xs sm:text-sm font-bold text-[#60a5fa] hover:text-[#3b82f6] flex items-center gap-1 transition-colors">Lihat Semua <ChevronRight size={14} /></Link>
                </div>
                <AnimeList items={anime.slice(0, 14)} />
              </section>
            )}

            {/* DONGHUA */}
            {!loading && donghua.recent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-amber-500 pl-3">Donghua Terbaru</h2>
                  <Link href="/donghua" className="text-xs sm:text-sm font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors">Lihat Semua <ChevronRight size={14} /></Link>
                </div>
                <AnimeList items={donghua.recent.slice(0, 14)} />
              </section>
            )}

            {/* COMIC */}
            {!loading && comics.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-emerald-500 pl-3">Komik & Manga Hits</h2>
                  <Link href="/comic" className="text-xs sm:text-sm font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors">Lihat Semua <ChevronRight size={14} /></Link>
                </div>
                <AnimeList items={comics.slice(0, 14)} />
              </section>
            )}

            {/* WEBTOONS */}
            {!loading && webtoons.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-purple-500 pl-3">Trending Webtoons</h2>
                </div>
                <AnimeList items={webtoons.slice(0, 14)} />
              </section>
            )}

            {/* NOVEL */}
            {!loading && novels.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 border-l-4 border-pink-500 pl-3">Light Novel Rekomendasi</h2>
                  <Link href="/novel" className="text-xs sm:text-sm font-bold text-pink-500 hover:text-pink-400 flex items-center gap-1 transition-colors">Lihat Semua <ChevronRight size={14} /></Link>
                </div>
                <AnimeList items={novels.slice(0, 14)} />
              </section>
            )}
          </div>

          {/* ─── KOLOM KANAN: SIDEBAR (Desktop Only, sticky) ─── */}
          <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-6">
            
            {/* Sidebar Wrapper — sticky on desktop */}
            <div className="lg:sticky lg:top-24 flex flex-col gap-6">

              {/* LANJUTKAN MENONTON / MEMBACA */}
              {!loading && histories.length > 0 && (
                <div className="bg-[#111113] border border-zinc-800/60 rounded-2xl p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-[#60a5fa]"><History size={14} /></div>
                    <h3 className="text-sm font-bold text-white">Lanjutkan</h3>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {histories.map((h, i) => (
                      <Link key={i} href={h.url} className="group flex items-center gap-3 bg-[#18181b] rounded-xl p-3 border border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all duration-200">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          {h.type === 'Donghua' || h.type === 'Anime' ? <Play size={14} className="text-blue-400" /> : <BookOpen size={14} className="text-pink-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{h.type}</div>
                          <h4 className="text-white font-bold text-xs line-clamp-1 group-hover:text-[#60a5fa] transition-colors">{h.title}</h4>
                        </div>
                        <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* DONASI BANNER */}
              {!loading && (
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-[#111113] to-orange-950/30 border border-amber-500/15 rounded-2xl p-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-amber-400" />
                      <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">Dukung Kami</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mb-2">Bantu Kaaoffc Tetap Online! ☕</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                      Server & domain butuh biaya. Donasi kamu sangat berarti untuk menjaga Kaaoffc tetap gratis dan bebas iklan. 🫡
                    </p>
                    <div className="flex justify-center mt-2">
                      <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/15">
                        <Coffee size={16} className="animate-pulse" />
                        <span>Donasi via Saweria</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* KAAOFFC PREMIUM TEASER */}
              {!loading && (
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-950/30 via-[#111113] to-indigo-950/30 border border-purple-500/15 rounded-2xl p-5">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={14} className="text-purple-400" />
                      <span className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">Coming Soon</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mb-2">Kaaoffc Premium ⚡</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                      Akses lebih awal ke konten baru, badge eksklusif, dan fitur premium lainnya. Stay tuned!
                    </p>
                    <div className="flex items-center justify-center gap-2 w-full bg-purple-500/15 border border-purple-500/20 text-purple-300 px-4 py-2.5 rounded-xl font-bold text-xs cursor-default">
                      <Star size={14} className="fill-current text-purple-400" />
                      <span>Segera Hadir</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATISTIK */}
              {!loading && (
                <div className="bg-[#111113] border border-zinc-800/60 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-[#60a5fa]"><TrendingUp size={14} /></div>
                    <h3 className="text-sm font-bold text-white">Statistik Kaaoffc</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-950/10 border border-indigo-500/10 rounded-xl p-3 text-center">
                      <Tv size={18} className="text-indigo-400 mx-auto mb-1.5" />
                      <div className="text-xl font-extrabold text-white">{stats.anime}+</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">Anime</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-900/20 to-amber-950/10 border border-amber-500/10 rounded-xl p-3 text-center">
                      <Flame size={18} className="text-amber-400 mx-auto mb-1.5" />
                      <div className="text-xl font-extrabold text-white">{stats.donghua}+</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">Donghua</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border border-emerald-500/10 rounded-xl p-3 text-center">
                      <Compass size={18} className="text-emerald-400 mx-auto mb-1.5" />
                      <div className="text-xl font-extrabold text-white">{stats.comic}+</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">Komik</div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-900/20 to-pink-950/10 border border-pink-500/10 rounded-xl p-3 text-center">
                      <BookOpen size={18} className="text-pink-400 mx-auto mb-1.5" />
                      <div className="text-xl font-extrabold text-white">{stats.novel}+</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">Novel</div>
                    </div>
                  </div>
                </div>
              )}



            </div>
          </aside>

        </div>
      </div>


    </div>
  );
}
