'use client';

import { useEffect } from 'react';

/**
 * Komponen ini membaca semua preferensi dari localStorage
 * dan menerapkannya ke DOM saat aplikasi pertama kali dibuka.
 * Tidak merender apapun — hanya efek samping (side-effect only).
 */
export default function PreferenceApplier() {
  useEffect(() => {
    // 1. Kurangi Animasi
    const reducedMotion = localStorage.getItem('pref_reduced_motion') === 'true';
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // 2. Bahasa (set attribute lang di <html>)
    const lang = localStorage.getItem('pref_language') || 'id';
    document.documentElement.setAttribute('lang', lang);

    // 3. Service Worker & Notifikasi
    const notifsEnabled = localStorage.getItem('pref_notifications') === 'true';
    if (notifsEnabled && 'serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((err) => {
        console.error('Service Worker registration failed:', err);
      });

      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Notifikasi Diaktifkan!', {
              body: 'Anda akan menerima pemberitahuan episode baru Kaaoffc di sini.',
              icon: '/logo.png'
            });
          }
        });
      }
    }
  }, []);

  return null;
}
