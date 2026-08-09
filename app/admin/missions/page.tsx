'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exp_reward: 50,
    action_type: 'login_daily',
    target_count: 1,
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchMissions = async () => {
    try {
      const res = await fetch('/api/admin/missions');
      const data = await res.json();
      if (Array.isArray(data)) setMissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleOpenModal = (mission?: any) => {
    if (mission) {
      setEditingMission(mission);
      setFormData({
        title: mission.title,
        description: mission.description || '',
        exp_reward: mission.exp_reward,
        action_type: mission.action_type,
        target_count: mission.target_count,
        is_active: mission.is_active
      });
    } else {
      setEditingMission(null);
      setFormData({
        title: '',
        description: '',
        exp_reward: 50,
        action_type: 'login_daily',
        target_count: 1,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const url = editingMission 
        ? `/api/admin/missions?id=${editingMission.id}`
        : '/api/admin/missions';
        
      const res = await fetch(url, {
        method: editingMission ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchMissions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus misi ini?')) return;
    try {
      const res = await fetch(`/api/admin/missions?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchMissions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target size={28} className="text-purple-400" />
            Misi & Gamifikasi
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Buat misi untuk meningkatkan interaksi user</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Buat Misi Baru
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl border border-zinc-800"></div>)}
        </div>
      ) : missions.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-zinc-500">
          <Target size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">Belum ada misi. Buat misi pertamamu!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map(m => (
            <div key={m.id} className={`bg-zinc-900 border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-colors ${m.is_active ? 'border-zinc-800 hover:border-purple-500/50' : 'border-zinc-800 opacity-60'}`}>
              {!m.is_active && (
                <div className="absolute top-3 right-3 bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Nonaktif
                </div>
              )}
              <h3 className="text-lg font-bold text-white pr-16">{m.title}</h3>
              <p className="text-sm text-zinc-400 mt-1 mb-4 h-10 line-clamp-2">{m.description}</p>
              
              <div className="flex items-center justify-between mb-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold">Reward</span>
                  <span className="text-amber-400 font-bold">+{m.exp_reward} EXP</span>
                </div>
                <div className="w-px h-8 bg-zinc-800"></div>
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold">Aksi</span>
                  <span className="text-zinc-300 font-medium capitalize">{m.action_type}</span>
                </div>
                <div className="w-px h-8 bg-zinc-800"></div>
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-500 uppercase font-bold">Target</span>
                  <span className="text-zinc-300 font-medium">{m.target_count}x</span>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => handleOpenModal(m)} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-zinc-300 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-zinc-950 p-5 flex justify-between items-center border-b border-zinc-800">
              <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                <Target size={20} className="text-purple-400" />
                {editingMission ? 'Edit Misi' : 'Buat Misi Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Judul Misi</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#0a0a0c] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Deskripsi</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#0a0a0c] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Reward (EXP)</label>
                  <input 
                    type="number" 
                    required min={1}
                    value={formData.exp_reward}
                    onChange={e => setFormData({...formData, exp_reward: Number(e.target.value)})}
                    className="w-full bg-[#0a0a0c] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Target (Berapa Kali)</label>
                  <input 
                    type="number" 
                    required min={1}
                    value={formData.target_count}
                    onChange={e => setFormData({...formData, target_count: Number(e.target.value)})}
                    className="w-full bg-[#0a0a0c] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase">Tipe Aksi</label>
                  <select 
                    value={formData.action_type}
                    onChange={e => setFormData({...formData, action_type: e.target.value})}
                    className="w-full bg-[#0a0a0c] border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                  >
                    <option value="login_daily">Login Harian</option>
                    <option value="read_chapter">Baca Chapter</option>
                    <option value="watch_episode">Nonton Episode</option>
                    <option value="comment">Komentar</option>
                  </select>
                </div>
                
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 rounded border-zinc-700 bg-[#0a0a0c] text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-900"
                    />
                    <span className="text-sm font-bold text-white">Misi Aktif</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex gap-3">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Misi'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
