// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

export default function StarRating({ url }: { url: string }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fallback ke localStorage jika tabel Supabase belum dibuat
  const getLocalRating = () => {
    try {
      const local = JSON.parse(localStorage.getItem('kaaoffc_ratings') || '{}');
      return local[url] || { userRating: 0, average: 0, count: 0 };
    } catch(e) { return { userRating: 0, average: 0, count: 0 }; }
  };

  const saveLocalRating = (val: number) => {
    try {
      const local = JSON.parse(localStorage.getItem('kaaoffc_ratings') || '{}');
      const current = local[url] || { average: 0, count: 0 };
      const newCount = current.count === 0 ? 1 : current.count;
      const newAverage = current.average === 0 ? val : (current.average * current.count + val) / (current.count + 1);
      
      local[url] = { userRating: val, average: newAverage, count: newCount };
      localStorage.setItem('kaaoffc_ratings', JSON.stringify(local));
      setAverage(newAverage);
      setCount(newCount);
    } catch(e) {}
  };

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/ratings?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        
        if (data.error && data.error.includes('Table missing')) {
          // Fallback lokal
          const local = getLocalRating();
          setAverage(local.average);
          setCount(local.count);
          setRating(local.userRating);
        } else {
          setAverage(data.average || 0);
          setCount(data.count || 0);
          
          // Jika ada fitur ambil rating user spesifik, set di sini
          // Untuk MVP, kita ambil dari local cache agar user tahu dia sudah ngevote
          const local = getLocalRating();
          if (local.userRating) setRating(local.userRating);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRating();
  }, [url]);

  const handleRate = async (val: number) => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk memberikan rating!');
      return;
    }
    
    setRating(val);
    
    try {
      // Simpan langsung dari client agar session/JWT user terbaca oleh Supabase RLS
      const { error } = await supabase
        .from('kaaoffc_ratings')
        .upsert({
          item_url: url,
          user_id: user.id,
          rating_value: val,
          updated_at: new Date().toISOString()
        }, { onConflict: 'item_url,user_id' });
      
      if (error) {
        if (error.message && error.message.includes('relation "kaaoffc_ratings" does not exist')) {
          // Fallback lokal
          saveLocalRating(val);
          alert('Berhasil menyimpan rating (Offline Mode - Tabel DB belum dibuat)');
        } else {
          alert('Gagal menyimpan rating: ' + error.message);
        }
      } else {
        alert('Terima kasih atas penilaian Anda!');
      }
    } catch (e) {
      saveLocalRating(val);
    }
  };

  if (loading) return <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg"></div>;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
 key={star}
 onMouseEnter={() => setHovered(star)}
              onClick={() => handleRate(star)}
              className={`p-1 transition-transform hover:scale-125 focus:outline-none ${
                (hovered || rating) >= star 
                  ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' 
                  : 'text-zinc-300 dark:text-zinc-700'
              }`}
            >
              <Star size={24} fill={(hovered || rating) >= star ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <div className="flex items-baseline gap-1.5 ml-2">
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{average > 0 ? average.toFixed(1) : '-'}</span>
          <span className="text-xs text-zinc-500 font-medium">/ 5.0</span>
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 px-1">{count > 0 ? `${count} Penilaian` : 'Belum ada penilaian'}</span>
    </div>
  );
}
