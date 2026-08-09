'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    try {
      const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
      if (hasSeenSplash) {
        setShow(false);
        return;
      }
    } catch (e) {
      console.warn('sessionStorage not available', e);
    }

    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        setShow(false);
        try {
          sessionStorage.setItem('hasSeenSplash', 'true');
        } catch (e) {}
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center text-center px-4">
        <div className="w-40 h-40 mb-6 flex items-center justify-center animate-pulse">
          <img 
            src="/welcome-logo.png" 
            alt="Kaaoffc Logo" 
            className="w-full h-full object-contain drop-shadow-lg"
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
          />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 drop-shadow-md">
          Welcome to <span className="text-red-600">K</span>aaoffc
        </h1>
        <p className="text-zinc-400 text-sm font-medium max-w-xs leading-relaxed mb-8">
          Kaaoffc is a free no ads anime site to watch free anime.
        </p>
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-[#ff6b00] rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
