'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Monitor, Users, Send, Search, Play, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Sidebar from '../components/Sidebar';

function NobarContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const hostId = searchParams.get('host');
  const initialUrl = searchParams.get('url');
  
  const { user } = useAuth();
  const [currentEpisode, setCurrentEpisode] = useState<string | null>(initialUrl);
  const [videoData, setVideoData] = useState<any>(null);
  
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  // Host Controls
  const isHost = user?.id === hostId;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Join Realtime Channel
  useEffect(() => {
    if (!roomId || !user) return;

    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState();
        const users = Object.values(newState).map((u: any) => u[0]);
        setParticipants(users);
      })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages((prev) => [...prev, payload]);
      })
      .on('broadcast', { event: 'CHANGE_VIDEO' }, ({ payload }) => {
        if (payload.episodeUrl) {
          setCurrentEpisode(payload.episodeUrl);
          setMessages((prev) => [...prev, {
            isSystem: true,
            text: `Host mengganti tontonan!`,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }
      })
      .on('broadcast', { event: 'REQUEST_SYNC' }, () => {
        // Jika host, kirim state saat ini ke user yang baru join
        if (isHost && currentEpisode) {
          roomChannel.send({
            type: 'broadcast',
            event: 'SYNC_STATE',
            payload: { episodeUrl: currentEpisode }
          });
        }
      })
      .on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => {
        if (!isHost && payload.episodeUrl) {
          setCurrentEpisode(payload.episodeUrl);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            id: user.id,
            name: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            avatar: user.user_metadata?.avatar_url || '/avatar.jpeg',
            isHost: isHost
          });
          
          if (!isHost) {
            // Minta state video dari host
            roomChannel.send({
              type: 'broadcast',
              event: 'REQUEST_SYNC',
              payload: {}
            });
          }
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, user, isHost]);

  // Fetch Video Data
  useEffect(() => {
    if (!currentEpisode) return;
    setVideoData(null);
    fetch(`/api/donghua/episode?id=${encodeURIComponent(currentEpisode)}`)
      .then(res => res.json())
      .then(data => setVideoData(data))
      .catch(console.error);
  }, [currentEpisode]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !channel || !user) return;
    
    const msg = {
      id: Date.now().toString(),
      user: {
        name: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        avatar: user.user_metadata?.avatar_url || '/avatar.jpeg',
        isHost: isHost
      },
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: msg
    });

    setMessages((prev) => [...prev, msg]);
    setChatInput('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/donghua/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data || []);
      setSelectedAnime(null);
    } catch(e) {
      console.error(e);
    }
    setSearching(false);
  };

  const loadEpisodes = async (slug: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/donghua/detail?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSelectedAnime(data);
      setEpisodes(data.episodes || []);
    } catch(e) {
      console.error(e);
    }
    setSearching(false);
  };

  const changeVideo = (epSlug: string) => {
    if (!isHost || !channel) return;
    
    // Broadcast perubahan ke semua
    channel.send({
      type: 'broadcast',
      event: 'CHANGE_VIDEO',
      payload: { episodeUrl: epSlug }
    });
    
    setCurrentEpisode(epSlug);
    setShowSearch(false);
    
    setMessages((prev) => [...prev, {
      isSystem: true,
      text: `Anda mengganti tontonan.`,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
  };

  if (!user) {
    return <div className="p-8 text-center bg-zinc-900 rounded-xl my-8">Silakan login untuk bergabung ke ruangan Nobar.</div>;
  }

  if (!roomId) {
    return <div className="p-8 text-center text-red-500 font-bold">Error: Room ID tidak valid.</div>;
  }

  const serverUrl = videoData?.servers?.[0]?.url || videoData?.defaultStreamingUrl;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[calc(100vh-100px)]">
      
      {/* KIRI: VIDEO PLAYER */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h1 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users size={20} className="text-purple-500" />
              Ruang Nobar Privat
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">ID: {roomId}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">| {isHost ? 'Anda adalah Host' : 'Anda adalah Penonton'}</span>
              <button 
 onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link ruangan berhasil disalin! Bagikan ke teman Anda.');
                }}
                className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-purple-600 hover:text-white px-2 py-1 rounded transition-colors"
              >
                Salin Link Room
              </button>
            </div>
          </div>
          {isHost && (
            <button onClick={() => setShowSearch(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors">
              Ganti Tontonan
            </button>
          )}
        </div>

        <div className="w-full aspect-video bg-black relative">
          {videoData && serverUrl ? (
            <>
              <iframe
                src={serverUrl}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
              <a 
                href={serverUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-colors text-xs font-semibold flex items-center gap-1.5 opacity-50 hover:opacity-100 z-10"
                title="Buka Video di Tab Baru"
              >
                <Monitor size={14} /> Buka di Tab Baru
              </a>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
              <Play size={48} className="mb-2 opacity-50" />
              <p>{videoData === null ? 'Memuat Video...' : 'Pilih video untuk mulai Nobar'}</p>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
           {videoData && (
             <div>
               <h2 className="text-xl font-bold mb-1 text-zinc-900 dark:text-zinc-100">{videoData.title}</h2>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Pastikan untuk berkoordinasi "Play/Pause" lewat chat jika menonton bersama.</p>
             </div>
           )}

           {/* Participants List */}
           <div className="mt-4">
             <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Users size={16}/> Kehadiran ({participants.length})</h3>
             <div className="flex flex-wrap gap-3">
               {participants.map((p, i) => (
                 <div key={i} className="flex flex-col items-center gap-1">
                   <div className={`relative w-10 h-10 rounded-full overflow-hidden ${p.isHost ? 'border-2 border-purple-500' : 'border border-zinc-300 dark:border-zinc-700'}`}>
                     <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
                     {p.isHost && <div className="absolute bottom-0 bg-purple-500 w-full text-[8px] text-center font-bold text-white leading-tight">HOST</div>}
                   </div>
                   <span className="text-[10px] text-zinc-500 truncate w-12 text-center">{p.name}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* SEARCH MODAL (Hanya untuk Host) */}
        {showSearch && isHost && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col p-4 sm:p-8 md:p-12 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 flex-1 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden max-w-5xl mx-auto w-full mt-14 sm:mt-0">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <h2 className="font-bold text-lg flex items-center gap-2"><Search size={18}/> Cari Tontonan</h2>
                <button onClick={() => setShowSearch(false)} className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik judul donghua..."
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-200 dark:border-zinc-700"
                  />
                  <button type="submit" disabled={searching} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50">
                    Cari
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-zinc-900">
                {searching && <div className="text-center p-4 text-zinc-500 animate-pulse">Sedang mencari...</div>}
                
                {!selectedAnime && searchResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {searchResults.map((item: any, i: number) => (
                      <button key={i} onClick={() => loadEpisodes(item.animeId)} className="text-left group cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 transition-colors flex flex-col">
                        <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900 w-full">
                          <img src={`/api/image-proxy?url=${encodeURIComponent(item.poster)}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-2 flex-1 flex items-center">
                          <h3 className="font-bold text-[11px] line-clamp-2 leading-tight">{item.title}</h3>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedAnime && (
                  <div>
                    <button onClick={() => setSelectedAnime(null)} className="mb-4 text-xs font-bold text-purple-500 flex items-center gap-1 hover:underline">
                       &larr; Kembali ke hasil pencarian
                    </button>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <img src={`/api/image-proxy?url=${encodeURIComponent(selectedAnime.poster)}`} className="w-24 h-36 object-cover rounded-lg shadow-md shrink-0" />
                      <div>
                        <h3 className="font-bold text-lg">{selectedAnime.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-4">{selectedAnime.synopsis}</p>
                      </div>
                    </div>
                    <h4 className="font-bold mb-3">Pilih Episode untuk di-Play:</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {episodes.map((ep: any, i: number) => {
                        const epNum = ep.title.match(/\d+/g)?.pop() || (episodes.length - i);
                        return (
                          <button 
 key={i} 
 onClick={() => changeVideo(ep.episodeId)}
                            className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-xs font-bold transition-colors text-center"
                          >
                            Ep {epNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* KANAN: LIVE CHAT */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 h-[60vh] lg:h-full">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Live Chat</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" ref={chatRef}>
          {messages.length === 0 && (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 opacity-50">
               <Send size={32} className="mb-2" />
               <p className="text-xs">Mulai mengobrol dengan penonton lain!</p>
             </div>
          )}
          
          {messages.map((m, i) => {
            if (m.isSystem) {
              return (
                <div key={i} className="flex justify-center my-2">
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <ShieldAlert size={10} /> {m.text}
                  </span>
                </div>
              );
            }

            const isMe = m.user?.name === (user?.user_metadata?.username || user?.email?.split('@')[0] || 'User');
            return (
              <div key={i} className={`flex gap-2 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                <img src={m.user?.avatar || '/avatar.jpeg'} className="w-6 h-6 rounded-full shrink-0 mt-1" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-zinc-500">{m.user?.name}</span>
                    {m.user?.isHost && <span className="text-[8px] bg-purple-500 text-white px-1 rounded font-bold">HOST</span>}
                    <span className="text-[9px] text-zinc-400">{m.time}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 bg-white dark:bg-zinc-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-200 dark:border-zinc-700"
            />
            <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 shrink-0 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors">
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default function NobarPage() {
  return (
    <>
      <div className="flex-1 min-w-0 p-4 sm:p-0">
        <Suspense fallback={<div className="p-8 text-center text-sm animate-pulse">Memuat Ruang Nobar...</div>}>
          <NobarContent />
        </Suspense>
      </div>
      <Sidebar />
    </>
  );
}
