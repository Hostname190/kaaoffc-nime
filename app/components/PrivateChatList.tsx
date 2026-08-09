'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function PrivateChatList({ user, selectedChatId, onSelectChat }: { user: any, selectedChatId?: string, onSelectChat: (chat: any) => void }) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchNewUser, setSearchNewUser] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [searchingUser, setSearchingUser] = useState(false);

  // Fetch chats
  useEffect(() => {
    if (!user) return;
    
    const fetchChats = async () => {
      // get chats where user1_id = me or user2_id = me
      const { data, error } = await supabase
        .from('private_chats')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_time', { ascending: false, nullsFirst: false });
        
      if (!error && data) {
        // fetch user profiles for the other person
        const otherUserIds = data.map(c => c.user1_id === user.id ? c.user2_id : c.user1_id);
        
        if (otherUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', otherUserIds);
            
          const profilesMap = (profiles || []).reduce((acc: any, p: any) => ({...acc, [p.id]: p}), {});
          
          const enrichedChats = data.map(c => ({
            ...c,
            other_user: profilesMap[c.user1_id === user.id ? c.user2_id : c.user1_id]
          })).filter(c => c.other_user); // ensure profile exists
          
          setChats(enrichedChats);
        } else {
          setChats([]);
        }
      }
      setLoading(false);
    };
    
    fetchChats();

    // Subscribe to changes in chats (new chats or updated last_message)
    const channel = supabase.channel('private_chats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_chats', filter: `user1_id=eq.${user.id}` }, fetchChats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_chats', filter: `user2_id=eq.${user.id}` }, fetchChats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Search new users to start chat
  useEffect(() => {
    if (searchNewUser.length < 2) {
      setFoundUsers([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setSearchingUser(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${searchNewUser}%`)
        .neq('id', user.id)
        .limit(10);
      setFoundUsers(data || []);
      setSearchingUser(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchNewUser, user.id]);

  const handleStartNewChat = async (otherUser: any) => {
    setShowNewChat(false);
    setSearchNewUser('');
    
    // Check if chat already exists
    const existing = chats.find(c => c.other_user.id === otherUser.id);
    if (existing) {
      onSelectChat(existing);
      return;
    }

    // Create new chat
    // Ensure consistent ordering to avoid duplicate pairs (user1 < user2 by UUID string)
    const u1 = user.id < otherUser.id ? user.id : otherUser.id;
    const u2 = user.id < otherUser.id ? otherUser.id : user.id;

    const { data, error } = await supabase
      .from('private_chats')
      .insert({ user1_id: u1, user2_id: u2, last_message_time: new Date().toISOString() })
      .select()
      .single();
      
    if (data) {
      const newChat = { ...data, other_user: otherUser };
      setChats([newChat, ...chats]);
      onSelectChat(newChat);
    }
  };

  const filteredChats = chats.filter(c => (c.other_user.display_name || c.other_user.username || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] relative">
      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-800 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Cari obrolan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-full pl-9 pr-4 py-2 text-sm border border-zinc-800 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button 
            onClick={() => setShowNewChat(true)}
            className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center hover:bg-amber-500 transition-colors shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" size={24} /></div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 text-sm">
            {search ? 'Tidak ada obrolan yang cocok.' : 'Belum ada obrolan. Klik tombol + untuk memulai!'}
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredChats.map(chat => {
              const isActive = selectedChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`flex items-center gap-3 p-3 w-full text-left transition-colors border-b border-zinc-800/50 ${isActive ? 'bg-zinc-800/80' : 'hover:bg-zinc-900'}`}
                >
                  {chat.other_user.avatar_url ? (
                    <img src={chat.other_user.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0 bg-zinc-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <UserIcon size={24} className="text-zinc-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-white truncate text-sm">{chat.other_user.display_name || chat.other_user.username || 'Pengguna'}</h3>
                      {chat.last_message_time && (
                        <span className="text-[10px] text-zinc-500 shrink-0 ml-2">
                          {formatDistanceToNow(new Date(chat.last_message_time), { addSuffix: true, locale: idLocale })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {chat.last_message || 'Mulai percakapan...'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal / Drawer */}
      {showNewChat && (
        <div className="absolute inset-0 bg-[#0a0a0a] z-10 flex flex-col animate-in slide-in-from-right-2">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900">
            <button onClick={() => setShowNewChat(false)} className="p-2 hover:bg-zinc-800 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-bold">Mulai Obrolan Baru</h2>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Cari nama pengguna..."
                value={searchNewUser}
                onChange={e => setSearchNewUser(e.target.value)}
                autoFocus
                className="w-full bg-zinc-900 text-white rounded-lg pl-9 pr-4 py-3 text-sm border border-zinc-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchingUser ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" size={24} /></div>
            ) : foundUsers.length > 0 ? (
              <div className="flex flex-col">
                {foundUsers.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => handleStartNewChat(u)}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-900 w-full text-left"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                        <UserIcon size={20} className="text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm text-white">{u.display_name || u.username || 'Pengguna'}</div>
                      <div className="text-xs text-amber-500">{u.role || 'User'}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchNewUser.length >= 2 ? (
              <div className="text-center p-8 text-zinc-500 text-sm">Pengguna tidak ditemukan.</div>
            ) : (
              <div className="text-center p-8 text-zinc-500 text-sm">Ketik nama untuk mencari...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
