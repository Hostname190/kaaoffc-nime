'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

export default function AdminNovelPage() {
  const [novels, setNovels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      const res = await fetch('/api/novels');
      const data = await res.json();
      setNovels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus novel ini?')) return;
    
    try {
      const res = await fetch(`/api/novels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNovels();
      } else {
        alert('Gagal menghapus novel');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Kelola Novel</h1>
          <p className="text-zinc-400 text-sm">Kelola daftar novel original yang tersedia di platform</p>
        </div>
        <Link 
          href="/admin/novel/new" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Tambah Novel
        </Link>
      </div>

      <div className="bg-[#1A1D21] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F1115] border-b border-zinc-800">
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Info Novel</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Genre & Status</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Chapter</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">Memuat data novel...</td>
                </tr>
              ) : novels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">Belum ada novel yang ditambahkan.</td>
                </tr>
              ) : (
                novels.map((novel) => (
                  <tr key={novel.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {novel.thumbnail ? (
                          <img src={novel.thumbnail} alt={novel.title} className="w-12 h-16 object-cover rounded-md bg-zinc-900 border border-zinc-800" />
                        ) : (
                          <div className="w-12 h-16 bg-zinc-900 rounded-md border border-zinc-800 flex items-center justify-center text-zinc-600">
                            <BookOpen size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-zinc-100 mb-1">{novel.title}</div>
                          <div className="text-xs text-zinc-500">Author: {novel.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-medium">{novel.genre}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${novel.status === 'ONGOING' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                          {novel.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-zinc-300">
                        {novel.chapters?.length || 0} Ch
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/novel/${novel.id}`} 
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit Novel"
                        >
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(novel.id)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus Novel"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
