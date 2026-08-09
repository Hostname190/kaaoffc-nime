// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Pin, Volume2, MapPin, Smile, Send, BadgeCheck, Reply, Trash2, Pencil, PinOff, MoreVertical, Mic, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface GlobalChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalChat({ isOpen, onClose }: GlobalChatProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [editMessageId, setEditMessageId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  // Live user profiles cache for accurate level/exp display
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const safeIndex = pinnedMessages.length > 0 ? currentPinnedIndex % pinnedMessages.length : 0;
  const activePinnedMessage = pinnedMessages[safeIndex];

  // Auto scroll to bottom when opened
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [isOpen]);

  // Fetch & Subscribe
  useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('global_messages')
        .select('*')
        .order('created_at', { ascending: true }); // Get all messages

      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('public:global_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_messages' }, (payload) => {
        const newMsg = payload.new;
        setMessages((prev) => [...prev, newMsg]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_messages' }, (payload) => {
        const updatedMsg = payload.new;
        setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'global_messages' }, (payload) => {
        const deletedId = payload.old.id;
        setMessages((prev) => prev.filter(m => m.id !== deletedId));
      })
      .subscribe();

    // Setup Presence
    const roomChannel = supabase.channel('global_chat_presence', {
      config: {
        presence: {
          key: user ? user.id : Math.random().toString(),
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = roomChannel.presenceState();
        setOnlineCount(Object.keys(newState).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [isOpen, user]);

  // Fetch live user profiles for accurate level display
  useEffect(() => {
    if (messages.length === 0) return;
    const uniqueUserIds = [...new Set(messages.map(m => m.user_id).filter(Boolean))];
    // Only fetch profiles we don't already have
    const missingIds = uniqueUserIds.filter(id => !userProfiles[id]);
    if (missingIds.length === 0) return;

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, level, exp, display_name, username, avatar_url, role, is_verified')
        .in('id', missingIds);
      if (data && data.length > 0) {
        setUserProfiles(prev => {
          const updated = { ...prev };
          data.forEach(p => { updated[p.id] = p; });
          return updated;
        });
      }
    };
    fetchProfiles();
  }, [messages]);

  // Helper: get rank name from level
  const getRankName = (level: number) => {
    const ranks = ['Rookie', 'Veteran', 'Elite', 'Legend', 'Mythic'];
    return ranks[Math.min(Math.floor(level / 20), ranks.length - 1)];
  };

  // Helper: get live level text from profiles cache
  const getLiveLevelText = (msg: any) => {
    const profile = userProfiles[msg.user_id];
    if (profile) {
      const lvl = profile.level || 1;
      return `Lvl ${lvl} - ${getRankName(lvl)}`;
    }
    // Fallback to stored level_text if profile not loaded yet
    return msg.level_text || 'Lvl 1 - Rookie';
  };

  // Helper: get sender name from profile cache or fallback
  const getSenderName = (msg: any) => {
    if (!msg) return 'User';
    const profile = userProfiles[msg.user_id];
    return profile?.display_name || profile?.username || msg.display_name || msg.username || 'User';
  };

  // Helper: get sender avatar URL from profile cache or fallback
  const getSenderAvatar = (msg: any) => {
    if (!msg) return null;
    const profile = userProfiles[msg.user_id];
    return profile?.avatar_url || msg.avatar_url || null;
  };

  // Helper: get sender avatar initials text
  const getSenderAvatarText = (msg: any) => {
    return getSenderName(msg).substring(0, 2).toUpperCase();
  };

  // Handle Send Message
  const getBaseMsgData = () => {
    if (!user) return {};
    const username = user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User';
    const avatarText = username.substring(0, 2).toUpperCase();
    const metaRole = user.user_metadata?.role || 'User';
    const isVerifiedMeta = user.user_metadata?.is_verified || false;
    const isDeveloper = username.toLowerCase().includes('admin') || username.toLowerCase().includes('cs') || username.toLowerCase().includes('dev') || metaRole === 'Developer' || metaRole === 'Admin' || metaRole === 'Moderator' || isVerifiedMeta;
    
    let avatarColor = 'bg-zinc-700';
    let nameColor = 'text-zinc-100';
    let roleColor = 'text-zinc-500';
    let isVerified = false;

    // Get real level from profiles cache or user_metadata
    const cachedProfile = userProfiles[user.id];
    const realLevel = cachedProfile?.level || user.user_metadata?.level || 1;
    let levelText = `Lvl ${realLevel} - ${getRankName(realLevel)}`;

    if (isDeveloper) {
      nameColor = 'text-blue-400 font-bold';
      roleColor = 'bg-blue-600 text-white font-extrabold tracking-widest';
      levelText = `Lvl ${realLevel} - Developer`;
      isVerified = true;
    } else if (metaRole === 'VIP') {
      nameColor = 'text-yellow-500 font-bold';
      roleColor = 'bg-yellow-500 text-black font-bold';
      levelText = `Lvl ${realLevel} - VIP Member`;
      isVerified = true;
      avatarColor = 'bg-yellow-500 text-black';
    }

    return {
      user_id: user.id,
      username: username,
      avatar_text: avatarText,
      avatar_color: avatarColor,
      name_color: nameColor,
      roles: isDeveloper ? [metaRole && metaRole !== 'User' ? metaRole : 'Admin'] : [metaRole],
      role_color: roleColor,
      level_text: levelText,
      is_verified: isVerified,
      reply_to_username: replyTo ? replyTo.username : null,
      avatar_url: user.user_metadata?.avatar_url || null
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || isSending || cooldown > 0) return;
    
    const content = inputText;
    setInputText('');
    setReplyTo(null);
    setShowEmojiPicker(false);

    const msgData = {
      ...getBaseMsgData(),
      content: content,
      audio_url: null
    };

    setIsSending(true);

    if (editMessageId) {
      setMessages(prev => prev.map(m => m.id === editMessageId ? { ...m, content: content, is_edited: true } : m));
      setEditMessageId(null);
      await supabase.from('global_messages').update({ content: content, is_edited: true } as any).eq('id', editMessageId);
      setIsSending(false);
    } else {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData)
        });
        const data = await res.json();
        
        if (!res.ok) {
          alert(data.error || 'Gagal mengirim pesan.');
        } else {
          // Cooldown for 3 seconds
          setCooldown(3);
          const interval = setInterval(() => {
            setCooldown(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setIsSending(false);
      }
    }
  };

  // --- Voice Note Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioChunksRef.current.length > 0 && !isCancelledRef.current) {
          await handleSendAudio(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin di browser Anda.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      audioChunksRef.current = []; // Clear chunks so it doesn't upload
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleSendAudio = async (blob: Blob) => {
    if (!user) return;
    setIsUploadingAudio(true);
    try {
      const fileName = `${user.id}_${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('chat_media')
        .upload(fileName, blob, { contentType: 'audio/webm' });
      
      if (error) {
        console.error(error);
        throw new Error("Gagal upload file audio. Pastikan bucket 'chat_media' sudah dibuat dengan policy INSERT.");
      }

      const { data: publicUrlData } = supabase.storage
        .from('chat_media')
        .getPublicUrl(fileName);

      const audioUrl = publicUrlData.publicUrl;

      const msgData = {
        ...getBaseMsgData(),
        content: null,
        audio_url: audioUrl
      };

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData)
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Gagal mengirim voice note.');
        } else {
          // Cooldown for 3 seconds
          setCooldown(3);
          const interval = setInterval(() => {
            setCooldown(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to send audio:', err);
      }
      setReplyTo(null);
    } catch (err: any) {
      console.error("Error uploading audio:", err);
      alert(err.message || "Gagal mengirim pesan suara.");
    } finally {
      setIsUploadingAudio(false);
    }
  };
  // ------------------------

  const handleDeleteMessage = async (id: number) => {
    if (!confirm('Hapus pesan ini?')) return;
    const originalMessages = messages;
    setMessages((prev) => prev.filter(m => m.id !== id));
    const { error } = await supabase.from('global_messages').delete().eq('id', id);
    if (error) {
      console.error("Error deleting message:", error);
      setMessages(originalMessages);
    }
  };

  const handlePinMessage = async (msg: any) => {
    const isCurrentlyPinned = msg.is_pinned;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !isCurrentlyPinned } : m));
    const { error } = await supabase.from('global_messages').update({ is_pinned: !isCurrentlyPinned } as any).eq('id', msg.id);
    if (error) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: isCurrentlyPinned } : m));
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText(prev => prev + emojiData.emoji);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Extract unique users for mentions
  const uniqueUsers = Array.from(new Set(messages.map(m => getSenderName(m))));
  const filteredUsers = mentionSearch !== null 
    ? uniqueUsers.filter(u => String(u).toLowerCase().includes(mentionSearch.toLowerCase())).slice(0, 5)
    : [];

  const metaRoleGlobal = user?.user_metadata?.role || 'User';
  const usernameGlobal = user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const isGlobalAdmin = usernameGlobal.toLowerCase().includes('admin') || usernameGlobal.toLowerCase().includes('cs') || usernameGlobal.toLowerCase().includes('dev') || metaRoleGlobal === 'Developer' || metaRoleGlobal === 'Admin' || metaRoleGlobal === 'Moderator';

  const handleClearAllChat = async () => {
    if (!user) return;
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA pesan chat? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const res = await fetch(`/api/chat/clear?userId=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus semua pesan.');
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus pesan.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full sm:w-[400px] md:w-[450px] bg-[#1B1D2A] h-[95vh] sm:h-[85vh] flex flex-col sm:rounded-2xl shadow-2xl overflow-hidden border border-[#2A2C40]/50 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-4 py-3 bg-[#6C7AEC] text-white shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="fill-white" size={24} />
            <h2 className="font-bold text-lg tracking-wide">Chat</h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/chat"
              onClick={() => onClose()}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors mr-1"
              title="Pesan Pribadi"
            >
              <MessageSquare size={16} className="text-white" />
            </Link>
            {isGlobalAdmin && (
              <button 
                onClick={handleClearAllChat}
                className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500 flex items-center justify-center transition-colors mr-1"
                title="Hapus Semua Chat (Admin Only)"
              >
                <Trash2 size={14} className="text-red-400 hover:text-white" />
              </button>
            )}
            <button 
              onClick={() => setShowOnlyPinned(!showOnlyPinned)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showOnlyPinned ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-white/20 hover:bg-white/30'}`}
              title={showOnlyPinned ? "Tampilkan Semua Pesan" : "Filter Pesan Pinned"}
            >
              <Pin size={16} className={showOnlyPinned ? "fill-black text-black" : "fill-white text-white"} />
            </button>
            <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <Volume2 size={16} className="fill-white" />
            </button>
            
            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-2 py-1.5 rounded text-[10px] font-bold border border-white/20">
              <div className="w-3 h-3 border border-white/40 flex items-center justify-center rounded-sm text-[8px]">🖼</div>
              <span>Auto</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full text-xs font-bold border border-black/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>{onlineCount} ON</span>
            </div>
            
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors ml-1">
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {activePinnedMessage && (
          <div 
            className="bg-[#2D2A1C] border-b border-[#3D3A2C] px-4 py-2 flex items-start gap-3 shrink-0 cursor-pointer hover:bg-[#363222] transition-colors relative group"
            onClick={() => {
              document.getElementById(`message-${activePinnedMessage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setCurrentPinnedIndex((prev) => prev + 1);
            }}
            title="Klik untuk melihat pesan, atau lanjut ke pesan pin berikutnya"
          >
            <Pin size={14} className="text-yellow-500 fill-yellow-500 mt-1 shrink-0" />
            <div className="flex-1 min-w-0 pr-8">
              <div className="text-yellow-500 text-[10px] font-bold tracking-wider mb-0.5">PINNED MESSAGE</div>
              <div className="text-xs text-zinc-300 truncate">
                <span className="font-bold text-white">{getSenderName(activePinnedMessage)}:</span> {activePinnedMessage.content}
              </div>
            </div>
            {pinnedMessages.length > 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                {safeIndex + 1}/{pinnedMessages.length}
              </div>
            )}
          </div>
        )}
        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#12131C]">
          
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 custom-scrollbar">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
                Belum ada obrolan. Jadilah yang pertama!
              </div>
            ) : (
              (showOnlyPinned ? pinnedMessages : messages).map((msg, idx) => {
              const roles = msg.roles || [];
              const isDevRole = roles.some((r: string) => r.toLowerCase().includes('dev') || r.toLowerCase().includes('admin') || r.toLowerCase().includes('owner') || r.toLowerCase().includes('mod'));
              const isVip = roles.some((r: string) => r.toUpperCase() === 'VIP');
              const isVerified = msg.is_verified || isDevRole || isVip;

              let nameColor = 'text-zinc-200';
              let avatarColor = 'bg-zinc-700 text-zinc-100';
              let roleColor = 'text-zinc-500';

              if (isDevRole) {
                nameColor = 'text-blue-400 font-bold';
                avatarColor = 'bg-blue-600 text-white border-2 border-blue-400';
                roleColor = 'bg-blue-600 text-white font-extrabold tracking-widest';
              } else if (isVip) {
                nameColor = 'text-yellow-500 font-bold';
                avatarColor = 'bg-yellow-500 text-black';
                roleColor = 'bg-yellow-500 text-black font-bold';
              } else {
                avatarColor = msg.avatar_color || 'bg-zinc-700 text-zinc-100';
                roleColor = msg.role_color || 'text-zinc-500';
                nameColor = msg.name_color || 'text-zinc-200';
              }

              // Check if current user is owner or developer
              const isOwner = user?.id === msg.user_id;
              // Global Developer Check
              const currentUsername = user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
              const currentMetaRole = user?.user_metadata?.role || 'User';
              const isCurrentUserDev = currentUsername.toLowerCase().includes('admin') || currentUsername.toLowerCase().includes('cs') || currentUsername.toLowerCase().includes('dev') || currentMetaRole === 'Developer' || currentMetaRole === 'Admin' || currentMetaRole === 'Moderator';

              return (
                <div 
                  id={`message-${msg.id}`}
                  key={msg.id} 
                  className="flex gap-3 items-start group relative"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                  }}
                >
                  {/* Avatar */}
                  {getSenderAvatar(msg) && !imageErrors[msg.id] ? (
                    <img 
                      src={getSenderAvatar(msg)!} 
                      alt={getSenderName(msg)} 
                      className={`w-10 h-10 rounded-full object-cover shrink-0 shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${isDevRole ? 'border-2 border-blue-500 p-[1px]' : ''}`} 
                      onClick={() => router.push(`/user/${msg.user_id}`)} 
                      onError={() => {
                        setImageErrors(prev => ({ ...prev, [msg.id]: true }));
                      }} 
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor} shadow-sm cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => router.push(`/user/${msg.user_id}`)}>
                      {getSenderAvatarText(msg)}
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            className={`font-bold text-sm cursor-pointer hover:underline ${nameColor}`}
                            onClick={() => router.push(`/user/${msg.user_id}`)}
                          >
                            {getSenderName(msg)}
                          </span>
                          {isVerified && (
                            <BadgeCheck size={14} className="text-[#1B1D2A] fill-blue-500 ml-0.5" />
                          )}
                          {roles.map((role: string, rIdx: number) => (
                            <span key={rIdx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${roleColor}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium mt-0.5">
                          {getLiveLevelText(msg)}
                        </span>
                      </div>
                      
                      {/* Badges & Time */}
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        <div className="flex items-center gap-1 hidden sm:flex">
                          <span className="text-[9px] border border-zinc-700/80 bg-zinc-800/30 text-zinc-500 px-1 rounded font-medium">ID</span>
                          <span className="text-[9px] border border-zinc-700/80 bg-zinc-800/30 text-zinc-500 px-1 rounded font-medium">EN</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-medium">{formatTime(msg.created_at)}</span>
                        
                        {/* 3-Dot Menu Button */}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                            }}
                            className="p-1 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Lainnya"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === msg.id && (
                            <>
                              {/* Click-away overlay */}
                              <div 
                                className="fixed inset-0 z-[60]" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                              />
                              <div className="absolute right-0 top-full mt-1 w-32 bg-[#232536] border border-[#2A2C40] rounded-md shadow-xl z-[70] py-1 flex flex-col overflow-hidden">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setReplyTo(msg); setActiveMenuId(null); }}
                                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#2D3154] hover:text-white flex items-center gap-2"
                                >
                                  <Reply size={12} /> Balas
                                </button>
                                
                                {isOwner && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setInputText(msg.content); setEditMessageId(msg.id); setActiveMenuId(null); }}
                                    className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#2D3154] hover:text-blue-400 flex items-center gap-2"
                                  >
                                    <Pencil size={12} /> Edit
                                  </button>
                                )}
                                
                                {(isOwner || isCurrentUserDev) && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); setActiveMenuId(null); }}
                                    className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#2D3154] hover:text-red-400 flex items-center gap-2"
                                  >
                                    <Trash2 size={12} /> Hapus
                                  </button>
                                )}
                                
                                {isCurrentUserDev && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handlePinMessage(msg); setActiveMenuId(null); }}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#2D3154] ${msg.is_pinned ? 'text-yellow-500 hover:text-yellow-400' : 'text-zinc-300 hover:text-yellow-500'}`}
                                  >
                                    {msg.is_pinned ? <><PinOff size={12} /> Unpin</> : <><Pin size={12} /> Pin</>}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reply Context & Content */}
                    <div className="mt-1.5 flex items-end gap-2 w-full">
                      <div className="w-full flex-1">
                        {msg.reply_to_username && (
                          <div className="mb-1">
                            <span className="bg-[#2D3154]/60 text-[#6C7AEC] px-1.5 py-0.5 rounded text-xs cursor-pointer hover:underline font-medium border border-indigo-500/20 inline-block">
                              @{msg.reply_to_username}
                            </span>
                          </div>
                        )}
                        {msg.audio_url ? (
                          <div className="mt-1">
                            <audio controls src={msg.audio_url} className="h-8 max-w-full sm:max-w-[250px] rounded-full" />
                          </div>
                        ) : (
                          <p className="text-[13px] text-zinc-200 leading-snug break-words whitespace-pre-wrap w-full overflow-hidden">
                            {msg.content.split(/(\s+)/).map((word: string, i: number) => {
                              if (word.startsWith('@') && word.length > 1) {
                                return <span key={i} className="text-indigo-400 font-bold hover:underline cursor-pointer">{word}</span>;
                              }
                              return <span key={i}>{word}</span>;
                            })}
                          </p>
                        )}
                      </div>
                      {msg.is_edited && !msg.audio_url && (
                        <span className="text-[9px] text-zinc-500 italic shrink-0 mb-1">(diedit)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#1B1D2A] border-t border-[#2A2C40]/50 shrink-0 relative">
          
          {/* Edit Indicator Box */}
          {editMessageId && (
            <div className="absolute bottom-[100%] left-0 right-0 bg-[#232536] border-t border-[#2A2C40] px-4 py-2 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400">Mengedit pesan...</span>
              </div>
              <button onClick={() => {
                setEditMessageId(null);
                setInputText('');
              }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={14} className="text-zinc-400" />
              </button>
            </div>
          )}

          {/* Reply Indicator Box */}
          {replyTo && !editMessageId && (
            <div className="absolute bottom-[100%] left-0 right-0 bg-[#232536] border-t border-[#2A2C40] px-4 py-2 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400">Membalas </span>
                <span className="text-indigo-400 font-bold">@{getSenderName(replyTo)}</span>
                <p className="text-zinc-500 truncate max-w-[250px]">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={14} className="text-zinc-400" />
              </button>
            </div>
          )}

          {/* Mention Picker Popup */}
          {mentionSearch !== null && filteredUsers.length > 0 && (
            <div className="absolute bottom-[100%] left-0 right-0 bg-[#232536] border-t border-x border-[#2A2C40] max-h-40 overflow-y-auto shadow-2xl z-50 sm:rounded-t-lg custom-scrollbar">
              {filteredUsers.map((u: any, i: number) => (
                <div 
                  key={i} 
                  className="px-4 py-2.5 hover:bg-[#2D3154] cursor-pointer text-sm text-zinc-200 border-b border-[#2A2C40]/50 flex items-center gap-2 transition-colors"
                  onClick={() => {
                    setInputText(prev => prev.replace(/@[a-zA-Z0-9_]*$/, `@${u} `));
                    setMentionSearch(null);
                  }}
                >
                  <span className="text-indigo-400 font-bold">@</span>{u}
                </div>
              ))}
            </div>
          )}

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-[100%] left-0 z-50 mb-2 shadow-2xl">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme="dark" as any 
                lazyLoadEmojis={true}
                searchDisabled={true}
                skinTonesDisabled={true}
                width={300}
                height={350}
              />
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="p-1 sm:p-2 text-zinc-400 hover:text-white transition-colors bg-[#232536] rounded-lg border border-zinc-700/30">
              <MapPin size={20} className="fill-zinc-400/20" />
            </button>
            <button 
              className={`p-1 sm:p-2 transition-colors rounded-lg border border-zinc-700/30 ${showEmojiPicker ? 'bg-indigo-500 text-white' : 'bg-[#232536] text-zinc-400 hover:text-white'}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={20} className={showEmojiPicker ? '' : 'fill-zinc-400/20'} />
            </button>
            
            {isRecording ? (
              <div className="flex-1 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 text-red-500 text-sm font-bold animate-pulse">
                  <Mic size={16} className="fill-current" />
                  Merekam... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
                <button onClick={cancelRecording} className="text-red-400 hover:text-red-300 transition-colors" title="Batal Rekam">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="flex-1 bg-[#232536] rounded-full border border-zinc-700/50 flex items-center px-4 py-2.5">
                <input 
                  type="text" 
                  placeholder="Ketik pesan..." 
                  className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-500"
                  value={inputText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInputText(val);
                    
                    // Detect @ mention
                    const match = val.match(/@([a-zA-Z0-9_]*)$/);
                    if (match) {
                      setMentionSearch(match[1]);
                    } else {
                      setMentionSearch(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputText.trim()) {
                      handleSendMessage();
                    }
                  }}
                />
              </div>
            )}
            
            {isRecording ? (
              <button 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                onClick={stopRecording}
                title="Kirim Pesan Suara"
              >
                <Send size={16} className="-ml-1 fill-current" />
              </button>
            ) : inputText.trim() ? (
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isSending || cooldown > 0}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-indigo-600/30"
              >
                {cooldown > 0 ? <span className="font-bold text-xs">{cooldown}s</span> : <Send size={20} className="ml-1" />}
              </button>
            ) : (
              <button 
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${!user || isUploadingAudio ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#2A2C40] text-zinc-400 hover:bg-[#3D3A2C] hover:text-[#6C7AEC]'}`}
                onClick={startRecording}
                disabled={!user || isUploadingAudio}
                title="Rekam Pesan Suara"
              >
                {isUploadingAudio ? (
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Mic size={18} />
                )}
              </button>
            )}
          </div>
          {!user && (
            <div className="mt-2 text-center text-[10px] text-zinc-500">
              Silakan login terlebih dahulu untuk ikut obrolan
            </div>
          )}
        </div>
        
        </div>
        
      </div>
    </div>
  );
}
