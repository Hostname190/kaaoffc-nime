'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      // Login berhasil, simpan session
      sessionStorage.setItem('kaaoffc_admin_auth', 'true');
      router.push('/admin');
    } else {
      setError('Password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/welcome-logo.png" alt="Kaaoffc" className="w-16 h-16 mx-auto mb-4 object-contain" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
          <h1 className="text-2xl font-bold text-white mb-2">Login Admin Kaaoffc</h1>
          <p className="text-zinc-400">Masukkan password untuk mengakses panel admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Masuk
              <ArrowRight size={16} />
            </button>
            
            <Link 
              href="/"
              className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"
            >
              <Home size={16} />
              Kembali ke Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
