'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { CheckCircle, User, Send, Star, Crown, Sparkles, Shield, ChevronDown, MessageSquare, Trash2, Reply, Heart, Edit2, X } from 'lucide-react';
import Link from 'next/link';

function getUserTier(level: number) {
  if (level >= 100) return { name: 'Mythic', icon: Crown, color: 'from-rose-500 via-purple-500 to-indigo-500', text: 'text-rose-500 dark:text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10 dark:bg-rose-500/20' };
  if (level >= 50)  return { name: 'Legend', icon: Crown, color: 'from-amber-400 via-yellow-500 to-orange-500', text: 'text-amber-500 dark:text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10 dark:bg-amber-500/20' };
  if (level >= 30)  return { name: 'Elite', icon: Sparkles, color: 'from-cyan-400 to-blue-500', text: 'text-cyan-500 dark:text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15' };
  if (level >= 10)  return { name: 'Veteran', icon: Shield, color: 'from-emerald-400 to-green-500', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15' };
  return null;
}

export default function CommentSection({ itemUrl }: { itemUrl: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showLevelEffect, setShowLevelEffect] = useState(false);

  // New States for Features
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!itemUrl) return;
    fetchComments();
  }, [itemUrl, user]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?itemUrl=${encodeURIComponent(itemUrl)}${user ? `&userId=${user.id}` : ''}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    setSubmitError('');
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    const avatarUrl = user.user_metadata?.avatar_url || '/avatar.jpeg';
    const userLevel = user.user_metadata?.level || 1;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemUrl,
          userId: user.id,
          userEmail: displayName,
          userAvatar: avatarUrl,
          userLevel: userLevel,
          userExp: user.user_metadata?.exp || 0,
          content: newComment.trim(),
          parentId: replyingTo
        })
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.error || 'Gagal mengirim komentar. Coba lagi.');
      } else {
        setNewComment('');
        setReplyingTo(null);
        fetchComments();
        
        import('@/lib/supabase').then(async ({ supabase }) => {
          if (result.newExp && result.newLevel) {
            await supabase.auth.updateUser({
              data: { exp: result.newExp, level: result.newLevel }
            });
          }
          supabase.auth.refreshSession();
        });

          if (result.levelUp || result.newLevel >= 30) {
          setShowLevelEffect(true);
          setTimeout(() => setShowLevelEffect(false), 3000);
        }

        // Trigger Gamification Mission for 'comment'
        fetch('/api/missions/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action_type: 'comment' })
        }).catch(console.error);
      }
    } catch (e) {
      console.error('Failed to post comment', e);
      setSubmitError('Koneksi gagal. Periksa internet Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string, hasLiked: boolean) => {
    if (!user) return alert('Silakan login terlebih dahulu untuk menyukai komentar.');
    
    // Optimistic Update
    setComments(comments.map(c => c.id === commentId ? { 
      ...c, 
      user_has_liked: !hasLiked, 
      likes_count: Math.max(0, (c.likes_count || 0) + (hasLiked ? -1 : 1)) 
    } : c));

    await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: hasLiked ? 'unlike' : 'like', commentId, userId: user.id })
    });
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;
    
    // Optimistic Update
    setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
    
    await fetch(`/api/comments?id=${commentId}&userId=${user?.id}`, { method: 'DELETE' });
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    // Optimistic Update
    setComments(comments.map(c => c.id === commentId ? { ...c, content: editContent } : c));
    setEditingComment(null);

    await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', commentId, userId: user?.id, content: editContent })
    });
  };

  const handleTranslate = () => {
    alert("Fitur Terjemahan (ID/EN) segera hadir!");
  };

  const parentComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const CommentCard = ({ c, isReply = false }: { c: any, isReply?: boolean }) => {
    const lvl = c.user_level ?? 1;
    const isSpecial = c.user_role === 'Developer' || c.user_role === 'Admin' || c.user_role === 'Moderator';
    const tier = getUserTier(lvl);
    const dateStr = new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const isOwner = user?.id === c.user_id;
    const isEditing = editingComment === c.id;
    const repliesCount = getReplies(c.id).length;

    return (
      <div className={`flex gap-3 sm:gap-4 group ${isReply ? 'mt-4 ml-6 sm:ml-10 border-l-2 border-zinc-800/50 pl-4' : ''}`}>
        <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11">
          <Link 
            href={`/user/${c.user_id}`} 
            className={`block relative w-full h-full rounded-full p-0.5 hover:scale-105 transition-transform border-[2px] ${isSpecial ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : (tier ? tier.border : 'border-zinc-700')}`}
          >
            <img src={c.user_avatar || '/avatar.jpeg'} alt={c.user_email} className="w-full h-full rounded-full object-cover bg-zinc-800" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
          </Link>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex flex-col gap-0.5">
              <Link href={`/user/${c.user_id}`} className="font-bold text-sm sm:text-base text-zinc-100 flex items-center gap-1.5 hover:text-red-500 transition-colors">
                {c.user_email}
                {isSpecial && <CheckCircle size={14} className="text-blue-500 fill-blue-500/20"  />}
              </Link>
              <span className="text-[11px] text-zinc-500 font-medium flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-400">Level {lvl}</span>
                <span>-</span>
                <span>{tier ? tier.name : 'Newbie'}</span>
                <span className="text-zinc-600">•</span>
                <span>{dateStr}</span>
              </span>
            </div>
            {isOwner && (
              <button onClick={() => handleDelete(c.id)} className="text-zinc-500 hover:text-red-500 transition-colors p-1" title="Hapus">
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 mb-3">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-[#0D0D11] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 resize-none"
                rows={2}
              />
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => setEditingComment(null)} className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white">Batal</button>
                <button onClick={() => handleSaveEdit(c.id)} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg">Simpan</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed mt-1 mb-3">
              {c.content}
            </p>
          )}

          {!isEditing && (
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              {!isReply && (
                <button onClick={() => {
                  setReplyingTo(replyingTo === c.id ? null : c.id);
                  if (replyingTo !== c.id) document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
                }} className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold transition-colors ${replyingTo === c.id ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                  <Reply size={14} className="-scale-x-100" /> {repliesCount} balasan
                </button>
              )}
              
              <button 
                onClick={() => handleLike(c.id, c.user_has_liked)} 
                className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold transition-opacity ${c.user_has_liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-400'}`}
              >
                <Heart size={14} fill={c.user_has_liked ? "currentColor" : "none"} /> {c.likes_count || 0}
              </button>
              
              <div className="flex gap-1.5">
                <button onClick={handleTranslate} className="px-2 py-0.5 bg-zinc-800/60 rounded text-[10px] font-black text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors tracking-wide">ID</button>
                <button onClick={handleTranslate} className="px-2 py-0.5 bg-zinc-800/60 rounded text-[10px] font-black text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors tracking-wide">EN</button>
              </div>

              {isOwner && (
                <button onClick={() => {
                  setEditingComment(c.id);
                  setEditContent(c.content);
                }} className="text-[11px] sm:text-xs font-medium text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#101014] rounded-2xl p-5 sm:p-6 mt-8 w-full border border-zinc-800/50 shadow-xl" id="comment-section">
      <h3 className="text-2xl font-bold text-white mb-5">Comments</h3>

      <div className="flex flex-col gap-3 mb-6">
        <div className="w-full bg-[#1A1A22] hover:bg-[#1f1f29] cursor-pointer transition-colors border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm font-medium text-zinc-300 flex justify-between items-center">
          <span>Semua Komentar</span>
          <ChevronDown size={18} className="text-zinc-500" />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2.5 bg-[#1A1A22] border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors">
            Sort by <strong className="text-white font-bold ml-1">Newest</strong>
          </button>
          <button className="px-4 py-2.5 bg-[#1A1A22] border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 flex items-center gap-2 hover:text-white transition-colors">
            <MessageSquare size={14} className="text-zinc-500" /> {comments.length} Comments
          </button>
        </div>
      </div>

      <div className="bg-[#141419] border border-zinc-800/60 p-4 sm:p-5 rounded-2xl mb-8" id="comment-form">
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={user.user_metadata?.avatar_url || '/avatar.jpeg'} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
                <span className="text-sm text-zinc-400">Posting as <strong className="text-white">{user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}</strong></span>
              </div>
              {replyingTo && (
                <button type="button" onClick={() => setReplyingTo(null)} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-md">
                  <X size={12} /> Batal Balas
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 w-full relative">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Tulis balasan Anda..." : "Leave a comment"}
                  rows={2}
                  className="w-full bg-[#0D0D11] border border-zinc-800/80 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 resize-none transition-all"
                />
              </div>
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-red-600 hover:bg-red-500 text-white dark:bg-red-600 text-sm font-black rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-red-900/20"
              >
                {submitting ? 'Post...' : 'Post'}
              </button>
            </div>
            
            {submitError && (
              <p className="text-xs text-red-500 font-medium">{submitError}</p>
            )}

            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-medium text-zinc-600">{newComment.length}/500</span>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors">
                <input type="checkbox" className="rounded-sm bg-zinc-800 border-zinc-700 accent-red-600 w-3.5 h-3.5" />
                Sensor Text
              </label>
            </div>
            
            {showLevelEffect && (
              <div className="flex items-center gap-1 animate-bounce mt-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-amber-400 font-bold text-xs">Level Bonus!</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6 sm:p-8 text-sm text-zinc-400 font-medium">
            You must be <Link href="/login" className="mx-1 text-red-500 hover:underline hover:text-red-400 font-bold underline underline-offset-2">login</Link> to post a comment
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="text-center text-zinc-600 text-sm animate-pulse py-8 font-medium">Memuat komentar...</div>
        ) : parentComments.length === 0 ? (
          <div className="text-left text-zinc-500 text-sm py-4 font-medium">No Comments yet.</div>
        ) : (
          parentComments.map((c) => (
            <div key={c.id} className="flex flex-col">
              <CommentCard c={c} />
              
              {/* Render Replies */}
              {getReplies(c.id).length > 0 && (
                <div className="flex flex-col gap-4 mt-2">
                  {getReplies(c.id).map(reply => (
                    <CommentCard key={reply.id} c={reply} isReply={true} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
