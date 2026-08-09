'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Search, User, ExternalLink } from 'lucide-react';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus komentar ini?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = comments.filter(c => {
    const q = searchQuery.toLowerCase();
    return (c.user_email || '').toLowerCase().includes(q) ||
           (c.content || '').toLowerCase().includes(q) ||
           (c.item_url || '').toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare size={28} className="text-amber-400" />
            Kelola Komentar
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{comments.length} komentar total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama user, isi komentar, atau URL halaman..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
        />
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl border border-zinc-800"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-zinc-500">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">{searchQuery ? 'Tidak ditemukan komentar.' : 'Belum ada komentar.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-700 transition-colors shadow-lg">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shrink-0">
                  <img 
                    src={c.user_avatar || '/avatar.jpeg'} 
                    alt={c.user_email} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-zinc-100 capitalize">{c.user_email || 'Tanpa Nama'}</span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">Lv.{c.user_level || 1}</span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Comment text */}
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed mb-2">{c.content}</p>

                  {/* Page URL */}
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 bg-zinc-800/50 rounded-lg px-2.5 py-1 w-fit border border-zinc-800">
                    <ExternalLink size={10} />
                    <span className="truncate max-w-[300px]">{c.item_url}</span>
                  </div>
                </div>

                {/* Delete */}
                <button
 onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-red-500/10 shrink-0 disabled:opacity-50"
                  title="Hapus komentar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
