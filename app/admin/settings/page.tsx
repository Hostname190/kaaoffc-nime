'use client';

import { useState, useEffect } from 'react';
import { Settings, Palette, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    primary_color: '#60a5fa',
    site_name: 'Kaaoffc',
    social_whatsapp: '',
    social_discord: '',
    social_facebook: '',
    social_tiktok: '',
    community_url: '',
    support_url: ''
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.primary_color || data.site_name) {
          setSettings({
            primary_color: data.primary_color || '#60a5fa',
            site_name: data.site_name || 'Kaaoffc',
            social_whatsapp: data.social_whatsapp || '',
            social_discord: data.social_discord || '',
            social_facebook: data.social_facebook || '',
            social_tiktok: data.social_tiktok || '',
            community_url: data.community_url || '',
            support_url: data.support_url || ''
          });
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    { name: 'Blue (Default)', value: '#60a5fa' },
    { name: 'Rose', value: '#fb7185' },
    { name: 'Emerald', value: '#34d399' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Purple', value: '#c084fc' },
  ];

  if (loading) {
    return <div className="p-8 text-white">Memuat pengaturan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings size={28} className="text-zinc-400" />
          Pengaturan Situs
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Kustomisasi tampilan dan konfigurasi web</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          
          {/* Site Name */}
          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2">Nama Website</label>
            <input 
              type="text" 
              value={settings.site_name}
              onChange={e => setSettings({...settings, site_name: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-2 flex items-center gap-2">
              <Palette size={16} /> Warna Utama Tema (Primary Color)
            </label>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {presetColors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSettings({...settings, primary_color: color.value})}
                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${settings.primary_color === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={settings.primary_color}
                onChange={e => setSettings({...settings, primary_color: e.target.value})}
                className="w-12 h-12 bg-transparent border-0 cursor-pointer p-0 rounded-lg"
              />
              <input 
                type="text" 
                value={settings.primary_color}
                onChange={e => setSettings({...settings, primary_color: e.target.value})}
                className="w-32 bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">Pilih warna khusus atau gunakan preset di atas. Perubahan mungkin memerlukan muat ulang halaman untuk diterapkan sepenuhnya.</p>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <h2 className="text-lg font-bold text-white mb-4">Link Sosial Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">WhatsApp</label>
                <input 
                  type="text" 
                  placeholder="https://wa.me/..."
                  value={settings.social_whatsapp}
                  onChange={e => setSettings({...settings, social_whatsapp: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Discord</label>
                <input 
                  type="text" 
                  placeholder="https://discord.gg/..."
                  value={settings.social_discord}
                  onChange={e => setSettings({...settings, social_discord: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Facebook</label>
                <input 
                  type="text" 
                  placeholder="https://facebook.com/..."
                  value={settings.social_facebook}
                  onChange={e => setSettings({...settings, social_facebook: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">TikTok</label>
                <input 
                  type="text" 
                  placeholder="https://tiktok.com/@..."
                  value={settings.social_tiktok}
                  onChange={e => setSettings({...settings, social_tiktok: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">Kosongkan kolom jika ikon tidak ingin ditampilkan di footer.</p>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <h2 className="text-lg font-bold text-white mb-4">Link Popup Utama & Donasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Link Komunitas</label>
                <input 
                  type="text" 
                  placeholder="https://whatsapp.com/channel/..."
                  value={settings.community_url}
                  onChange={e => setSettings({...settings, community_url: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Link Support / Donasi</label>
                <input 
                  type="text" 
                  placeholder="https://saweria.co/..."
                  value={settings.support_url}
                  onChange={e => setSettings({...settings, support_url: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">Link ini digunakan untuk tombol di Home Page dan Popup Pemberitahuan.</p>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center gap-4">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            
            {success && (
              <span className="text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                ✓ Berhasil disimpan!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
