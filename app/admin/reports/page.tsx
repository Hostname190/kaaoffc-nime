'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Trash2, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertCircle size={28} className="text-rose-400" />
            Laporan Error & Tiket
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{pendingReports.length} laporan butuh penanganan</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl border border-zinc-800"></div>)}
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50 text-zinc-500">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">Belum ada laporan dari user.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Pending Section */}
          {pendingReports.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-amber-400" /> Butuh Penanganan
              </h2>
              <div className="flex flex-col gap-3">
                {pendingReports.map(r => (
                  <ReportCard 
                    key={r.id} 
                    report={r} 
                    processing={processing} 
                    onStatusChange={handleStatusChange} 
                    onDelete={handleDelete} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved Section */}
          {resolvedReports.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-zinc-400 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-400" /> Sudah Selesai
              </h2>
              <div className="flex flex-col gap-3 opacity-70 hover:opacity-100 transition-opacity">
                {resolvedReports.map(r => (
                  <ReportCard 
                    key={r.id} 
                    report={r} 
                    processing={processing} 
                    onStatusChange={handleStatusChange} 
                    onDelete={handleDelete} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, processing, onStatusChange, onDelete }: { report: any, processing: string | null, onStatusChange: any, onDelete: any }) {
  return (
    <div className={`bg-zinc-900 border rounded-xl p-5 shadow-lg transition-colors ${report.status === 'pending' ? 'border-rose-500/30' : 'border-zinc-800'}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
          <img src={report.user_avatar} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-zinc-100">{report.user_name}</span>
            <span className="text-[10px] text-zinc-500">
              {new Date(report.created_at).toLocaleString('id-ID')}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${report.item_type === 'anime' ? 'bg-blue-500/20 text-blue-400' : report.item_type === 'comic' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {report.item_type}
            </span>
          </div>
          <p className="text-sm text-white bg-zinc-950 p-3 rounded-lg border border-zinc-800 mb-3 font-medium">
            "{report.reason}"
          </p>
          <a href={report.item_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 w-fit mb-4">
            <ExternalLink size={12} /> Cek Halaman Terkait
          </a>
          
          <div className="flex items-center gap-2">
            {report.status === 'pending' ? (
              <>
                <button 
                  onClick={() => onStatusChange(report.id, 'resolved')} 
                  disabled={processing === report.id}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle size={14} /> Tandai Selesai (Fixed)
                </button>
                <button 
                  onClick={() => onStatusChange(report.id, 'dismissed')} 
                  disabled={processing === report.id}
                  className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Abaikan
                </button>
              </>
            ) : (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {report.status === 'resolved' ? 'Telah Diperbaiki' : 'Diabaikan'}
              </span>
            )}
            
            <button 
              onClick={() => onDelete(report.id)} 
              disabled={processing === report.id}
              className="ml-auto text-xs font-bold text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
