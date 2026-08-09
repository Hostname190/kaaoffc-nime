'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Book, Users, MessageSquare, TrendingUp, Crown, Star, ArrowUpRight, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [novels, setNovels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNovels = () => {
    fetch('/api/novels')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNovels(data);
        } else {
          console.error("Failed to fetch novels:", data.error || data);
          setNovels([]);
        }
        setLoading(false);
      })
  };

  const fetchStats = () => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchNovels();
    fetchStats();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus novel ini?')) {
      fetch(`/api/novels/${id}`, { method: 'DELETE' })
        .then(() => fetchNovels());
    }
  };

  const statCards = [
    { label: 'Total Novel', value: stats?.totalNovels ?? '—', icon: Book, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total User', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Total Komentar', value: stats?.totalComments ?? '—', icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Laporan Error', value: stats?.totalReports ?? '—', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard Admin</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {statCards.map((s, i) => (
          <div key={i} className={`bg-zinc-900 rounded-2xl border ${s.border} p-5 flex items-center gap-4 shadow-lg`}>
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column: Top Users + Recent Users */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Top Users */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Crown size={18} className="text-amber-400" /> Top User</h3>
              <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">Lihat Semua <ArrowUpRight size={12} /></Link>
            </div>
            <div className="flex flex-col gap-3">
              {stats.topUsers?.map((u: any, i: number) => (
                <div key={u.id} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3 border border-zinc-800">
                  <span className={`text-xs font-bold w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-700' : 'text-zinc-500'}`}>#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 shrink-0">
                    <img src={u.avatar_url || '/avatar.jpeg'} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
                  </div>
                  <span className="font-semibold text-sm text-zinc-200 capitalize flex-1 truncate">{u.display_name || 'Tanpa Nama'}</span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Lv.{u.level || 1}</span>
                </div>
              ))}
              {(!stats.topUsers || stats.topUsers.length === 0) && (
                <p className="text-zinc-600 text-sm text-center py-4">Belum ada data user.</p>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> User Terbaru</h3>
              <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">Lihat Semua <ArrowUpRight size={12} /></Link>
            </div>
            <div className="flex flex-col gap-3">
              {stats.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3 border border-zinc-800">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 shrink-0">
                    <img src={u.avatar_url || '/avatar.jpeg'} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-zinc-200 capitalize block truncate">{u.display_name || 'Tanpa Nama'}</span>
                    <span className="text-[10px] text-zinc-500">{u.updated_at ? new Date(u.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Lv.{u.level || 1}</span>
                </div>
              ))}
              {(!stats.recentUsers || stats.recentUsers.length === 0) && (
                <p className="text-zinc-600 text-sm text-center py-4">Belum ada data user.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Novels Table */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-white">Daftar Novel Cerita</h2>
        <Link href="/admin/novel/new" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors -600/20 w-full sm:w-auto text-center">
          + Tambah Novel
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-16 bg-zinc-900 rounded-xl border border-zinc-800"></div>
          <div className="h-16 bg-zinc-900 rounded-xl border border-zinc-800"></div>
        </div>
      ) : novels.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-zinc-500">
          <p className="font-medium">Belum ada novel yang diupload.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl overflow-x-auto custom-scrollbar border border-zinc-800 shadow-xl">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800 text-sm">
              <tr>
                <th className="p-5 font-semibold">Judul</th>
                <th className="p-5 font-semibold">Author</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-center">Chapters</th>
                <th className="p-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {novels.map(novel => (
                <tr key={novel.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                  <td className="p-5 font-bold text-zinc-100">{novel.title}</td>
                  <td className="p-5 font-medium text-zinc-400">{novel.author}</td>
                  <td className="p-5">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${novel.status === 'ONGOING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {novel.status}
                    </span>
                  </td>
                  <td className="p-5 text-center font-bold text-zinc-300">{novel.chapters?.length || 0}</td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/novel/${novel.id}`} className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/10">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(novel.id)} className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/10">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
