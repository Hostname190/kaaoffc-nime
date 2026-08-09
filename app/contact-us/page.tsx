'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send } from 'lucide-react';

export default function ContactUsPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending
    setTimeout(() => {
      setIsSubmitted(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 md:px-8 w-full">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Hubungi <span className="text-amber-500">Kami</span></h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Punya pertanyaan, saran, atau menemukan bug? Jangan ragu untuk menghubungi kami melalui formulir di bawah ini atau lewat sosial media kami.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4">
                <Mail size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Email</h3>
              <p className="text-zinc-400 text-sm">support@kaaoffc.com</p>
              <p className="text-zinc-500 text-xs mt-1">Kami membalas dalam 24 jam</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Discord</h3>
              <p className="text-zinc-400 text-sm">Join Server Kami</p>
              <p className="text-zinc-500 text-xs mt-1">Ngobrol langsung dengan admin</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lokasi</h3>
              <p className="text-zinc-400 text-sm">Indonesia</p>
              <p className="text-zinc-500 text-xs mt-1">Virtual Team</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6">Kirim Pesan</h2>
              
              {isSubmitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Pesan Terkirim!</h3>
                  <p>Terima kasih telah menghubungi kami. Tim kami akan segera menindaklanjuti pesan Anda.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-zinc-300 mb-2">Nama Anda</label>
                      <input 
                        type="text" 
                        required
                        value={formState.name}
                        onChange={e => setFormState({...formState, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-300 mb-2">Email Anda</label>
                      <input 
                        type="email" 
                        required
                        value={formState.email}
                        onChange={e => setFormState({...formState, email: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-2">Subjek</label>
                    <input 
                      type="text" 
                      required
                      value={formState.subject}
                      onChange={e => setFormState({...formState, subject: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Laporan Bug / Saran / Pertanyaan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-2">Pesan</label>
                    <textarea 
                      required
                      rows={6}
                      value={formState.message}
                      onChange={e => setFormState({...formState, message: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      placeholder="Tulis pesan Anda di sini..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Send size={18} />
                    Kirim Pesan
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
