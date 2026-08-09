// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '@/lib/supabase';
import FollowListModal from '@/app/components/FollowListModal';
import { 
  User, Settings, Info, LogOut, ChevronRight, X, Edit3, 
  Image as ImageIcon, Loader2, Key, Shield, 
  BadgeCheck, PlayCircle,
  MessageCircle, Crown, Search, Bookmark, History, Activity, Camera, ArrowLeft,
  Sparkles, Eye, Clock, Star, Users, Medal, Trophy, Palette, Pin, MonitorPlay,
  Flame, Swords, Droplet, Award, Lock, Plus, AlertTriangle, Send, CheckCircle, Trash2
} from 'lucide-react';
import Link from 'next/link';

// =====================
// Toggle Switch 
// =====================
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-amber-500' : 'bg-zinc-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// Badge icon map (Lucide icons instead of emoji)
const badgeIconMap: Record<string, any> = {
  'Marathoner': Flame,
  'Sekte Donghua': Swords,
  'First Blood': Droplet,
  'Sepuh': Award,
};

export default function ProfilePage() {
  const { user, loading: authLoading, signOut, updateUserMeta } = useAuth();
  
  // UI States
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'showcase' | 'aktivitas' | 'riwayat' | 'bookmark' | 'pengaturan'>('ringkasan');
  const [historyTab, setHistoryTab] = useState<'Anime' | 'Komik' | 'Novel' | 'Donghua'>('Donghua');
  const [bookmarkTab, setBookmarkTab] = useState<'Anime' | 'Komik' | 'Novel' | 'Donghua'>('Donghua');
  const [watchlistFilter, setWatchlistFilter] = useState<'Semua' | 'Watching' | 'Completed' | 'On Hold' | 'Plan to Watch'>('Semua');
  const [isDark, setIsDark] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [themeColor, setThemeColor] = useState('amber');

  // Data States
  const [activities, setActivities] = useState<any[]>([]);
  const [visibleActivities, setVisibleActivities] = useState(10);
  const [history, setHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Real DB States (no more dummy!)
  const [badges, setBadges] = useState<any[]>([]);
  const [showcase, setShowcase] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Helper to format proper URL for history and bookmarks
  const formatItemHref = (item: any) => {
    const url = item.item_url || item.href || item.novelUrl || '#';
    const cat = (item.category || item.source || 'donghua').toLowerCase();
    
    // If it's an external URL (http), it's either a webtoon or donghua
    if (url.startsWith('http')) {
      // Old webtoons were saved as 'komik' before the fix. 
      // Since regular comics don't use external URLs, any HTTP link under 'komik' is a webtoon
      if (cat === 'webtoon' || cat === 'komik' || cat === 'comic') {
        return `/detail?url=${encodeURIComponent(url)}&source=webtoons`;
      }
      return `/detail?url=${encodeURIComponent(url)}&source=donghua`;
    }
    
    // If it's already a full internal path, return as is
    if (url.startsWith('/')) return url;
    
    // Otherwise, it's likely a slug. Format based on category
    if (cat === 'donghua') return `/detail?url=${url}&source=donghua`;
    if (cat === 'anime') return `/anime/detail/${url}`;
    if (cat === 'komik' || cat === 'comic') return `/comic/detail/${url}`;
    if (cat === 'webtoon') return `/detail?url=${encodeURIComponent(url)}&source=webtoons`;
    if (cat === 'novel') return `/novel/detail/${url}`;
    
    return url;
  };

  // Showcase Modal
  const [showAddShowcase, setShowAddShowcase] = useState(false);
  const [showcaseSearch, setShowcaseSearch] = useState('');
  const [showcaseSearchResults, setShowcaseSearchResults] = useState<any[]>([]);
  const [addingShowcase, setAddingShowcase] = useState(false);

  // Profile Edit
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Report Error Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const savedTheme = localStorage.getItem('profileTheme') || 'amber';
    setThemeColor(savedTheme);
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    
    const { data: actData } = await supabase.from('user_activities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (actData) setActivities(actData);

    const { data: histData } = await supabase.from('user_history').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (histData) {
      setHistory(histData);
      
      // Auto-repair missing posters in background
      const itemsNeedingPoster = histData.filter((h: any) => !h.poster && h.item_url);
      if (itemsNeedingPoster.length > 0) {
        const repairPosters = async () => {
          const updated: any[] = [...histData];
          for (const item of itemsNeedingPoster) {
            try {
              let poster = '';
              const cat = (item.category || '').toLowerCase();
              const url = item.item_url || '';
              
              if (cat === 'anime') {
                // item_url is typically the animeId/slug
                const res = await fetch(`/api/anime/anime/${url}`);
                const json = await res.json();
                const detail = json?.data || json?.anime_detail || json;
                poster = detail?.poster || detail?.thumb || detail?.thumbnail || '';
              } else if (cat === 'novel') {
                // item_url is like /novel/detail/sakura-slug
                const slug = url.replace('/novel/detail/', '').replace('sakura-', '');
                if (slug) {
                  const res = await fetch(`/api/novel/sakuranovel/detail/${slug}`);
                  const json = await res.json();
                  const detail = json?.data || json?.result;
                  poster = detail?.thumbnail || detail?.poster || detail?.image || detail?.cover || '';
                }
              } else if (cat === 'donghua' || cat === 'komik' || cat === 'webtoon' || cat === 'comic') {
                // Try generic detail endpoint
                if (url.startsWith('http')) {
                  const res = await fetch(`/api/detail?url=${encodeURIComponent(url)}`);
                  const json = await res.json();
                  poster = json?.thumbnail || json?.poster || json?.image || '';
                }
              }
              
              if (poster) {
                // Update in-memory state
                const idx = updated.findIndex((h: any) => h.item_url === item.item_url);
                if (idx !== -1) updated[idx] = { ...updated[idx], poster };
                
                // Update database
                supabase.from('user_history').update({ poster }).match({ user_id: user.id, item_url: user.id, item_url: item.item_url }).then();
              }
            } catch (e) {
              // Silently skip failed repairs
            }
          }
          setHistory(updated);
        };
        repairPosters();
      }
    }

    // Load bookmarks from Supabase
    const { data: bkmData } = await supabase.from('user_bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (bkmData) {
      setBookmarks(bkmData);
    } else {
      setBookmarks([]);
    }

    // Fetch real badges
    const { data: badgeData } = await supabase.from('user_badges').select('*').eq('user_id', user.id);
    if (badgeData) setBadges(badgeData);

    // Fetch real showcase
    const { data: scData } = await supabase.from('user_showcase').select('*').eq('user_id', user.id).order('position_index', { ascending: true });
    if (scData) setShowcase(scData);

    // Fetch followers/following counts
    const { count: fwersCount } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
    setFollowersCount(fwersCount || 0);
    const { count: fwingCount } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
    setFollowingCount(fwingCount || 0);

    // Fetch theme from profiles
    const { data: profData } = await supabase.from('profiles').select('theme_color').eq('id', user.id).single();
    if (profData?.theme_color) {
      setThemeColor(profData.theme_color);
      localStorage.setItem('profileTheme', profData.theme_color);
    }
    
    setLoadingData(false);
  };

  const handleLogout = async () => { await signOut(); window.location.href = '/login'; };

  const openEditModal = () => {
    setEditName(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '');
    setEditBio(user?.user_metadata?.bio || '');
    setAvatarPreview(user?.user_metadata?.avatar_url || '');
    setAvatarFile(null);
    setShowEditModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setIsUploadingBanner(true);
      try {
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          await updateUserMeta({ banner_url: url });
          await supabase.from('profiles').update({ banner_url: url }).eq('id', user?.id);
        }
      } catch { alert('Gagal mengupload banner'); }
      finally { setIsUploadingBanner(false); }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      let finalAvatarUrl = user?.user_metadata?.avatar_url || '';
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) { const { url } = await uploadRes.json(); finalAvatarUrl = url; }
      }
      await updateUserMeta({ display_name: editName, avatar_url: finalAvatarUrl, bio: editBio });
      await supabase.from('profiles').update({ bio: editBio }).eq('id', user?.id);
      setShowEditModal(false);
    } catch { alert('Terjadi kesalahan saat mengupdate profil'); }
    finally { setIsUpdating(false); }
  };

  const handleThemeChange = async (color: string) => {
    setThemeColor(color);
    localStorage.setItem('profileTheme', color);
    if (user) await supabase.from('profiles').update({ theme_color: color }).eq('id', user.id);
  };

  // Showcase: search from history/bookmarks
  const handleShowcaseSearch = () => {
    const q = showcaseSearch.toLowerCase().trim();
    if (!q) { setShowcaseSearchResults([]); return; }
    const all = [...history, ...bookmarks];
    const unique = all.filter((v, i, a) => a.findIndex(t => t.title === v.title) === i);
    setShowcaseSearchResults(unique.filter(i => i.title?.toLowerCase().includes(q)).slice(0, 10));
  };

  const addToShowcase = async (item: any) => {
    if (!user || showcase.length >= 10) return;
    setAddingShowcase(true);
    const { error } = await supabase.from('user_showcase').insert({
      user_id: user.id,
      item_title: item.title,
      item_image: item.poster || item.image || item.image_url || item.thumbnail || '',
      item_type: item.category || 'Donghua',
      item_url: item.item_url || item.href || '',
      position_index: showcase.length + 1
    });
    if (!error) {
      await fetchData();
      setShowcaseSearch('');
      setShowcaseSearchResults([]);
    }
    setAddingShowcase(false);
  };

  const removeFromShowcase = async (id: string) => {
    await supabase.from('user_showcase').delete().eq('id', id);
    await fetchData();
  };

  const removeItem = async (e: React.MouseEvent, item_url: string, isHistory: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    
    if (isHistory) {
      setHistory(prev => prev.filter(i => i.item_url !== item_url));
      await supabase.from('user_history').delete().match({ user_id: user.id, item_url });
    } else {
      setBookmarks(prev => prev.filter(i => i.item_url !== item_url));
      await supabase.from('user_bookmarks').delete().match({ user_id: user.id, item_url });
    }
  };

  const handleReportError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportUrl.trim()) return;
    setIsSubmittingReport(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          item_url: reportUrl,
          item_type: 'general',
          reason: reportReason
        })
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportReason('');
          setReportUrl('');
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Theme colors (SOLID, no gradients)
  const getThemeColors = () => {
    switch (themeColor) {
      case 'blue': return { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500' };
      case 'rose': return { text: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500', ring: 'ring-rose-500' };
      case 'emerald': return { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500' };
      case 'purple': return { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500' };
      default: return { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500' };
    }
  };
  const theme = getThemeColors();

  if (authLoading) return <div className="flex-1 flex items-center justify-center py-40"><Loader2 className={`animate-spin ${theme.text}`} size={32} /></div>;

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center py-40">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-5 border border-zinc-800">
          <User size={32} className="text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Belum Login</h2>
        <p className="text-zinc-500 mb-6 max-w-sm text-xs">Silakan login untuk mengakses profil.</p>
        <Link href="/login" className={`px-6 py-2 ${theme.bg} text-white font-bold rounded-lg text-xs`}>Login Sekarang</Link>
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Pengguna';
  const avatarUrl = user.user_metadata?.avatar_url || '/avatar.jpeg';
  const bannerUrl = user.user_metadata?.banner_url || '';
  const role = user.user_metadata?.role || 'User';
  const usernameStr = (user.user_metadata?.username || user.user_metadata?.display_name || '').toLowerCase();
  const isAdmin = role === 'Developer' || role === 'Admin' || role === 'Moderator' || usernameStr.includes('admin') || usernameStr.includes('dev');
  const isVerified = user.user_metadata?.is_verified || isAdmin;
  const isSpecial = isAdmin || isVerified;
  const level = user.user_metadata?.level || 1;
  const currentExp = user.user_metadata?.exp || 0;
  const expNeeded = level * 100;
  const expPercentage = Math.min(100, Math.round((currentExp / expNeeded) * 100));
  const totalExp = ((level - 1) * 100) + currentExp; 
  const bio = user.user_metadata?.bio || 'Belum ada bio.';
  const canUseTheme = level >= 20;
  
  const rankNames = ['Rookie', 'Veteran', 'Elite', 'Legend', 'Mythic'];
  const currentRank = rankNames[Math.min(Math.floor(level / 20), rankNames.length - 1)];
  const nextRank = rankNames[Math.min(Math.floor(level / 20) + 1, rankNames.length - 1)];

  // Stats from real data
  const episodesWatched = history.reduce((sum, h) => {
    const ep = parseInt(h.last_episode, 10);
    return sum + (isNaN(ep) ? 1 : ep);
  }, 0);
  const watchTimeMins = episodesWatched * 24;
  const watchDays = Math.floor(watchTimeMins / 1440);
  const watchHours = Math.floor((watchTimeMins % 1440) / 60);
  const watchTimeStr = watchDays > 0 ? `${watchDays}h ${watchHours}m` : `${watchHours}h ${watchTimeMins % 60}m`;

  return (
    <>
      <div className="flex-1 min-w-0 pb-16 font-sans">
        
        {/* Preview Mode Banner */}
        {previewMode && (
          <div className={`w-full ${theme.bg} text-white px-4 py-2 flex justify-between items-center z-50 sticky top-0`}>
            <div className="flex items-center gap-1.5">
              <Eye size={14} />
              <span className="font-bold text-sm">Preview Profil Publik</span>
            </div>
            <button onClick={() => setPreviewMode(false)} className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kembali
            </button>
          </div>
        )}

        <div className="w-full">
          {/* Banner */}
          <div className="w-full h-36 sm:h-48 lg:h-64 bg-zinc-900 relative flex items-center justify-center group overflow-hidden">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-zinc-800/20 uppercase tracking-[0.2em] select-none">KAAOFFC</h1>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10"></div>
            
            <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
            {!previewMode && (
              <button onClick={() => bannerInputRef.current?.click()} disabled={isUploadingBanner}
                className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors border border-white/10 disabled:opacity-50">
                {isUploadingBanner ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                {isUploadingBanner ? 'Upload...' : 'Ganti Banner'}
              </button>
            )}
          </div>

          {/* Profile Header */}
          <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 -mt-14 sm:-mt-20 relative z-20 flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-5">
            <div className="relative group cursor-pointer shrink-0" onClick={() => !previewMode && openEditModal()}>
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-900 overflow-hidden relative shadow-xl ${isAdmin ? 'border-4 border-blue-500' : `border-[3px] border-[#0a0a0a] ring-2 ${theme.ring} ring-offset-2 ring-offset-[#0a0a0a]`}`}>
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {!previewMode && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={20} />
                  </div>
                )}
              </div>
              {!previewMode && (
                <div className={`absolute bottom-1 right-1 w-7 h-7 ${theme.bg} rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-white`}>
                  <Camera size={11} />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left mb-1 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                  {displayName}
                  {isSpecial && <BadgeCheck size={16} className="text-[#1B1D2A] fill-blue-500" />}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded flex items-center gap-1">
                    <Sparkles size={9} className={theme.text} /> Lv.{level}
                  </span>
                  <span className={`px-2 py-0.5 ${theme.bg}/15 ${theme.text} text-[9px] font-bold rounded border ${theme.border}/20 uppercase tracking-wider`}>
                    {currentRank}
                  </span>
                  {role !== 'User' && (
                    <span className={`px-2 py-0.5 ${isAdmin ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'} text-[9px] font-bold rounded flex items-center gap-0.5`}>
                      <Shield size={8} /> {role}
                    </span>
                  )}</div>
              </div>
              <p className="text-sm text-zinc-400 max-w-xl line-clamp-2 mb-2">{bio}</p>
              
                <div className="flex items-center justify-center sm:justify-start gap-4 text-[11px]">
                  <button onClick={() => { setFollowModalType('followers'); setShowFollowModal(true); }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><span className="font-bold text-white">{followersCount}</span> Followers</button>
                  <button onClick={() => { setFollowModalType('following'); setShowFollowModal(true); }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><span className="font-bold text-white">{followingCount}</span> Following</button>
                  {previewMode && (
                    <button className={`ml-2 px-3 py-1 ${theme.bg} text-white text-xs font-bold rounded-full`}>Ikuti</button>
                  )}
                </div>
            </div>

            {!previewMode ? (
              <div className="flex gap-2 sm:mb-4 w-full sm:w-auto">
                <button onClick={() => { setActiveTab('ringkasan'); setPreviewMode(true); }} className="flex-1 sm:flex-none px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors border border-zinc-800 flex items-center justify-center gap-1.5">
                  <Eye size={12} /> Preview
                </button>
                <button onClick={openEditModal} className={`flex-1 sm:flex-none px-4 py-1.5 ${theme.bg} hover:opacity-90 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5`}>
                  <Edit3 size={12} /> Edit Profil
                </button>
              </div>
            ) : (
              <div className="flex gap-2 sm:mb-4 w-full sm:w-auto">
                <button onClick={() => setPreviewMode(false)} className={`flex-1 sm:flex-none px-4 py-1.5 ${theme.bg} hover:opacity-90 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5`}>
                  <ArrowLeft size={12} /> Keluar Preview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 mt-6">
          <div className="flex flex-col lg:flex-row gap-5">
            
            {/* LEFT SIDEBAR */}
            <div className="w-full lg:w-[220px] shrink-0">
              <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-1.5 sticky top-20">
                {[
                  { id: 'ringkasan', label: 'Ringkasan', icon: Activity },
                  { id: 'showcase', label: 'Top Favorit', icon: Star },
                  { id: 'aktivitas', label: 'Aktivitas', icon: History },
                  { id: 'riwayat', label: 'Riwayat', icon: MonitorPlay, hideInPreview: true },
                  { id: 'bookmark', label: 'Watchlist', icon: Bookmark, hideInPreview: true },
                  { id: 'pengaturan', label: 'Pengaturan', icon: Settings, hideInPreview: true },
                ].filter(tab => !(previewMode && tab.hideInPreview)).map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      activeTab === tab.id ? `${theme.bg}/10 ${theme.text}` : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                    }`}>
                    <tab.icon size={14} className={activeTab === tab.id ? theme.text : 'text-zinc-500'} />
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight size={12} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 min-w-0">
              
              {/* RINGKASAN */}
              {activeTab === 'ringkasan' && (
                <div className="flex flex-col gap-4">
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Clock, label: 'Waktu', value: watchTimeStr },
                      { icon: MonitorPlay, label: 'Episode', value: episodesWatched.toLocaleString() },
                      { icon: Star, label: 'Favorit', value: `${showcase.length} Judul` },
                    ].map((s, i) => (
                      <div key={i} className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-3 text-center">
                        <s.icon className="text-zinc-600 mx-auto mb-1" size={16} />
                        <p className={`text-sm font-black ${theme.text}`}>{s.value}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Level */}
                  <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" className="stroke-zinc-800" strokeWidth="5" fill="none" />
                          <circle cx="32" cy="32" r="28" className={`stroke-current ${theme.text}`} strokeWidth="5" fill="none" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * expPercentage) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-black text-white">{level}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Crown className={theme.text} size={14} />
                          <span className="text-sm font-black text-white">{currentRank}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-2">
                          <span className={`${theme.text} font-bold`}>{expNeeded - currentExp} XP</span> menuju rank {nextRank}
                        </p>
                        <div className="flex gap-4 text-xs">
                          <span className="text-zinc-500">Total: <span className="text-white font-bold">{totalExp.toLocaleString()} XP</span></span>
                          <span className="text-zinc-500">Progress: <span className="text-white font-bold">{expPercentage}%</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                      <Medal className={theme.text} size={14} /> Pencapaian
                    </h3>
                    {badges.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">Belum ada pencapaian.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {badges.map((badge) => {
                          const IconComp = badgeIconMap[badge.badge_name] || Award;
                          return (
                            <div key={badge.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors" title={badge.badge_desc}>
                              <div className={`w-7 h-7 rounded-lg ${theme.bg}/15 flex items-center justify-center shrink-0`}>
                                <IconComp size={13} className={theme.text} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{badge.badge_name}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{badge.badge_desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Mini Leaderboard */}
                  <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Trophy className={theme.text} size={14} /> Posisi Peringkat
                      </h3>
                      <Link href="/leaderboard" className={`text-xs font-bold ${theme.text}`}>Lihat Semua</Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${theme.bg}/15 flex items-center justify-center text-xs font-black ${theme.text}`}>#?</div>
                      <div>
                        <p className="text-xs font-bold text-white">Terus tingkatkan levelmu!</p>
                        <p className="text-[10px] text-zinc-500">Bersaing dengan player lainnya.</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* SHOWCASE */}
              {activeTab === 'showcase' && (
                <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Pin className={theme.text} size={14} /> Top Favorit ({showcase.length}/10)
                    </h3>
                    {!previewMode && showcase.length < 10 && (
                      <button onClick={() => setShowAddShowcase(true)} className={`px-3 py-1 ${theme.bg} text-white text-xs font-bold rounded-lg flex items-center gap-1`}>
                        <Plus size={10} /> Tambah
                      </button>
                    )}
                  </div>

                  {showcase.length === 0 ? (
                    <div className="text-center py-8">
                      <Star size={28} className="text-zinc-800 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">Belum ada favorit. Tambahkan sekarang!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {showcase.map((item, idx) => (
                        <div key={item.id} className="relative group rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/50">
                          <div className="absolute top-1 left-1 z-20 w-4 h-4 rounded bg-black/70 flex items-center justify-center text-[8px] font-black text-white">
                            {idx + 1}
                          </div>
                          <div className="aspect-[3/4] relative">
                            {item.item_image ? (
                              <img src={item.item_image} alt={item.item_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar.jpeg'; }} />
                            ) : (
                              <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Star size={16} className="text-zinc-700" /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full p-1.5 z-10">
                              <span className={`text-[7px] font-bold uppercase px-1 py-px rounded ${theme.bg}/20 ${theme.text} border ${theme.border}/20 inline-block mb-0.5`}>{item.item_type}</span>
                              <h4 className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{item.item_title}</h4>
                            </div>
                            {!previewMode && (
                              <button onClick={() => removeFromShowcase(item.id)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 text-white z-20">
                                <X size={8} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AKTIVITAS */}
              {activeTab === 'aktivitas' && (
                <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                    <Activity className={theme.text} size={14} /> Aktivitas Terakhir
                  </h3>
                  {loadingData ? (
                    <div className="flex items-center justify-center py-8"><Loader2 size={20} className={`${theme.text} animate-spin`} /></div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                      <History size={28} className="text-zinc-800 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">Belum ada aktivitas.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, visibleActivities).map((act) => (
                        <div key={act.id} className="flex gap-2.5">
                          <div className={`w-6 h-6 rounded-full ${theme.bg}/15 flex items-center justify-center shrink-0 mt-0.5`}>
                            {act.activity_type.includes('LIKE') ? <Heart className="text-rose-500" size={10} /> : 
                             act.activity_type.includes('BALAS') ? <MessageCircle className="text-blue-500" size={10} /> :
                             <Activity className={theme.text} size={10} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-bold ${theme.text} uppercase tracking-wider mb-0.5`}>{act.activity_type}</p>
                            <h4 className="text-xs font-bold text-white truncate">{act.target_title}</h4>
                            {act.content && <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{act.content}</p>}
                            <span className="text-[8px] text-zinc-600 flex items-center gap-1 mt-0.5">
                              <Clock size={8} /> {new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {visibleActivities < activities.length && (
                        <button onClick={() => setVisibleActivities(p => p + 10)}
                          className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1">
                          Muat Lebih Banyak <ChevronRight size={10} className="rotate-90" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* RIWAYAT & BOOKMARK */}
              {(activeTab === 'riwayat' || activeTab === 'bookmark') && !previewMode && (
                <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {activeTab === 'riwayat' ? <MonitorPlay className={theme.text} size={14} /> : <Bookmark className={theme.text} size={14} />}
                      {activeTab === 'riwayat' ? 'Riwayat' : 'Watchlist'}
                    </h3>
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                      <input type="text" placeholder="Cari..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-7 pr-3 text-xs text-white focus:outline-none" />
                    </div>
                  </div>

                  <div className="flex overflow-x-auto gap-1.5 mb-3 pb-1">
                    {['Donghua', 'Anime', 'Komik', 'Novel'].map(cat => {
                      const isActive = (activeTab === 'riwayat' ? historyTab : bookmarkTab) === cat;
                      return (
                        <button key={cat}
                          onClick={() => activeTab === 'riwayat' ? setHistoryTab(cat as any) : setBookmarkTab(cat as any)}
                          className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            isActive ? `${theme.bg} text-white` : 'text-zinc-500 hover:text-white'
                          }`}>{cat}</button>
                      );
                    })}
                  </div>



                  {loadingData ? (
                    <div className="flex items-center justify-center py-8"><Loader2 size={20} className={`${theme.text} animate-spin`} /></div>
                  ) : (activeTab === 'riwayat' ? history : bookmarks).filter(item => {
                    const cat = (item.category || 'Donghua').toLowerCase();
                    const tab = (activeTab === 'riwayat' ? historyTab : bookmarkTab).toLowerCase();
                    if (tab === 'komik' && (cat === 'komik' || cat === 'webtoon' || cat === 'comic')) return true;
                    return cat === tab;
                  }).length === 0 ? (
                        <div className="text-center py-8">
                      <p className="text-xs text-zinc-500">Belum ada data.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {(activeTab === 'riwayat' ? history : bookmarks).filter(item => {
                          const cat = (item.category || 'Donghua').toLowerCase();
                          const tab = (activeTab === 'riwayat' ? historyTab : bookmarkTab).toLowerCase();
                          if (tab === 'komik' && (cat === 'komik' || cat === 'webtoon' || cat === 'comic')) return true;
                          return cat === tab;
                        }).map((item, idx) => (
                        <Link href={formatItemHref(item)} key={idx} className="group relative block rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/50">
                          <div className="aspect-[3/4] relative overflow-hidden">
                            {(item.poster || item.image || item.image_url || item.thumbnail) ? (() => {
                              const imgUrl = item.poster || item.image || item.image_url || item.thumbnail;
                              const src = imgUrl.startsWith('http') ? `/api/image-proxy?url=${encodeURIComponent(imgUrl)}` : imgUrl;
                              return <img src={src} alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar.jpeg'; }} />;
                            })() : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900 text-[10px]">No Image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-1.5 w-full z-10">
                              <h4 className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{item.title}</h4>
                              {activeTab === 'riwayat' && item.last_episode && (
                                <p className="text-[8px] text-zinc-400 mt-0.5 flex items-center gap-0.5">
                                  <PlayCircle size={7} className={theme.text} /> Ep {item.last_episode}
                                </p>
                              )}
                            </div>
                            <button 
                              onClick={(e) => removeItem(e, item.item_url, activeTab === 'riwayat')}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 text-white z-20"
                            >
                              <Trash2 size={8} />
                            </button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PENGATURAN */}
              {activeTab === 'pengaturan' && !previewMode && (
                <div className="flex flex-col gap-3">
                  
                  {/* Theme VIP */}
                  <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                      <Palette className={theme.text} size={14} /> Tema Profil
                      {!canUseTheme && <span className="text-[8px] text-zinc-500 ml-1 flex items-center gap-0.5"><Lock size={8} /> Level 20+</span>}
                    </h3>
                    {canUseTheme ? (
                      <>
                        <p className="text-[10px] text-zinc-500 mb-3">Pilih warna aksen profilmu.</p>
                        <div className="flex gap-3">
                          {[
                            { id: 'amber', color: 'bg-amber-500' },
                            { id: 'blue', color: 'bg-blue-500' },
                            { id: 'rose', color: 'bg-rose-500' },
                            { id: 'emerald', color: 'bg-emerald-500' },
                            { id: 'purple', color: 'bg-purple-500' },
                          ].map(t => (
                            <button key={t.id} onClick={() => handleThemeChange(t.id)}
                              className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center transition-transform hover:scale-110 ${themeColor === t.id ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950' : 'opacity-40'}`}>
                              {themeColor === t.id && <CheckCircle size={12} className="text-white" />}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-zinc-500">Capai <span className={`${theme.text} font-bold`}>Level 20 (Veteran)</span> untuk membuka fitur ini.</p>
                    )}
                  </div>

                  {/* App Preferences */}
                  <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">Mode Gelap</h4>
                      <p className="text-[10px] text-zinc-500">Tema gelap untuk kenyamanan mata.</p>
                    </div>
                    <ToggleSwitch checked={isDark} onChange={() => { const n = !isDark; setIsDark(n); if(n){document.documentElement.classList.add("dark"); localStorage.setItem("theme","dark")}else{document.documentElement.classList.remove("dark"); localStorage.setItem("theme","light")} }} />
                  </div>

                  {/* Security */}
                  <button onClick={async () => { const np = prompt("Masukkan password baru:"); if(np && np.length >= 6){ const {error} = await supabase.auth.updateUser({password: np}); if(error) alert(error.message); else alert("Password berhasil diubah!"); } else if(np) alert("Password harus minimal 6 karakter") }}
                    className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-800/30 transition-colors group text-left w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center"><Key size={12} className="text-zinc-400" /></div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Ubah Kata Sandi</h4>
                        <p className="text-[10px] text-zinc-500">Perbarui kata sandi secara berkala.</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </button>

                  {/* Lapor Error */}
                  <button onClick={() => setShowReportModal(true)}
                    className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-800/30 transition-colors group text-left w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center"><AlertTriangle size={12} className="text-rose-500" /></div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Lapor Error / Bug</h4>
                        <p className="text-[10px] text-zinc-500">Laporkan masalah pada situs atau episode.</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </button>

                  {/* Logout */}
                  <button onClick={handleLogout} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center justify-center gap-1.5 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors">
                    <LogOut size={13} /> <span className="font-bold text-sm">Keluar dari Akun</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && !previewMode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950">
                <h3 className="text-sm font-bold text-white">Edit Profil</h3>
                <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white w-6 h-6 rounded-full flex items-center justify-center"><X size={14} /></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-4 flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-950 relative group">
                    <img src={avatarPreview || '/avatar.jpeg'} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="text-white" size={16} />
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`text-xs font-bold ${theme.text} px-3 py-1 rounded-full ${theme.bg}/10`}>Ubah Foto</button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Nama Tampilan</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" placeholder="Nama..." required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Bio Singkat</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none h-20" placeholder="Ceritakan tentang dirimu..." />
                </div>
                <button type="submit" disabled={isUpdating}
                  className={`w-full py-2.5 ${theme.bg} text-white font-bold rounded-lg text-xs disabled:opacity-50`}>
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Showcase Modal */}
        {showAddShowcase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950">
                <h3 className="text-sm font-bold text-white">Tambah Favorit</h3>
                <button onClick={() => { setShowAddShowcase(false); setShowcaseSearch(''); setShowcaseSearchResults([]); }} className="text-zinc-500 hover:text-white w-6 h-6 rounded-full flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <input type="text" value={showcaseSearch} onChange={(e) => setShowcaseSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleShowcaseSearch()}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" placeholder="Cari dari riwayat & bookmark..." />
                  <button onClick={handleShowcaseSearch} className={`px-3 py-2 ${theme.bg} text-white rounded-lg text-xs font-bold`}>
                    <Search size={12} />
                  </button>
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {showcaseSearchResults.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-6">Ketik untuk mencari dari riwayat & bookmarkmu.</p>
                  ) : (
                    showcaseSearchResults.map((item, idx) => {
                      const alreadyAdded = showcase.some(s => s.item_title === item.title);
                      return (
                        <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                          <div className="w-10 h-14 rounded bg-zinc-800 overflow-hidden shrink-0">
                            {(item.poster || item.image || item.image_url || item.thumbnail) ? (
                              <img src={item.poster || item.image || item.image_url || item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-zinc-600"><Star size={12} /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[8px] text-zinc-500 uppercase">{item.category || 'Donghua'}</p>
                          </div>
                          <button 
                            onClick={() => !alreadyAdded && addToShowcase(item)} 
                            disabled={addingShowcase || alreadyAdded}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${alreadyAdded ? 'bg-zinc-800 text-zinc-500' : `${theme.bg} text-white`} disabled:opacity-50`}>
                            {alreadyAdded ? 'Sudah Ada' : addingShowcase ? '...' : 'Tambah'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Error Modal */}
        {showReportModal && !previewMode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1C1D2A] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
              <div className="bg-rose-600/10 p-5 flex justify-between items-center border-b border-rose-500/20">
                <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                  <AlertTriangle size={20} className="text-rose-500" />
                  Lapor Error
                </h3>
                <button onClick={() => setShowReportModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5">
                {reportSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send size={32} />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">Laporan Terkirim!</h4>
                    <p className="text-zinc-400 text-sm">Terima kasih atas bantuan Anda. Admin akan segera memeriksanya.</p>
                  </div>
                ) : (
                  <form onSubmit={handleReportError} className="flex flex-col gap-4">
                    <p className="text-sm text-zinc-300">
                      Ada link mati, gambar rusak, atau error lainnya? Beritahu admin agar segera diperbaiki!
                    </p>
                    
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">URL / Link Halaman yang Error</label>
                      <input 
                        type="url"
                        value={reportUrl}
                        onChange={(e) => setReportUrl(e.target.value)}
                        placeholder="Contoh: https://domain.com/anime/watch/..."
                        className="w-full bg-[#0a0a0c] border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Detail Error</label>
                      <textarea 
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Misal: Video episode 3 tidak bisa diputar..."
                        className="w-full bg-[#0a0a0c] border border-zinc-700 text-white text-sm rounded-xl p-3 min-h-[120px] focus:outline-none focus:border-rose-500 transition-colors"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmittingReport || !reportReason.trim() || !reportUrl.trim()}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
                    >
                      {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
      {user && (
        <FollowListModal isOpen={showFollowModal} onClose={() => setShowFollowModal(false)} userId={user.id} type={followModalType} />
      )}
    </>
  );
}
