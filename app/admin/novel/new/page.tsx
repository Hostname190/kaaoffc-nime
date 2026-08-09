'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Upload, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function NewNovelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    synopsis: '',
    genre: '',
    status: 'ONGOING',
    thumbnail: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let thumbnailUrl = formData.thumbnail;

      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.url) thumbnailUrl = uploadJson.url;
      }

      const res = await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, thumbnail: thumbnailUrl }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        alert('Gagal membuat novel');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Tambah Novel Baru</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-xl">
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-300">Judul Novel</label>
          <input required type="text" placeholder="Masukkan judul novel..." className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-300">Author / Penulis</label>
          <input required type="text" placeholder="Nama penulis..." className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">Genre</label>
            <input required type="text" placeholder="Fantasy, Romance, etc" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">Status</label>
            <select className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-300">Cover Image</label>
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-24 h-32 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={28} className="text-zinc-600" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm text-zinc-300 font-medium transition-colors">
                <Upload size={16} />
                {file ? file.name : 'Pilih gambar cover...'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <p className="text-xs text-zinc-600 mt-2">Upload gambar cover novel dari perangkat Anda (JPG, PNG)</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-zinc-300">Sinopsis</label>
          <textarea required rows={6} placeholder="Tulis sinopsis novel..." className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm leading-relaxed" value={formData.synopsis} onChange={e => setFormData({...formData, synopsis: e.target.value})} />
        </div>

        <div className="flex gap-3 pt-2">
          <button disabled={loading} type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors -600/20">
            <Save size={18} />
            {loading ? 'Menyimpan...' : 'Simpan Novel'}
          </button>
          <Link href="/admin" className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors text-center">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
