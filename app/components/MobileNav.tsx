'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, User, PlayCircle, Film, BookOpen, BookText, Calendar, LayoutGrid, Globe } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const avatarUrl = user?.user_metadata?.avatar_url || '/avatar.jpeg';

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/chat')) {
    return null;
  }

  let mode = 'main';
  if (pathname === '/donghua' || pathname?.startsWith('/donghua/')) {
    mode = 'donghua';
  } else if (pathname === '/anime' || pathname?.startsWith('/anime/')) {
    mode = 'home-id';
  }

  let links: any[] = [];

  let animeSource = 'animasu';
  if (pathname?.includes('/otakudesu')) {
    animeSource = 'otakudesu';
  }

  if (mode === 'donghua') {
    links = [
      { href: '/donghua', icon: Home, label: 'Home' },
      { href: '/donghua/jadwal', icon: Calendar, label: 'Jadwal' },
      { href: '/donghua/ongoing', icon: PlayCircle, label: 'Ongoing' },
      { href: '/donghua/genre', icon: LayoutGrid, label: 'Genre' },
      { href: '/donghua/explore', icon: Compass, label: 'Explore' },
      { href: '/', icon: Globe, label: 'Main Site' },
    ];
  } else if (mode === 'home-id') {
    links = [
      { href: `/anime/${animeSource}`, icon: Home, label: 'Home' },
      { href: `/anime/${animeSource}/schedule`, icon: Calendar, label: 'Jadwal' },
      { href: `/anime/${animeSource}/genre/movie`, icon: Film, label: 'Movie' },
      { href: `/anime/${animeSource}/genres`, icon: LayoutGrid, label: 'Genre' },
      { href: `/anime/${animeSource}/search`, icon: Compass, label: 'Explore' },
      { href: '/', icon: Globe, label: 'Main Site' },
    ];
  } else {
    // Main Site
    links = [
      { href: '/', icon: Home, label: 'Home' },
      { href: '/anime', icon: LayoutGrid, label: 'Anime' },
      { href: '/donghua', icon: PlayCircle, label: 'Donghua' },
      { href: '/comic', icon: BookOpen, label: 'Comic' },
      { href: '/novel', icon: BookText, label: 'Novel' },
      { href: '/profile', icon: User, label: 'Profil', isProfile: true },
    ];
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-[60] pb-safe">
      <div className="flex items-center justify-between w-full h-16 px-2">
        {links.map(({ href, icon: Icon, label, isProfile }) => {
          const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href) && href !== '/');
          
          return (
            <Link 
              key={label}
              href={href} 
              className={`flex flex-col items-center gap-1 flex-1 ${
                isActive 
                  ? 'text-amber-600 dark:text-amber-500' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors'
              }`}
            >
              {isProfile && user ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden border-2 ${isActive ? 'border-amber-500' : 'border-transparent'}`}>
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.onerror = null; e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-amber-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>'; }} />
                </div>
              ) : (
                <Icon size={20} className={isActive ? 'fill-amber-100 dark:fill-amber-900/30' : ''} />
              )}
              <span className={`text-[9px] sm:text-[10px] whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* CSS to hide scrollbar but allow scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </nav>
  );
}
