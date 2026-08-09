'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PrivateChatList from '../components/PrivateChatList';
import PrivateChatRoom from '../components/PrivateChatRoom';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-open chat room if ?user=<id> is provided (from profile page)
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    if (!targetUserId || !user || initLoading) return;

    const openChatWithUser = async () => {
      setInitLoading(true);

      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (!targetProfile) {
        setInitLoading(false);
        return;
      }

      const u1 = user.id < targetUserId ? user.id : targetUserId;
      const u2 = user.id < targetUserId ? targetUserId : user.id;

      const { data: existingChat } = await supabase
        .from('private_chats')
        .select('*')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .single();

      if (existingChat) {
        setSelectedChat({ ...existingChat, other_user: targetProfile });
      } else {
        const { data: newChat } = await supabase
          .from('private_chats')
          .insert({ user1_id: u1, user2_id: u2, last_message_time: new Date().toISOString() })
          .select()
          .single();

        if (newChat) {
          setSelectedChat({ ...newChat, other_user: targetProfile });
        }
      }
      setInitLoading(false);
    };

    openChatWithUser();
  }, [user, searchParams]);

  if (loading || initLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-amber-500" size={32} />
          {initLoading && <p className="text-zinc-400 text-sm">Membuka obrolan...</p>}
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  const showList = !isMobile || (isMobile && !selectedChat);
  const showRoom = !isMobile || (isMobile && selectedChat);

  return (
    <div className="fixed inset-0 top-[56px] sm:top-[64px] bottom-0 flex bg-[#0a0a0a] text-white overflow-hidden z-40">
      
      {/* Left Panel: Chat List */}
      {showList && (
        <div className={`flex flex-col border-r border-zinc-800 ${isMobile ? 'w-full' : 'w-[350px] lg:w-[400px]'}`}>
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <h1 className="text-lg font-bold text-amber-500">Pesan Pribadi</h1>
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors sm:hidden"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
          
          <PrivateChatList 
            user={user} 
            selectedChatId={selectedChat?.id} 
            onSelectChat={(chat) => setSelectedChat(chat)} 
          />
        </div>
      )}

      {/* Right Panel: Chat Room */}
      {showRoom && (
        <div className="flex-1 flex flex-col bg-[#121212]">
          {selectedChat ? (
            <PrivateChatRoom 
              user={user} 
              chat={selectedChat} 
              onBack={() => setSelectedChat(null)} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <MessageSquare size={64} className="mb-4 opacity-50" />
              <h2 className="text-xl font-medium text-zinc-300">Kaaoffc Chat</h2>
              <p className="mt-2 text-sm text-center max-w-sm">
                Pilih obrolan dari daftar di sebelah kiri atau mulai percakapan baru untuk mengirim rekomendasi anime!
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
