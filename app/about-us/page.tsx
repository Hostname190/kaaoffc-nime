import React from 'react';
import { Info, Shield, Users, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'About Us | Kaaoffc',
  description: 'Pelajari lebih lanjut tentang Kaaoffc, platform streaming anime terbaik.',
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 md:px-8 w-full">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Tentang <span className="text-amber-500">Kaaoffc</span></h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Platform streaming anime terlengkap yang didedikasikan untuk membawa pengalaman menonton terbaik bagi para penggemar anime di seluruh dunia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Kualitas Terbaik</h3>
            <p className="text-zinc-400 leading-relaxed">
              Kami menyajikan anime dengan kualitas gambar terbaik, subtitle yang akurat, dan server streaming yang cepat tanpa buffering.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-blue-500/50 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Komunitas Aktif</h3>
            <p className="text-zinc-400 leading-relaxed">
              Bergabunglah dengan ribuan otaku lainnya di ruang obrolan, diskusikan episode terbaru, dan temukan teman dengan minat yang sama.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6">
              <Info size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Database Lengkap</h3>
            <p className="text-zinc-400 leading-relaxed">
              Ribuan judul anime, komik, dan novel ringan. Selalu di-update setiap hari untuk memastikan Anda tidak ketinggalan tren terbaru.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pengalaman Aman</h3>
            <p className="text-zinc-400 leading-relaxed">
              Kami memastikan pengalaman menjelajah yang bersih dari iklan yang mengganggu dan malware berbahaya demi kenyamanan pengguna.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Visi Kami</h2>
          <p className="text-zinc-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            Menjadi jembatan antara budaya pop Jepang dengan para penggemar di seluruh dunia, membangun platform di mana siapapun bisa menikmati dan merayakan anime bersama-sama.
          </p>
          <div className="inline-flex items-center justify-center">
            <img src="/logo.png" alt="Kaaoffc Logo" className="h-12 object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
