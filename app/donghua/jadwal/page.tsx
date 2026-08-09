'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import AnimeList from '../../components/AnimeList';
import Sidebar from '../../components/Sidebar';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function JadwalPage() {
  const [scheduleData, setScheduleData] = useState<any>({});
  const [activeDay, setActiveDay] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set active day to today
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
    const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    setActiveDay(dayMap[todayIndex]);

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/donghua/schedule');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Convert array to object { "Senin": [...], "Selasa": [...] }
          const map: any = {};
          data.forEach((d: any) => {
            map[d.day] = d.animeList;
          });
          setScheduleData(map);
        } else if (data && !data.error) {
          setScheduleData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const items = scheduleData[activeDay] || [];

  return (
    <>
      <div className="flex-1 min-w-0">


        <div className="flex overflow-x-auto no-scrollbar gap-3 mb-8 pb-2">
          {DAYS.map(day => {
            const isActive = day === activeDay;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-colors ${
                  isActive 
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                    : 'bg-[#1A1A22] text-zinc-400 hover:text-white border border-transparent hover:bg-[#20202a]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-8">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-sm font-medium text-zinc-400">Jadwal <strong className="text-white text-base">{activeDay}</strong></h2>
              <span className="px-2 py-0.5 bg-[#1A1A22] rounded text-xs text-zinc-500 font-bold">{items.length} Rilis</span>
            </div>

            <AnimeList items={items} />
          </div>
        )}
      </div>
      <Sidebar />
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}
