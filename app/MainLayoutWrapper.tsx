'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import MobileMenuChips from './components/MobileMenuChips';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Link from 'next/link';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<any>({});
  
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);
  const isAdmin = pathname?.startsWith('/admin');
  const isComicRead = pathname?.startsWith('/comic/read') || pathname?.startsWith('/read');
  const isNovelRead = pathname?.startsWith('/novel/read');

  const isKaaoffcHub = pathname === '/kaaoffc';

  if (isAdmin || isComicRead || isNovelRead || isKaaoffcHub) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full pt-[72px] sm:pt-[84px] pb-12 flex flex-col relative min-h-[85vh] max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row w-full gap-6 lg:gap-8">
          {children}
        </div>
      </main>
      <footer className="bg-zinc-100 dark:bg-[#1f1f22] border-t border-zinc-200 dark:border-zinc-800 mt-auto pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          
          {/* Social Icons */}
          <div className="flex items-center gap-4 mb-6">
            {settings.social_whatsapp && (
              <a href={settings.social_whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
              </a>
            )}
            {settings.social_discord && (
              <a href={settings.social_discord} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019zM5.82 8.19c-1.111 0-2.027-.966-2.027-2.155 0-1.189.904-2.154 2.027-2.154 1.136 0 2.043.965 2.027 2.154 0 1.189-.891 2.155-2.027 2.155zm4.36 0c-1.111 0-2.027-.966-2.027-2.155 0-1.189.904-2.154 2.027-2.154 1.136 0 2.043.965 2.027 2.154 0 1.189-.891 2.155-2.027 2.155z"/>
                </svg>
              </a>
            )}
            {settings.social_facebook && (
              <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                </svg>
              </a>
            )}
            {settings.social_tiktok && (
              <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"/>
                </svg>
              </a>
            )}
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-6">
            <Link href="/about-us" className="hover:text-amber-600 transition-colors">About Us</Link>
            <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
            <Link href="/contact-us" className="hover:text-amber-600 transition-colors">Contact Us</Link>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl text-center leading-relaxed mb-4">
            Kaaoffc does not host any files, it merely pulls streams from 3rd party services. Legal issues should be taken up with the file hosts and providers. Kaaoffc is not responsible for any media files shown by the video providers.
          </p>
        </div>
        
        <div className="text-center mt-6 pt-6 border-t border-zinc-800/50 text-sm text-zinc-500">
          <p>
            &copy; {new Date().getFullYear()} <span className="font-bold">Kaaoffc</span>. All rights reserved.
          </p>
        </div>
      </footer>
      <MobileNav />
    </>
  );
}
