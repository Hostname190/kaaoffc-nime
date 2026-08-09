'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import WidgetTitle from '../components/WidgetTitle';
import AnimeList from '../components/AnimeList';

export default function HomeIdPage() {
  const [donghua, setDonghua] = useState<any>({ recent: [], completed: [] });
  const [webtoons, setWebtoons] = useState<any[]>([]);
  const [localNovels, setLocalNovels] = useState<any[]>([]);
  const [comics, setComics] = useState<any[]>([]);
  const [newComics, setNewComics] = useState<any[]>([]);
  const [colorComics, setColorComics] = useState<any[]>([]);
  const [kaaoffcNovels, setKaaoffcNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastWatched, setLastWatched] = useState<any>(null);

  useEffect(() => {
    // Read Continue Watching
    try {
      const historyStr = localStorage.getItem('kaaoffc_history');
      if (historyStr) {
        const historyData = JSON.parse(historyStr);
        if (historyData.length > 0) {
          setLastWatched(historyData[0]);
        }
      }
    } catch (e) {}

    const fetchData = async () => {
      try {
        const [dhRes, wtRes, novelRes, comicRes, kaaoffcRes, comicNewRes, comicColorRes] = await Promise.all([
          fetch('/api/donghua/home').then(r => r.json()).catch(() => ({ recent: [], completed: [] })),
          fetch('/api/trending?source=webtoons&day=trending').then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/novels').then(r => r.json()).catch(() => []),
          fetch('/api/comic/populer').then(r => r.json()).catch(() => ({comics: []})),
          fetch('/api/novel/sakuranovel/home').then(r => r.json()).catch(() => ({ data: { results: [] } })),
          fetch('/api/comic/terbaru').then(r => r.json()).catch(() => ({comics: []})),
          fetch('/api/comic/berwarna/1').then(r => r.json()).catch(() => ({comics: []}))
        ]);

        if (dhRes && !dhRes.error) {
          setDonghua(dhRes);
        }
        if (wtRes && wtRes.items) {
          setWebtoons(wtRes.items.map((i: any) => ({ ...i, href: `/detail?url=${encodeURIComponent(i.url)}&source=webtoons` })));
        }
        if (Array.isArray(novelRes)) {
          setLocalNovels(novelRes.map((n: any) => ({
            ...n,
            poster: n.thumbnail,
            href: `/novel/${n.id}`,
            episodes: n.chapters ? `${n.chapters.length} Ch` : '0 Ch'
          })));
        }
        if (comicRes && comicRes.comics) {
          const parseSlug = (link: string) => {
            if (!link) return '';
            const match = link.match(/\/manga\/([^/]+)/);
            return match ? match[1] : link.replace(/^\/|\/$/g, '');
          };
          setComics(comicRes.comics.map((c: any) => ({
            ...c,
            poster: c.thumbnail || c.poster || c.image,
            href: `/comic/detail/${parseSlug(c.link || c.url || c.href)}`,
            episodes: c.chapter || 'New'
          })));
        }
        if (comicNewRes && comicNewRes.comics) {
          const parseSlug = (link: string) => link ? (link.match(/\/manga\/([^/]+)/) ? link.match(/\/manga\/([^/]+)/)![1] : link.replace(/^\/|\/$/g, '')) : '';
          setNewComics(comicNewRes.comics.map((c: any) => ({
            ...c,
            poster: c.thumbnail || c.poster || c.image,
            href: `/comic/detail/${parseSlug(c.link || c.url || c.href)}`,
            episodes: c.chapter || 'New'
          })));
        }
        if (comicColorRes && comicColorRes.comics) {
          const parseSlug = (link: string) => link ? (link.match(/\/manga\/([^/]+)/) ? link.match(/\/manga\/([^/]+)/)![1] : link.replace(/^\/|\/$/g, '')) : '';
          setColorComics(comicColorRes.comics.map((c: any) => ({
            ...c,
            poster: c.thumbnail || c.poster || c.image,
            href: `/comic/detail/${parseSlug(c.link || c.url || c.href)}`,
            episodes: c.chapter || 'New'
          })));
        }
        if (kaaoffcRes) {
          const vResults = kaaoffcRes.data?.results || kaaoffcRes.data || kaaoffcRes.result?.items || [];
          setKaaoffcNovels(vResults.map((n: any) => ({
            ...n,
            poster: n.poster || n.thumbnail || n.cover,
            href: `/novel/detail/sakura-${n.slug}`,
            episodes: n.latest_chapter || n.score ? `⭐ ${n.score || 'New'}` : 'New'
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
          <span className="text-amber-500">Global</span> Hub (Home ID)
        </h1>

        {loading ? (
          <div className="flex flex-col gap-8">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* CAROUSEL PLACEHOLDER */}
            {donghua.recent.length > 0 && (
              <div className="w-full h-48 sm:h-64 lg:h-80 relative rounded-2xl overflow-hidden bg-zinc-900 shadow-xl group">
                <img 
                  src={`/api/image-proxy?url=${encodeURIComponent(donghua.recent[0].poster)}`} 
                  alt="Featured" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 lg:p-8">
                  <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded mb-3 inline-block">EPISODE BARU</span>
                  <h2 className="text-2xl lg:text-4xl font-bold text-white mb-2 line-clamp-2">{donghua.recent[0].title}</h2>
                  <a href={donghua.recent[0].href} className="inline-block mt-2 bg-white text-black hover:bg-amber-500 hover:text-white px-6 py-2.5 rounded-lg font-bold transition-colors">
                    Tonton Sekarang
                  </a>
                </div>
              </div>
            )}

            {localNovels.length > 0 && (
              <section>
                <WidgetTitle title="Novel Teks Terbaru" />
                <AnimeList items={localNovels.slice(0, 10)} />
              </section>
            )}

            <section>
              <WidgetTitle title="Episode Terbaru Donghua" href="/donghua" />
              <AnimeList items={donghua.recent.slice(0, 10)} />
            </section>

            <section>
              <WidgetTitle title="Webtoon Populer" href="/search?source=webtoons" />
              <AnimeList items={webtoons.slice(0, 10)} />
            </section>
            
            {comics.length > 0 && (
              <section>
                <WidgetTitle title="Komik Populer" href="/comic" />
                <AnimeList items={comics.slice(0, 10)} />
              </section>
            )}

            {kaaoffcNovels.length > 0 && (
              <section>
                <WidgetTitle title="Kaaoffc Terbaru" href="/novel" />
                <AnimeList items={kaaoffcNovels.slice(0, 10)} />
              </section>
            )}

            {newComics.length > 0 && (
              <section>
                <WidgetTitle title="Komik Terbaru" href="/comic" />
                <AnimeList items={newComics.slice(0, 10)} />
              </section>
            )}

            {colorComics.length > 0 && (
              <section>
                <WidgetTitle title="Komik Berwarna" href="/comic" />
                <AnimeList items={colorComics.slice(0, 10)} />
              </section>
            )}
            
            <section>
              <WidgetTitle title="Donghua Tamat" href="/donghua" />
              <AnimeList items={donghua.completed.slice(0, 10)} />
            </section>
          </div>
        )}
      </div>

      <Sidebar />
    </>
  );
}
