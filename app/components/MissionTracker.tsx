'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';

export default function MissionTracker({ actionType }: { actionType: string }) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    // Hanya jalankan jika user sudah login dan belum ditrack di sesi komponen ini
    if (user && !tracked.current) {
      tracked.current = true;
      
      // Delay 5 detik untuk memastikan user benar-benar membaca/menonton, bukan sekadar klik lalu kembali
      const timer = setTimeout(() => {
        fetch('/api/missions/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action_type: actionType })
        }).then(res => res.json()).then(data => {
          if (data.success && data.results?.some((r: any) => r.is_completed)) {
            import('@/lib/supabase').then(({ supabase }) => {
              supabase.auth.refreshSession();
            });
          }
        }).catch(console.error);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [user, actionType]);

  return null; // Komponen ini berjalan di background (invisible)
}
