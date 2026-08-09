// @ts-nocheck
'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, ChevronRight, Loader2, Shield, Heart, CheckCircle, BadgeCheck,
  PlayCircle, MessageCircle, Crown, History, Activity, ArrowLeft,
  Sparkles, Clock, Star, Medal, Trophy, Pin, MonitorPlay,
  Flame, Swords, Droplet, Award, X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';
import FollowListModal from '@/app/components/FollowListModal';

const badgeIconMap: Record<string, any> = {
  'Marathoner': Flame,
  'Sekte Donghua': Swords,
  'First Blood': Droplet,
  'Sepuh': Award,
};

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'showcase' | 'aktivitas'>('ringkasan');
  const [visibleActivities, setVisibleActivities] = useState(10);
  const [isFollowing, setIsFollowing] = useState(false);

  // Real DB
  const [badges, setBadges] = useState<any[]>([]);
  const [showcase, setShowcase] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    async function loadUser() {
      if (!userId) return;
      try {
        setLoading(true);
        const { data: profData, error: profError } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profError) { setProfile({ isError: true, error: profError.message }); setLoading(false); return; }
        setProfile(profData);

        const { data: actData } = await supabase.from('user_activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
        if (actData) setActivities(actData);

        const { data: badgeData } = await supabase.from('user_badges').select('*').eq('user_id', userId);
        if (badgeData) setBadges(badgeData);

        const { data: scData } = await supabase.from('user_showcase').select('*').eq('user_id', userId).order('position_index', { ascending: true });
        if (scData) setShowcase(scData);

        const { count: fwers } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
        setFollowersCount(fwers || 0);
        const { count: fwing } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
        setFollowingCount(fwing || 0);

        // Check if current user follows this user
        if (currentUser) {
          const { data: followData } = await supabase.from('user_follows').select('*').eq('follower_id', currentUser.id).eq('following_id', userId).single();
          setIsFollowing(!!followData);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadUser();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || currentUser.id === userId) return;
    if (isFollowing) {
      await supabase.from('user_follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
      setIsFollowing(false);
      setFollowersCount(p => Math.max(0, p - 1));
    } else {
      await supabase.from('user_follows').insert({ follower_id: currentUser.id, following_id: userId });
      setIsFollowing(true);
      setFollowersCount(p => p + 1);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  if (!profile || profile.isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-screen">
        <User size={32} className="text-zinc-500 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Pengguna Tidak Ditemukan</h2>
        <Link href="/" className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-xs mt-4">Kembali</Link>
      </div>
    );
  }

  const themeColor = profile.theme_color || 'amber';
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

  const displayName = profile.display_name || profile.username || 'Pengguna';
  const avatarUrl = profile.avatar_url || '/avatar.jpeg';
  const bannerUrl = profile.banner_url || '';
  
  const role = profile.role || 'User';
  const usernameStr = (profile.username || profile.display_name || '').toLowerCase();
  const isAdmin = role === 'Developer' || role === 'Admin' || role === 'Moderator' || usernameStr.includes('admin') || usernameStr.includes('dev');
  const isVerified = profile.is_verified || isAdmin;
  const isSpecial = isAdmin || isVerified;
  const level = profile.level || 1;
  const currentExp = profile.exp || 0;
  const expNeeded = level * 100;
  const expPercentage = Math.min(100, Math.round((currentExp / expNeeded) * 100));
  const totalExp = ((level - 1) * 100) + currentExp; 
  const bio = profile.bio || 'Belum ada bio.';
  const rankNames = ['Rookie', 'Veteran', 'Elite', 'Legend', 'Mythic'];
  const currentRank = rankNames[Math.min(Math.floor(level / 20), rankNames.length - 1)];

  return (
    <div className="flex-1 min-w-0 pb-16 font-sans">
      <div className="w-full">
        {/* Banner */}
        <div className="w-full h-36 sm:h-48 lg:h-64 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-zinc-800/20 uppercase tracking-[0.2em] select-none">KAAOFFC</h1>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10"></div>
          <Link href="/" className="absolute top-3 left-3 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-rose-500 transition-colors z-20">
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Profile Header */}
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 -mt-14 sm:-mt-20 relative z-20 flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-5">
          <div className="relative shrink-0">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-900 overflow-hidden shadow-xl ${isAdmin ? 'border-4 border-blue-500' : `border-[3px] border-[#0a0a0a] ring-2 ${theme.ring} ring-offset-2 ring-offset-[#0a0a0a]`}`}>
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className={`absolute bottom-1 right-1 w-7 h-7 ${theme.bg} rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-white`}>
              <Crown size={11} />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left mb-1 sm:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                {displayName}
                {isSpecial && <BadgeCheck size={16} className="text-[#1B1D2A] fill-blue-500" />}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[9px] font-bold rounded flex items-center gap-1">
                  <Sparkles size={9} className={theme.text} /> Lv.{level}
                </span>
                <span className={`px-2 py-0.5 ${theme.bg}/15 ${theme.text} text-[9px] font-bold rounded border ${theme.border}/20 uppercase tracking-wider`}>
                  {currentRank}
                </span>
                {role !== 'User' && (
                  <span className={`px-2 py-0.5 ${isAdmin ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'} text-[9px] font-bold rounded flex items-center gap-0.5`}>
                    <Shield size={8} /> {role}
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-xl line-clamp-2 mb-2">{bio}</p>
            
            <div className="flex items-center justify-center sm:justify-start gap-4 text-[11px]">
              <button onClick={() => { setFollowModalType('followers'); setShowFollowModal(true); }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><span className="font-bold text-white">{followersCount}</span> Followers</button>
              <button onClick={() => { setFollowModalType('following'); setShowFollowModal(true); }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><span className="font-bold text-white">{followingCount}</span> Following</button>
              {currentUser && currentUser.id !== userId && (
                <div className="flex gap-2 ml-2">
                  <button onClick={handleFollow}
                    className={`px-3 py-1 ${isFollowing ? 'bg-zinc-800 text-white border border-zinc-700' : `${theme.bg} text-white`} text-[10px] font-bold rounded-full transition-colors`}>
                    {isFollowing ? 'Mengikuti' : 'Ikuti'}
                  </button>
                  <Link href={`/chat?user=${userId}`} className="px-3 py-1 bg-zinc-800 text-white border border-zinc-700 text-[10px] font-bold rounded-full hover:bg-zinc-700 transition-colors flex items-center gap-1">
                    Chat
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 mt-6">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-[220px] shrink-0">
            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-1.5 sticky top-20">
              {[
                { id: 'ringkasan', label: 'Ringkasan', icon: Activity },
                { id: 'showcase', label: 'Top Favorit', icon: Star },
                { id: 'aktivitas', label: 'Aktivitas', icon: History },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === tab.id ? `${theme.bg}/10 ${theme.text}` : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  }`}>
                  <tab.icon size={14} className={activeTab === tab.id ? theme.text : 'text-zinc-500'} />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight size={12} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            
            {activeTab === 'ringkasan' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Clock, label: 'Bergabung', value: new Date(profile.created_at || Date.now()).getFullYear().toString() },
                    { icon: MonitorPlay, label: 'Aktivitas', value: activities.length.toString() },
                    { icon: Star, label: 'Favorit', value: `${showcase.length} Judul` },
                  ].map((s, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-3 text-center">
                      <s.icon className="text-zinc-600 mx-auto mb-1" size={16} />
                      <p className={`text-sm font-black ${theme.text}`}>{s.value}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
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
                      <p className="text-[10px] text-zinc-400">Total: <span className={`${theme.text} font-bold`}>{totalExp.toLocaleString()} XP</span></p>
                    </div>
                  </div>
                </div>

                {badges.length > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                    <h3 className="text-[11px] font-bold text-white mb-3 flex items-center gap-1.5">
                      <Medal className={theme.text} size={14} /> Pencapaian
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {badges.map((badge) => {
                        const IconComp = badgeIconMap[badge.badge_name] || Award;
                        return (
                          <div key={badge.id} className="flex items-center gap-2 p-2 rounded-lg" title={badge.badge_desc}>
                            <div className={`w-7 h-7 rounded-lg ${theme.bg}/15 flex items-center justify-center shrink-0`}>
                              <IconComp size={13} className={theme.text} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-white truncate">{badge.badge_name}</p>
                              <p className="text-[9px] text-zinc-500 truncate">{badge.badge_desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'showcase' && (
              <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                <h3 className="text-[11px] font-bold text-white mb-4 flex items-center gap-1.5">
                  <Pin className={theme.text} size={14} /> Favorit {displayName}
                </h3>
                {showcase.length === 0 ? (
                  <div className="text-center py-8">
                    <Star size={28} className="text-zinc-800 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500">Belum ada favorit.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {showcase.map((item, idx) => (
                      <div key={item.id} className="relative group rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/50">
                        <div className="absolute top-1 left-1 z-20 w-4 h-4 rounded bg-black/70 flex items-center justify-center text-[8px] font-black text-white">{idx + 1}</div>
                        <div className="aspect-[3/4] relative">
                          {item.item_image ? (
                            <img src={item.item_image} alt={item.item_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar.jpeg'; }} />
                          ) : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Star size={16} className="text-zinc-700" /></div>}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 w-full p-1.5 z-10">
                            <span className={`text-[7px] font-bold uppercase px-1 py-px rounded ${theme.bg}/20 ${theme.text} border ${theme.border}/20 inline-block mb-0.5`}>{item.item_type}</span>
                            <h4 className="text-[9px] font-bold text-white line-clamp-2 leading-tight">{item.item_title}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'aktivitas' && (
              <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
                <h3 className="text-[11px] font-bold text-white mb-4 flex items-center gap-1.5">
                  <Activity className={theme.text} size={14} /> Aktivitas Publik
                </h3>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <History size={28} className="text-zinc-800 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500">Belum ada aktivitas.</p>
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
                          <p className={`text-[9px] font-bold ${theme.text} uppercase tracking-wider mb-0.5`}>{act.activity_type}</p>
                          <h4 className="text-[10px] font-bold text-white truncate">{act.target_title}</h4>
                          {act.content && <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1">{act.content}</p>}
                          <span className="text-[8px] text-zinc-600 flex items-center gap-1 mt-0.5">
                            <Clock size={8} /> {new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {visibleActivities < activities.length && (
                      <button onClick={() => setVisibleActivities(p => p + 10)}
                        className="w-full py-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1">
                        Muat Lebih Banyak <ChevronRight size={10} className="rotate-90" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <FollowListModal isOpen={showFollowModal} onClose={() => setShowFollowModal(false)} userId={userId} type={followModalType} />
    </div>
  );
}
