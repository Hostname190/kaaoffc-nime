'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle, X, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export default function MissionsPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchMissions();
    }
  }, [isOpen, user]);

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
        fetchMissions(); // Refresh progress
        import('@/lib/supabase').then(async ({ supabase }) => {
          if (data.exp_rewarded) {
             supabase.auth.refreshSession();
          }
        });
      } else {
        alert(data.error || 'Gagal klaim misi');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1C1D2A] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="bg-purple-600/10 p-5 flex justify-between items-center border-b border-purple-500/20">
          <h3 className="text-white font-bold flex items-center gap-2 text-lg">
            <Target size={20} className="text-purple-500" />
            Misi Harian
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {!user ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">Silakan login untuk melihat misi.</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-8">
              <Target size={40} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-400 font-medium">Belum ada misi aktif saat ini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {missions.map(m => {
                const progressPct = Math.min(100, Math.round((m.progress / m.target_count) * 100));
                return (
                  <div key={m.id} className={`bg-[#0a0a0c] border rounded-xl p-4 transition-colors ${m.is_completed ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-zinc-100 flex items-center gap-2">
                          {m.title}
                          {m.is_completed && <CheckCircle size={14} className="text-emerald-500" />}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                        <Gift size={12} className="text-purple-400" />
                        <span className="text-xs font-bold text-purple-400">+{m.exp_reward} EXP</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${m.is_completed ? 'bg-emerald-500' : 'bg-purple-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-400 min-w-[32px] text-right">
                        {m.progress}/{m.target_count}
                      </span>
                    </div>

                    {!m.is_completed && (
                      <button 
                        onClick={() => {
                          if (m.action_type === 'login_daily') {
                            claimMission(m.id);
                          } else if (m.action_type === 'read_chapter') {
                            onClose();
                            router.push('/comic');
                          } else if (m.action_type === 'watch_episode') {
                            onClose();
                            router.push('/anime');
                          } else if (m.action_type === 'comment') {
                            onClose();
                            router.push('/anime');
                          } else {
                            // Default redirect for unknown missions, prevent manual claiming
                            onClose();
                            router.push('/');
                          }
                        }}
                        disabled={claiming === m.id}
                        className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {m.action_type === 'login_daily' ? 'Klaim Login' : 'Lakukan Misi'} <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
