'use client';

import { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ReportButton({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const pathname = usePathname();

  // Hanya tampilkan jika user sudah login
  if (!user) return null;
  
  // Jangan tampilkan di halaman admin
  if (pathname?.startsWith('/admin')) return null;

  const itemType = pathname?.startsWith('/anime') ? 'anime' : pathname?.startsWith('/comic') ? 'comic' : pathname?.startsWith('/novel') ? 'novel' : 'general';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          item_url: window.location.href,
          item_type: itemType,
          reason
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setReason('');
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[90] w-12 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        title="Lapor Error"
      >
        <AlertTriangle size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1C1D2A] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="bg-rose-600/10 p-5 flex justify-between items-center border-b border-rose-500/20">
              <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                <AlertTriangle size={20} className="text-rose-500" />
                Lapor Error
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              {success ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={32} />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">Laporan Terkirim!</h4>
                  <p className="text-zinc-400 text-sm">Terima kasih atas bantuan Anda. Admin akan segera memeriksanya.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <p className="text-sm text-zinc-300">
                    Ada link mati, gambar rusak, atau error lainnya di halaman ini? Beritahu admin agar segera diperbaiki!
                  </p>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Detail Error</label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Misal: Video episode 3 tidak bisa diputar..."
                      className="w-full bg-[#0a0a0c] border border-zinc-700 text-white text-sm rounded-xl p-3 min-h-[120px] focus:outline-none focus:border-rose-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="bg-black/30 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block mb-1">URL yang dilaporkan:</span>
                    <span className="text-xs text-zinc-300 truncate block">{typeof window !== 'undefined' ? window.location.pathname : ''}</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting || !reason.trim()}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
