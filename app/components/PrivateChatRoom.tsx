'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Search, Loader2, X, Film, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Link from 'next/link';

export default function PrivateChatRoom({ user, chat, onBack }: { user: any, chat: any, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Anime Recommendation State
  const [showAnimeSearch, setShowAnimeSearch] = useState(false);
  const [animeSearchQuery, setAnimeSearchQuery] = useState('');
  const [searchingAnime, setSearchingAnime] = useState(false);
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setMessages(data);
      scrollToBottom();
      
      // Mark unread messages as read
      const unreadIds = data.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('private_messages').update({ is_read: true }).in('id', unreadIds);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase.channel(`chat_${chat.id}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `chat_id=eq.${chat.id}` }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates (from optimistic update)
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        scrollToBottom();
        if (payload.new.receiver_id === user.id) {
          supabase.from('private_messages').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'private_messages', filter: `chat_id=eq.${chat.id}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat.id, user.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedAnime) || sending) return;
    
    setSending(true);
    const content = inputText.trim();
    
    const newMessage: any = {
      chat_id: chat.id,
      sender_id: user.id,
      receiver_id: chat.other_user.id,
      content: content || 'Merekomendasikan Anime',
      anime_url: selectedAnime?.slug ? `/nonton/${selectedAnime.slug}` : null,
      anime_title: selectedAnime?.title || null,
      anime_poster: selectedAnime?.cover_url || null,
      is_read: false
    };

    // Clear input immediately
    setInputText('');
    const sentAnime = selectedAnime;
    setSelectedAnime(null);
    setShowAnimeSearch(false);

    // Optimistic update: add the message to state immediately
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      ...newMessage,
      id: tempId,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    // Actually insert to database
    const { data, error } = await supabase.from('private_messages').insert(newMessage).select().single();
    
    if (!error && data) {
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      
      await supabase.from('private_chats').update({ 
        last_message: content || `Merekomendasikan: ${sentAnime?.title}`,
        last_message_time: new Date().toISOString()
      }).eq('id', chat.id);
    } else {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    setSending(false);
  };

  // Anime search
  useEffect(() => {
    if (animeSearchQuery.length < 2) {
      setAnimeResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchingAnime(true);
      const { data } = await supabase
        .from('novels')
        .select('id, title, slug, cover_url, genres')
        .ilike('title', `%${animeSearchQuery}%`)
        .limit(10);
      setAnimeResults(data || []);
      setSearchingAnime(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [animeSearchQuery]);

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: idLocale });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] sm:bg-[#121212] relative overflow-hidden">
      {/* Header - fixed, never scrolls */}
      <div className="flex items-center gap-3 p-3 bg-zinc-900 border-b border-zinc-800 shrink-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <Link href={`/user/${chat.other_user.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
          {chat.other_user.avatar_url ? (
            <img src={chat.other_user.avatar_url} className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800" />
          )}
          <div>
            <h2 className="font-bold text-white leading-tight">{chat.other_user.display_name || chat.other_user.username || 'Pengguna'}</h2>
            <div className="text-xs text-amber-500">{chat.other_user.role || 'User'}</div>
          </div>
        </Link>
      </div>

      {/* Messages Area - this is the only scrollable part */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar relative">
        {/* Background Image - blurred and darkened */}
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ top: '56px' }}>
          <img src="/chat-bg.jpg" alt="" className="w-full h-full object-cover" style={{ filter: 'blur(8px) brightness(0.2)', transform: 'scale(1.1)' }} />
        </div>
        <div className="relative z-[1] flex flex-col gap-3 flex-1">
        {loading ? (
          <div className="flex justify-center flex-1 items-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            Mulai percakapan dengan {chat.other_user.display_name || chat.other_user.username || 'Pengguna'}...
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-lg ${isMe ? 'bg-amber-600 text-white rounded-br-sm' : 'bg-zinc-800 text-white rounded-bl-sm'}`}>
                  
                  {/* Anime Recommendation Card */}
                  {msg.anime_url && (
                    <Link href={msg.anime_url} className="block mb-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden transition-colors">
                      <div className="flex items-center gap-3 p-2">
                        {msg.anime_poster ? (
                          <img src={msg.anime_poster} alt="Poster" className="w-12 h-16 object-cover rounded shadow-sm" />
                        ) : (
                          <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center shrink-0">
                            <Film size={20} className="text-zinc-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-[10px] font-bold text-amber-400 mb-1">REKOMENDASI ANIME</div>
                          <div className="text-sm font-bold truncate">{msg.anime_title}</div>
                          <div className="text-xs text-amber-500/80 mt-1 flex items-center gap-1">Klik untuk Nonton <ArrowLeft size={10} className="rotate-180" /></div>
                        </div>
                      </div>
                    </Link>
                  )}

                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-amber-200' : 'text-zinc-400'}`}>
                    <span className="text-[10px]">{formatMessageTime(msg.created_at)}</span>
                    {isMe && (
                      msg.is_read ? <CheckCheck size={14} className="text-blue-300" /> : <Check size={14} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        </div>{/* close z-[1] wrapper */}
      </div>

      {/* Anime Search Drawer */}
      {showAnimeSearch && (
        <div className="absolute bottom-[60px] left-0 right-0 bg-zinc-900 border-t border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20 flex flex-col h-[300px]">
          <div className="flex items-center justify-between p-3 border-b border-zinc-800 shrink-0">
            <h3 className="font-bold text-amber-500 text-sm flex items-center gap-2"><Film size={16} /> Cari Anime</h3>
            <button onClick={() => {setShowAnimeSearch(false); setSelectedAnime(null);}} className="text-zinc-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-3 border-b border-zinc-800 relative shrink-0">
            <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Ketik judul anime..."
              value={animeSearchQuery}
              onChange={e => setAnimeSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 text-white rounded-lg pl-10 pr-4 py-2 text-sm border border-zinc-800 focus:border-amber-500 outline-none"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {searchingAnime ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-amber-500" size={20} /></div>
            ) : animeResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {animeResults.map(anime => (
                  <button 
                    key={anime.id}
                    onClick={() => { setSelectedAnime(anime); setShowAnimeSearch(false); }}
                    className="flex items-center gap-3 p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-left transition-colors"
                  >
                    <img src={anime.cover_url || '/placeholder.jpg'} className="w-10 h-14 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-white line-clamp-1">{anime.title}</div>
                      <div className="text-xs text-zinc-400 line-clamp-1">{anime.genres?.join(', ')}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : animeSearchQuery.length >= 2 ? (
              <div className="text-center p-4 text-zinc-500 text-sm">Tidak ditemukan.</div>
            ) : null}
          </div>
        </div>
      )}

      {/* Input Area - fixed at bottom, never scrolls */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-2 sm:p-3 shrink-0 z-10">
        
        {/* Selected Anime Preview */}
        {selectedAnime && (
          <div className="mb-2 bg-zinc-800 p-2 rounded-lg flex items-center justify-between border border-amber-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <img src={selectedAnime.cover_url} className="w-8 h-10 object-cover rounded shadow-sm" />
              <div className="truncate">
                <div className="text-[10px] text-amber-500 font-bold">AKAN MEREKOMENDASIKAN</div>
                <div className="text-sm font-bold text-white truncate">{selectedAnime.title}</div>
              </div>
            </div>
            <button onClick={() => setSelectedAnime(null)} className="p-1 text-zinc-400 hover:text-white bg-zinc-700/50 rounded-full ml-2 shrink-0"><X size={14} /></button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <button 
            type="button"
            onClick={() => setShowAnimeSearch(!showAnimeSearch)}
            className={`p-3 rounded-full shrink-0 transition-colors ${showAnimeSearch || selectedAnime ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-amber-500 hover:bg-zinc-700'}`}
            title="Rekomendasikan Anime"
          >
            <Film size={20} />
          </button>
          <div className="flex-1 bg-zinc-800 rounded-2xl flex items-center border border-zinc-700 focus-within:border-amber-500 transition-colors overflow-hidden">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={selectedAnime ? "Tambahkan pesan..." : "Ketik pesan..."}
              className="w-full bg-transparent text-white px-4 py-3 text-sm focus:outline-none resize-none max-h-32 min-h-[44px] custom-scrollbar"
              rows={1}
              style={{
                height: inputText ? `${Math.min(120, Math.max(44, inputText.split('\n').length * 20 + 24))}px` : '44px'
              }}
            />
          </div>
          <button 
            type="submit"
            disabled={(!inputText.trim() && !selectedAnime) || sending}
            className="w-11 h-11 rounded-full bg-amber-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-zinc-800 shrink-0 hover:bg-amber-500 transition-colors"
          >
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} className="-ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
