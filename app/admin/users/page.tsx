'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, X, Save, Users, Star, Crown, Sparkles, Shield, ChevronUp, ChevronDown, Trash2, MessageSquare, Eye, Ban, ShieldAlert } from 'lucide-react';

function getUserTier(level: number) {
  if (level >= 100) return { name: 'Mythic', icon: Crown, color: 'from-rose-500 via-purple-500 to-indigo-500', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  if (level >= 50)  return { name: 'Legend', icon: Crown, color: 'from-amber-400 via-yellow-500 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  if (level >= 30)  return { name: 'Elite', icon: Sparkles, color: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
  if (level >= 10)  return { name: 'Veteran', icon: Shield, color: 'from-emerald-400 to-green-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  return { name: 'Newbie', icon: Star, color: 'from-zinc-400 to-zinc-500', text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-700' };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editLevel, setEditLevel] = useState('');
  const [editExp, setEditExp] = useState('');
  const [editRole, setEditRole] = useState('');
  const [banningUser, setBanningUser] = useState<any | null>(null);
  const [banReason, setBanReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'level' | 'exp' | 'name'>('level');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewingComments, setViewingComments] = useState<any | null>(null);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
        setErrorMsg('');
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      console.error('Failed to fetch users', e);
      setErrorMsg(e.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSort = (key: 'level' | 'exp' | 'name') => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    const userId = editingUser.id;
    const newLevel = Number(editLevel);
    const newExp = Number(editExp);
    const newRole = editRole;

    // Optimistic UI Update: Langsung update UI tanpa menunggu API
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          level: newLevel,
          exp: newExp,
          role: newRole,
          raw_user_meta_data: {
            ...u.raw_user_meta_data,
            level: newLevel,
            exp: newExp,
            role: newRole
          }
        };
      }
      return u;
    }));
    
    // Tutup popup langsung
    setEditingUser(null);

    try {
      // Proses API berjalan di background
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: newLevel,
          exp: newExp,
          role: newRole
        })
      });
      
      if (!res.ok) {
        // Revert jika gagal
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to update user', e);
      fetchUsers(); // Revert
    }
  };

  const handleSaveBan = async () => {
    if (!banningUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${banningUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_banned: !banningUser.is_banned,
          ban_reason: !banningUser.is_banned ? banReason : ''
        })
      });
      if (res.ok) {
        setBanningUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to update ban status', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Yakin ingin MENGHAPUS user "${user.display_name || 'Tanpa Nama'}"?\n\nSemua data user termasuk komentar akan dihapus PERMANEN!`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers();
      } else {
        alert(`Gagal menghapus user: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Terjadi error: ${e.message}`);
    }
  };

  const viewUserComments = async (user: any) => {
    setViewingComments(user);
    setLoadingComments(true);
    try {
      const res = await fetch('/api/admin/comments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUserComments(data.filter((c: any) => c.user_id === user.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const startEditing = (user: any) => {
    setEditingUser(user);
    setEditLevel(String(user.level || 1));
    setEditExp(String(user.exp || 0));
    setEditRole(user.role || 'User');
  };

  // Filter & sort
  const filteredUsers = users
    .filter(u => {
      const q = searchQuery.toLowerCase();
      return (u.display_name || '').toLowerCase().includes(q) || (u.id || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let valA: any, valB: any;
      if (sortBy === 'level') { valA = a.level || 0; valB = b.level || 0; }
      else if (sortBy === 'exp') { valA = a.exp || 0; valB = b.exp || 0; }
      else { valA = (a.display_name || '').toLowerCase(); valB = (b.display_name || '').toLowerCase(); }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={28} className="text-blue-400" />
            Kelola User
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{users.length} pengguna terdaftar</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama pengguna atau ID..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-zinc-900 rounded-xl border border-zinc-800"></div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-12 text-center border-2 border-dashed border-red-900/50 rounded-2xl bg-red-900/10 text-red-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold mb-2">Gagal Memuat Data User</p>
          <p className="text-sm opacity-80">{errorMsg}</p>
          <p className="text-sm opacity-80 mt-4 max-w-lg mx-auto bg-black/20 p-3 rounded-lg border border-red-500/20">
            Catatan: Fitur Kelola User memerlukan <strong>SUPABASE_SERVICE_ROLE_KEY</strong>. 
            Jika Anda menjalankan ini secara lokal (localhost) dan belum menambahkan Service Role Key ke file <code>.env.local</code>, maka data user tidak bisa ditarik. 
            Fitur ini akan berfungsi normal jika di-push ke Vercel (karena kuncinya sudah ada di sana).
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-zinc-500">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">{searchQuery ? 'Tidak ditemukan pengguna dengan pencarian tersebut.' : 'Belum ada pengguna terdaftar.'}</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl overflow-x-auto custom-scrollbar border border-zinc-800 shadow-xl">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">#</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold cursor-pointer hover:text-zinc-200 transition-colors select-none" onClick={() => handleSort('name')}>
                  Nama <SortIcon field="name" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-zinc-200 transition-colors select-none text-center" onClick={() => handleSort('level')}>
                  Level <SortIcon field="level" />
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-zinc-200 transition-colors select-none text-center" onClick={() => handleSort('exp')}>
                  EXP <SortIcon field="exp" />
                </th>
                <th className="p-4 font-semibold">Tier</th>
                <th className="p-4 font-semibold">Terakhir Aktif</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map((user, idx) => {
                const tier = getUserTier(user.level || 1);
                const TierIcon = tier.icon;
                return (
                  <tr key={user.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shrink-0">
                        <img 
                          src={user.avatar_url || '/avatar.jpeg'} 
                          alt={user.display_name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 capitalize">{user.display_name || 'Tanpa Nama'}</span>
                        {user.role && user.role !== 'User' && (
                          <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                            user.role === 'Developer' || user.role === 'Pengembang' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 block mt-0.5">{user.id?.slice(0, 12)}...</span>
                      {user.is_banned && (
                        <span className="inline-flex mt-1 items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          <Ban size={10} /> BANNED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${tier.color} text-white`}>
                        Lv.{user.level || 1}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-zinc-200">{(user.exp || 0).toLocaleString()}</span>
                      <span className="text-zinc-600 text-xs ml-1">XP</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${tier.bg} ${tier.text} border ${tier.border}`}>
                        <TierIcon size={12} />
                        {tier.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-zinc-500">
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
 onClick={() => viewUserComments(user)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 p-1.5 rounded-lg transition-colors border border-blue-500/10"
                          title="Lihat Komentar"
                        >
                          <Eye size={14} />
                        </button>
                        <button
 onClick={() => startEditing(user)}
                          className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 p-1.5 rounded-lg transition-colors border border-amber-500/10"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setBanningUser(user); setBanReason(user.ban_reason || ''); }}
                          className={`text-xs font-bold p-1.5 rounded-lg transition-colors border ${user.is_banned ? 'text-zinc-400 hover:text-zinc-300 bg-zinc-500/10 hover:bg-zinc-500/20 border-zinc-500/10' : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/10'}`}
                          title={user.is_banned ? "Unban User" : "Ban User"}
                        >
                          {user.is_banned ? <Shield size={14} /> : <Ban size={14} />}
                        </button>
                        <button
 onClick={() => handleDeleteUser(user)}
                          className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors border border-red-500/10"
                          title="Hapus User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 size={18} className="text-amber-400" /> Edit User
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={22} /></button>
            </div>

            <div className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-600 shrink-0">
                <img src={editingUser.avatar_url || '/avatar.jpeg'} alt={editingUser.display_name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
              </div>
              <div>
                <p className="font-bold text-white capitalize text-lg">{editingUser.display_name || 'Tanpa Nama'}</p>
                <p className="text-zinc-500 text-xs font-mono">{editingUser.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Level</label>
                <input type="number" min="1" value={editLevel} onChange={(e) => setEditLevel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white text-center text-xl font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">EXP</label>
                <input type="number" min="0" value={editExp} onChange={(e) => setEditExp(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white text-center text-xl font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Role / Tag</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all">
                <option value="User">User Biasa</option>
                <option value="Developer">Developer</option>
                <option value="Moderator">Moderator</option>
                <option value="Author">Author</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {(() => {
              const previewTier = getUserTier(Number(editLevel) || 1);
              const PreviewIcon = previewTier.icon;
              return (
                <div className={`flex items-center justify-center gap-3 py-3 rounded-xl ${previewTier.bg} border ${previewTier.border}`}>
                  <PreviewIcon size={18} className={previewTier.text} />
                  <span className={`font-bold text-sm ${previewTier.text}`}>Preview: Lv.{editLevel || 1} — {previewTier.name}</span>
                </div>
              );
            })()}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button onClick={() => setEditingUser(null)} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700 transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banningUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setBanningUser(null)}>
          <div className="bg-zinc-900 border border-red-900/50 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className={banningUser.is_banned ? "text-zinc-400" : "text-red-500"} /> 
                {banningUser.is_banned ? 'Bebaskan User (Unban)' : 'Ban User (Sanksi)'}
              </h3>
              <button onClick={() => setBanningUser(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={22} /></button>
            </div>

            <div className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                <img src={banningUser.avatar_url || '/avatar.jpeg'} alt={banningUser.display_name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-white capitalize">{banningUser.display_name || 'Tanpa Nama'}</p>
                <p className="text-zinc-500 text-xs font-mono">{banningUser.id}</p>
              </div>
            </div>

            {!banningUser.is_banned && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Alasan Ban / Sanksi (Opsional)</label>
                <textarea 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)} 
                  placeholder="Misal: Komentar toksik, Spamming..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[100px] resize-none text-sm" 
                />
              </div>
            )}
            
            {banningUser.is_banned && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-sm">
                <span className="text-zinc-500 block mb-1">Alasan Ban Sebelumnya:</span>
                <span className="text-zinc-300 italic">"{banningUser.ban_reason || 'Tidak ada alasan'}"</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveBan} disabled={saving} className={`flex-1 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${banningUser.is_banned ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-red-600 hover:bg-red-700'}`}>
                <Save size={16} /> {saving ? 'Memproses...' : (banningUser.is_banned ? 'Unban User' : 'Ban User')}
              </button>
              <button onClick={() => setBanningUser(null)} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700 transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* View Comments Modal */}
      {viewingComments && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setViewingComments(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-800 p-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-400" /> Komentar {viewingComments.display_name || 'User'}
              </h3>
              <button onClick={() => setViewingComments(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {loadingComments ? (
                <div className="text-center text-zinc-500 py-8 animate-pulse">Memuat komentar...</div>
              ) : userComments.length === 0 ? (
                <div className="text-center text-zinc-600 py-8">
                  <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium">User ini belum pernah berkomentar.</p>
                </div>
              ) : (
                userComments.map(c => (
                  <div key={c.id} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words mb-2">{c.content}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-600 truncate max-w-[200px]">{c.item_url}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
