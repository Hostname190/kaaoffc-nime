'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileMenuChips() {
  const pathname = usePathname();

  const menuLinks = [
    { label: "Ongoing", href: "/ongoing" },
    { label: "Completed", href: "/completed" },
    { label: "Jadwal Rilis", href: "/donghua/jadwal" },
    { label: "Daftar Genre", href: "/genres" }
  ];

  const allowedPaths = ['/', '/search', '/ongoing', '/completed', '/donghua/jadwal', '/genres'];
  
  // Jika path saat ini BUKAN salah satu dari allowedPaths, sembunyikan chips ini
  const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(p + '?'));
  if (!isAllowed) {
    return null;
  }

  return (
    <div className="lg:hidden w-full mb-4 overflow-x-auto custom-scrollbar pb-2">
      <div className="flex gap-2">
        {menuLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link 
 key={link.href} 
 href={link.href}
 className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
 isActive 
 ? 'bg-amber-600 text-white border-amber-600 -600/20' 
 : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-700'
 }`}
 >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
