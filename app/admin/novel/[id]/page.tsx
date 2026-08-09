'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Edit2, Trash2, Plus, X, Save, Book } from 'lucide-react';

export default function NovelEditPage() {
  const { id } = useParams();
  const [novel, setNovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', content: '' });
  
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterData, setEditChapterData] = useState({ title: '', content: '' });

  const [showEditNovel, setShowEditNovel] = useState(false);
  const [editNovelData, setEditNovelData] = useState({ title: '', synopsis: '', author: '', genre: '', status: '', thumbnail: '' });

  const fetchNovel = () => {
    fetch(`/api/novels/${id}`)
      .then(res => res.json())
      .then(data => {
        setNovel(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) fetchNovel();
  }, [id]);

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/novels/${id}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChapter),
    });
    if (res.ok) {
      setNewChapter({ title: '', content: '' });
      setShowAddForm(false);
      fetchNovel();
    }
  };

  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapterId) return;
    
    const res = await fetch(`/api/novels/${id}/chapters/${editingChapterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editChapterData),
    });
    
    if (res.ok) {
      setEditingChapterId(null);
      setEditChapterData({ title: '', content: '' });
      fetchNovel();
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm('Yakin ingin menghapus chapter ini secara permanen?')) {
      await fetch(`/api/novels/${id}/chapters/${chapterId}`, { method: 'DELETE' });
      fetchNovel();
    }
  };

  const startEditing = (ch: any) => {
    setEditingChapterId(ch.id);
    setEditChapterData({ title: ch.title, content: ch.content || '' });
    setShowAddForm(false);
  };

  const startEditingNovel = () => {
    setEditNovelData({
      title: novel.title || '',
      synopsis: novel.synopsis || '',
      author: novel.author || '',
      genre: novel.genre || '',
      status: novel.status || '',
      thumbnail: novel.thumbnail || ''
    });
    setShowEditNovel(true);
  };

  const handleUpdateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/novels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editNovelData),
    });
    if (res.ok) {
      setShowEditNovel(false);
      fetchNovel();
    } else {
      alert('Gagal mengupdate novel');
    }
  };

  if (loading) return <div className="text-zinc-400 p-8 text-center animate-pulse">Memuat data novel...</div>;
  if (!novel || novel.error) return <div className="text-red-400 p-8 text-center font-bold">Novel tidak ditemukan</div>;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Novel Header Info */}
      <div className="flex flex-col sm:flex-row gap-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mb-8 shadow-xl">
        <div className="w-32 sm:w-40 aspect-[3/4] shrink-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-lg mx-auto sm:mx-0">
          {novel.thumbnail && <img src={novel.thumbnail.startsWith('/') ? novel.thumbnail : `/api/image-proxy?url=${encodeURIComponent(novel.thumbnail)}`} alt={novel.title} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 flex flex-col justify-center text-center sm:text-left relative">
          <button 
 onClick={startEditingNovel} 
 className="absolute top-0 right-0 sm:-top-2 sm:-right-2 p-2 bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 text-zinc-400 rounded-lg transition-colors border border-transparent hover:border-amber-500/30"
 title="Edit Data Novel"
 >
            <Edit2 size={16} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 pr-8">{novel.title}</h1>
          <p className="text-zinc-400 text-sm mb-4">Oleh <span className="font-semibold text-zinc-300">{novel.author}</span></p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold">{novel.genre}</span>
            <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold">{novel.status}</span>
          </div>
        </div>
      </div>

      {/* Edit Novel Modal/Form */}
      {showEditNovel && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateNovel} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit2 size={20} className="text-amber-500"/> Edit Data Novel</h3>
              <button type="button" onClick={() => setShowEditNovel(false)} className="text-zinc-400 hover:text-white p-1 bg-zinc-800 rounded-lg"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1 text-zinc-300">Judul Novel</label>
                <input required type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none" value={editNovelData.title} onChange={e => setEditNovelData({...editNovelData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-300">Penulis</label>
                <input required type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none" value={editNovelData.author} onChange={e => setEditNovelData({...editNovelData, author: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-300">URL Thumbnail</label>
                <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none" value={editNovelData.thumbnail} onChange={e => setEditNovelData({...editNovelData, thumbnail: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-300">Genre</label>
                <input required type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none" value={editNovelData.genre} onChange={e => setEditNovelData({...editNovelData, genre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-300">Status</label>
                <select required className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none" value={editNovelData.status} onChange={e => setEditNovelData({...editNovelData, status: e.target.value})}>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Hiatus">Hiatus</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold mb-1 text-zinc-300">Sinopsis</label>
                <textarea required rows={5} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-300 focus:border-amber-500 focus:outline-none" value={editNovelData.synopsis} onChange={e => setEditNovelData({...editNovelData, synopsis: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800">
              <button type="submit" className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700 flex justify-center items-center gap-2"><Save size={18}/> Simpan Perubahan</button>
              <button type="button" onClick={() => setShowEditNovel(false)} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-bold hover:bg-zinc-700">Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* Chapters Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Daftar Chapter ({novel.chapters?.length || 0})</h2>
        <button 
 onClick={() => { setShowAddForm(!showAddForm); setEditingChapterId(null); }} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all w-full sm:w-auto justify-center ${showAddForm ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
        >
          {showAddForm ? <><X size={18} /> Batal Tambah</> : <><Plus size={18} /> Tambah Chapter</>}
        </button>
      </div>

      {/* Add Chapter Form */}
      {showAddForm && (
        <form onSubmit={handleAddChapter} className="bg-zinc-900 p-6 rounded-2xl border border-blue-500/30 mb-8 flex flex-col gap-5 shadow-2xl">
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><Plus size={20} /> Chapter Baru</h3>
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">Judul Chapter</label>
            <input required type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={newChapter.title} onChange={e => setNewChapter({...newChapter, title: e.target.value})} placeholder="Contoh: Chapter 1 - Awal Mula" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">Isi Cerita</label>
            <textarea required rows={12} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed" value={newChapter.content} onChange={e => setNewChapter({...newChapter, content: e.target.value})} placeholder="Tulis cerita di sini... (tekan enter untuk baris baru)" />
          </div>
          <button type="submit" className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={18} /> Simpan Chapter</button>
        </form>
      )}

      {/* Chapters List */}
      <div className="flex flex-col gap-3">
        {!novel.chapters || novel.chapters.length === 0 ? (
          <div className="text-center p-12 bg-zinc-900/50 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
            <Book size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Belum ada chapter.</p>
            <p className="text-sm mt-1">Mulai tulis ceritamu sekarang!</p>
          </div>
        ) : (
          novel.chapters.map((ch: any, idx: number) => (
            <div key={ch.id} className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 transition-all hover:border-zinc-700">
              {editingChapterId === ch.id ? (
                // Edit Form
                <form onSubmit={handleUpdateChapter} className="flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                     <h3 className="text-amber-500 font-bold flex items-center gap-2"><Edit2 size={16} /> Edit Chapter</h3>
                     <button type="button" onClick={() => setEditingChapterId(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-400">Judul Chapter</label>
                    <input required type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500" value={editChapterData.title} onChange={e => setEditChapterData({...editChapterData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-400">Isi Cerita</label>
                    <textarea required rows={10} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-amber-500 font-mono text-sm leading-relaxed" value={editChapterData.content} onChange={e => setEditChapterData({...editChapterData, content: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg font-bold hover:bg-amber-700 flex items-center justify-center gap-2"><Save size={16} /> Update</button>
                    <button type="button" onClick={() => setEditingChapterId(null)} className="flex-1 bg-zinc-800 text-white py-2.5 rounded-lg font-bold hover:bg-zinc-700">Batal</button>
                  </div>
                </form>
              ) : (
                // Display Chapter
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded text-xs font-bold">#{idx + 1}</span>
                      <span className="font-bold text-zinc-100 text-lg">{ch.title}</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">{new Date(ch.createdAt || ch.created_at || new Date()).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-0 border-zinc-800 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <button onClick={() => startEditing(ch)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 text-zinc-300 text-sm font-semibold rounded-lg transition-colors border border-zinc-700 hover:border-amber-500/30">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteChapter(ch.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 text-zinc-300 text-sm font-semibold rounded-lg transition-colors border border-zinc-700 hover:border-red-500/30">
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
