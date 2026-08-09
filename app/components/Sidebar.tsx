'use client';

import Link from 'next/link';
import WidgetTitle from './WidgetTitle';
import { useSearchParams, usePathname } from 'next/navigation';
import { Suspense } from 'react';

function SidebarContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const source = searchParams?.get('source');

  // Jika di halaman pencarian, tentukan konteks dari source
  const isSearchPage = pathname?.startsWith('/search');
  const isAnime = pathname?.startsWith('/anime') || (isSearchPage && source === 'anime');
  const isComic = pathname?.startsWith('/comic') || (isSearchPage && source === 'webtoons');
  const isNovel = pathname?.startsWith('/novel') || (isSearchPage && source === 'novels');
  
  let animeSource = 'animasu';
  if (pathname?.includes('/otakudesu')) {
    animeSource = 'otakudesu';
  } else if (pathname?.includes('/animasu')) {
    animeSource = 'animasu';
  }

  let searchPrefix = '/search?q=';
  let menuTitle = "Menu Donghua";
  let menuLinks = [
    { label: "Sedang Berjalan (Ongoing)", href: "/ongoing" },
    { label: "Sudah Tamat (Completed)", href: "/completed" },
    { label: "Jadwal Rilis", href: "/donghua/jadwal" },
    { label: "Daftar Semua Genre", href: "/genres" }
  ];

  if (isAnime) {
    searchPrefix = `/anime/${animeSource}/search?q=`;
    menuTitle = `Menu Anime`;
    
    menuLinks = [
      { label: "Beranda", href: `/anime/${animeSource}` },
      { label: "Sedang Berjalan (Ongoing)", href: `/anime/${animeSource}/ongoing` },
      { label: "Sudah Tamat (Completed)", href: `/anime/${animeSource}/completed` },
      { label: "Jadwal Rilis", href: `/anime/${animeSource}/schedule` },
      { label: "Daftar Semua Genre", href: `/anime/${animeSource}/genres` }
    ];
  } else if (isComic) {
    searchPrefix = '/comic/search?q=';
    menuTitle = "Menu Komik";
    menuLinks = [
      { label: "Sedang Berjalan (Ongoing)", href: "/comic/list?status=ongoing" },
      { label: "Sudah Tamat (Completed)", href: "/comic/list?status=completed" },
      { label: "Daftar Semua Genre", href: "/comic/advanced-search" }
    ];
  } else if (isNovel) {
    searchPrefix = '/novel/search?q=';
    menuTitle = "Menu Novel";
    menuLinks = [
      { label: "Semua Genre", href: "/novel/genres" },
      { label: "Daftar A-Z", href: "/novel/daftar-novel" }
    ];
  }

  const seasonList = ["Winter 2024", "Fall 2023", "Summer 2023", "Spring 2023"];
  const azList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

  return (
    <aside className="hidden lg:flex w-[320px] flex-col gap-6 shrink-0 pl-6 border-l border-zinc-800/50">
      <div>
        <WidgetTitle title={menuTitle} />
        <div className="flex flex-col gap-2 mt-4 mb-2">
          {menuLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="flex items-center px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-amber-100 text-zinc-700 hover:text-amber-700 dark:bg-zinc-900/50 dark:hover:bg-amber-900/30 dark:text-zinc-300 dark:hover:text-amber-500 border border-transparent dark:hover:border-amber-500/30 transition-colors font-medium text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>



      <div>
        <WidgetTitle title="A-Z List" />
        <div className="flex flex-wrap gap-2 mt-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {azList.map((letter) => (
            <Link key={letter} href={`${searchPrefix}${letter}`} className="w-8 h-8 flex items-center justify-center text-sm font-bold rounded bg-zinc-200 text-zinc-800 hover:bg-sky-600 hover:text-white dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-sky-600 dark:hover:text-white transition-colors border border-transparent dark:border-zinc-800 dark:hover:border-sky-500">
              {letter}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-full lg:w-80 shrink-0"></aside>}>
      <SidebarContent />
    </Suspense>
  );
}
