'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    setLoading(true);

    if (isRegister) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        alert('Akun berhasil dibuat! Silakan login.');
        setIsRegister(false);
        setPassword('');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        router.push('/profile');
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col items-center justify-center min-h-screen relative bg-[#0a0a0c] overflow-y-auto z-0 p-4 py-10">
      {/* Background removed as requested */}

      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        {/* Form Card */}
        <div className="w-full bg-[#1e1e1e] rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2 text-center">
              Selamat Datang<br/>Kembali!
            </h1>
            <p className="text-zinc-400 text-sm">Silakan masuk untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Username atau Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan username atau email"
                  className="w-full px-4 py-3 rounded-lg bg-[#252525] border border-[#333] text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full px-4 py-3 rounded-lg bg-[#252525] border border-[#333] text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
              {!isRegister && (
                <div className="text-right mt-3">
                  <button type="button" className="text-zinc-300 text-sm hover:text-white transition-colors">
                    Lupa Password?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-[#007aff] hover:bg-blue-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'MEMPROSES...' : (isRegister ? 'Daftar' : 'Login')}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-700"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs">atau</span>
              <div className="flex-grow border-t border-zinc-700"></div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  setError(error);
                  setLoading(false);
                }
                // Jika sukses, browser akan ter-redirect ke Google
              }}
              disabled={loading}
              className="w-full py-3.5 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 52.749 L -8.284 52.749 C -8.574 53.879 -9.214 54.819 -10.144 55.449 L -10.144 57.779 L -6.244 57.779 C -3.964 55.679 -3.264 53.669 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.279 L -10.144 57.949 C -11.224 58.679 -12.754 59.169 -14.754 59.169 C -18.394 59.169 -21.484 56.709 -22.584 53.409 L -26.604 53.409 L -26.604 56.539 C -24.414 60.889 -19.954 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -22.584 53.409 C -22.864 52.569 -23.034 51.679 -23.034 50.739 C -23.034 49.799 -22.864 48.909 -22.584 48.069 L -22.584 44.939 L -26.604 44.939 C -27.464 46.659 -27.974 48.639 -27.974 50.739 C -27.974 52.839 -27.464 54.819 -26.604 56.539 L -22.584 53.409 Z"/>
                  <path fill="#EA4335" d="M -14.754 42.239 C -12.984 42.239 -11.404 42.849 -10.154 44.029 L -6.744 40.619 C -8.804 38.699 -11.514 37.569 -14.754 37.569 C -19.954 37.569 -24.414 39.919 -26.604 44.269 L -22.584 47.399 C -21.484 44.099 -18.394 42.239 -14.754 42.239 Z"/>
                </g>
              </svg>
              Lanjutkan dengan Google
            </button>
          </form>

          <div className="text-center text-sm text-zinc-400 mt-8">
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-[#00bfff] font-bold hover:underline"
            >
              {isRegister ? 'Login di sini' : 'Daftar di sini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
