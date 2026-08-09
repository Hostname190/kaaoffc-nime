'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export default function MissionsWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/missions?userId=${user?.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setMissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const claimMission = async (missionId: string) => {
    if (!user) return;
    setClaiming(missionId);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, mission_id: missionId })
      });
      const data = await res.json();
      if (data.success) {
        fetchMissions();
        import('@/lib/supabase').then(async ({ supabase }) => {
          if (data.exp_rewarded) {
             supabase.auth.refreshSession();
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(null);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#111113] border border-zinc-800/60 rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
          <Target size={14} />
        </div>
        <h3 className="text-sm font-bold text-white">Misi Harian</h3>
      </div>
      
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : missions.length === 0 ? (
        <p className="text-zinc-500 text-xs font-medium text-center py-2">Belum ada misi aktif.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {missions.map(m => {
            const progressPct = Math.min(100, Math.round((m.progress / m.target_count) * 100));
            return (
              <div key={m.id} className={`bg-[#0a0a0c] border rounded-xl p-3 transition-colors ${m.is_completed ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-zinc-100 text-xs flex items-center gap-1.5 line-clamp-1">
                      {m.title}
                      {m.is_completed && <CheckCircle size={12} className="text-emerald-500" />}
                    </h4>
                  </div>
                  <div className="bg-purple-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-purple-400 shrink-0 flex items-center gap-1">
                    <Gift size={10} /> +{m.exp_reward}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${m.is_completed ? 'bg-emerald-500' : 'bg-purple-500'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 min-w-[24px] text-right">
                    {m.progress}/{m.target_count}
                  </span>
                </div>

                {!m.is_completed && (
                  <button 
                    onClick={() => {
                      if (m.action_type === 'login_daily') claimMission(m.id);
                      else if (m.action_type === 'read_chapter') router.push('/comic');
                      else if (m.action_type === 'watch_episode') router.push('/anime');
                      else if (m.action_type === 'comment') router.push('/anime');
                      else claimMission(m.id);
                    }}
                    disabled={claiming === m.id}
                    className="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {m.action_type === 'login_daily' ? 'Klaim Login' : 'Lakukan Misi'} <ChevronRight size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
