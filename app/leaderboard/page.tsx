// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { Trophy, Medal, Crown, Star, Shield, Loader2, Sparkles, Search, TrendingUp, Users, Zap, ChevronUp, ChevronDown, Filter, Flame, Award, Target, Eye } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';

// Helper: tentukan tier berdasarkan level
function getUserTier(level: number) {
  if (level >= 100) return { name: 'Mythic', icon: Crown, color: 'from-rose-500 via-purple-500 to-indigo-500', text: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]', effect: 'animate-pulse border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]', badge: 'bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500' };
  if (level >= 50)  return { name: 'Legend', icon: Crown, color: 'from-amber-400 via-yellow-500 to-orange-500', text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]', effect: 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]', badge: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500' };
  if (level >= 30)  return { name: 'Elite', icon: Sparkles, color: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]', effect: '', badge: 'bg-gradient-to-r from-cyan-400 to-blue-500' };
  if (level >= 10)  return { name: 'Veteran', icon: Shield, color: 'from-emerald-400 to-green-500', text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', glow: '', effect: '', badge: 'bg-gradient-to-r from-emerald-400 to-green-500' };
  if (level >= 5)   return { name: 'Rising', icon: TrendingUp, color: 'from-violet-400 to-purple-500', text: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10', glow: '', effect: '', badge: 'bg-gradient-to-r from-violet-400 to-purple-500' };
  return { name: 'Rookie', icon: Star, color: 'from-zinc-400 to-zinc-500', text: 'text-zinc-400', border: 'border-zinc-700', bg: 'bg-zinc-800', glow: '', effect: '', badge: 'bg-zinc-700' };
}

type SortMode = 'exp' | 'level';
type FilterTier = 'all' | 'Mythic' | 'Legend' | 'Elite' | 'Veteran' | 'Rising' | 'Rookie';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('exp');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Stats
  const stats = useMemo(() => {
    if (users.length === 0) return { total: 0, totalExp: 0, avgLevel: 0, topTier: '' };
    const totalExp = users.reduce((acc, u) => acc + (u.exp || 0), 0);
    const avgLevel = Math.round(users.reduce((acc, u) => acc + (u.level || 0), 0) / users.length);
    const topUser = users[0];
    const topTier = topUser ? getUserTier(topUser.level).name : '';
    return { total: users.length, totalExp, avgLevel, topTier };
  }, [users]);

  // Sorted & Filtered users
  const processedUsers = useMemo(() => {
    let result = [...users];
    
    // Filter by search
    if (searchQuery) {
      result = result.filter(u => 
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tier
    if (filterTier !== 'all') {
      result = result.filter(u => getUserTier(u.level).name === filterTier);
    }
    
    // Sort
    if (sortMode === 'level') {
      result.sort((a, b) => b.level - a.level || b.exp - a.exp);
    } else {
      result.sort((a, b) => b.exp - a.exp);
    }
    
    return result;
  }, [users, searchQuery, filterTier, sortMode]);

  const top3 = users.slice(0, 3);

  // Find current user rank
  const currentUserRank = useMemo(() => {
    if (!currentUser) return null;
    const idx = users.findIndex(u => u.id === currentUser.id);
    return idx >= 0 ? idx + 1 : null;
  }, [users, currentUser]);

  const currentUserData = useMemo(() => {
    if (!currentUser) return null;
    return users.find(u => u.id === currentUser.id) || null;
  }, [users, currentUser]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown size={22} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />;
      case 1: return <Medal size={20} className="text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.6)]" />;
      case 2: return <Medal size={20} className="text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />;
      default: return <span className="font-black text-base text-zinc-500">#{index + 1}</span>;
    }
  };

  const tierFilters: { value: FilterTier; label: string; color: string }[] = [
    { value: 'all', label: 'Semua', color: 'bg-zinc-700' },
    { value: 'Mythic', label: 'Mythic', color: 'bg-gradient-to-r from-rose-500 to-purple-500' },
    { value: 'Legend', label: 'Legend', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
    { value: 'Elite', label: 'Elite', color: 'bg-gradient-to-r from-cyan-400 to-blue-500' },
    { value: 'Veteran', label: 'Veteran', color: 'bg-gradient-to-r from-emerald-400 to-green-500' },
    { value: 'Rising', label: 'Rising', color: 'bg-gradient-to-r from-violet-400 to-purple-500' },
    { value: 'Rookie', label: 'Rookie', color: 'bg-zinc-600' },
  ];

  const PodiumUser = ({ user, rank }: { user: any, rank: number }) => {
    if (!user) return <div className="flex-1"></div>;
    const isFirst = rank === 1;
    const tier = getUserTier(user.level);
    const TierIcon = tier?.icon || Star;
    
    const avatarSize = isFirst ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-16 h-16 sm:w-20 sm:h-20';
    const podiumHeight = isFirst ? 'h-32 sm:h-40' : rank === 2 ? 'h-24 sm:h-32' : 'h-20 sm:h-28';
    
    const theme = isFirst 
      ? { border: 'border-yellow-400', glow: 'drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]', cardBg: 'bg-gradient-to-b from-yellow-500/20 via-yellow-600/5 to-zinc-900/80', cardBorder: 'border-yellow-500/30' }
      : rank === 2 
        ? { border: 'border-zinc-300', glow: 'drop-shadow-[0_0_10px_rgba(212,212,216,0.3)]', cardBg: 'bg-gradient-to-b from-zinc-400/15 via-zinc-500/5 to-zinc-900/80', cardBorder: 'border-zinc-400/30' }
        : { border: 'border-amber-600', glow: 'drop-shadow-[0_0_10px_rgba(217,119,6,0.3)]', cardBg: 'bg-gradient-to-b from-amber-600/20 via-amber-700/5 to-zinc-900/80', cardBorder: 'border-amber-600/30' };

    return (
      <div className={`flex flex-col items-center ${isFirst ? 'z-20 order-2 mx-[-8px]' : rank === 2 ? 'z-10 order-1' : 'z-10 order-3'}`} style={{ flex: isFirst ? '1.15' : '1' }}>
        {/* Medal/Crown */}
        <div className="mb-1.5">
          {isFirst && <Crown size={32} className={`text-yellow-400 animate-bounce ${theme.glow}`} />}
          {rank === 2 && <Medal size={24} className={`text-zinc-300 ${theme.glow}`} />}
          {rank === 3 && <Medal size={24} className={`text-amber-600 ${theme.glow}`} />}
        </div>
        
        {/* Avatar */}
        <div className={`relative ${avatarSize} rounded-full overflow-hidden border-[3px] ${theme.border} ${theme.glow} bg-zinc-900 shrink-0`}>
          <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
        </div>
        
        {/* Card podium */}
        <div className={`w-full ${podiumHeight} -mt-4 pt-6 px-2 sm:px-3 rounded-t-2xl ${theme.cardBg} border ${theme.cardBorder} border-b-0 flex flex-col items-center gap-1 overflow-hidden`}>
          <p className="font-black text-[11px] sm:text-xs text-white truncate w-full text-center leading-tight" title={user.displayName}>
            {user.displayName}
          </p>
          
          <span className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${tier.badge} text-white`}>
             <TierIcon size={9} /> Lv.{user.level}
          </span>
          
          <span className="text-[9px] sm:text-[10px] font-bold text-amber-400/80 tracking-wide flex items-center gap-0.5 whitespace-nowrap">
            <Sparkles size={8} />
            {user.exp.toLocaleString()} <span className="opacity-60 text-[7px]">XP</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 min-w-0 pb-10">
        
        {/* Header */}
        <div className="relative mb-6 p-6 sm:p-8 rounded-2xl overflow-hidden border border-zinc-800/60" style={{ background: 'linear-gradient(135deg, #18181b 0%, #1c1917 50%, #18181b 100%)' }}>
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="p-3 rounded-xl mb-3 border border-zinc-800" style={{ backgroundColor: 'rgba(39,39,42,0.6)' }}>
              <Trophy size={32} className="text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-1.5">
              Hall of Fame
            </h1>
            <p className="text-zinc-500 font-medium text-xs sm:text-sm max-w-md">
              Papan peringkat pahlawan paling aktif di Kaaoffc
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && users.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.8)' }}>
              <Users size={16} className="text-amber-500 mb-1" />
              <span className="text-lg sm:text-xl font-black text-white">{stats.total}</span>
              <span className="text-[10px] text-zinc-500 font-medium">Total Player</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.8)' }}>
              <Zap size={16} className="text-yellow-500 mb-1" />
              <span className="text-lg sm:text-xl font-black text-white">{stats.totalExp.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 font-medium">Total XP</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.8)' }}>
              <TrendingUp size={16} className="text-emerald-500 mb-1" />
              <span className="text-lg sm:text-xl font-black text-white">Lv.{stats.avgLevel}</span>
              <span className="text-[10px] text-zinc-500 font-medium">Rata-rata</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.8)' }}>
              <Crown size={16} className="text-rose-500 mb-1" />
              <span className="text-lg sm:text-xl font-black text-white">{stats.topTier}</span>
              <span className="text-[10px] text-zinc-500 font-medium">Top Tier</span>
            </div>
          </div>
        )}

        {/* Your Rank Card */}
        {!loading && currentUserData && currentUserRank && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(24,24,27,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50 shrink-0">
              <img src={currentUserData.avatarUrl} alt="You" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-black text-sm text-white truncate">{currentUserData.displayName}</span>
                <span className="text-[9px] uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black shrink-0">Kamu</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="font-bold">Rank #{currentUserRank}</span>
                <span>Lv.{currentUserData.level}</span>
                <span>{currentUserData.exp.toLocaleString()} XP</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-amber-400">#{currentUserRank}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-amber-500 animate-spin mb-4" />
            <p className="text-zinc-500 font-medium text-sm animate-pulse">Menghitung Peringkat...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.5)' }}>
            <Shield size={48} className="text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Belum ada pahlawan</h2>
            <p className="text-zinc-500 text-sm">Jadilah yang pertama untuk memanjat peringkat!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* Top 3 Podium */}
            {top3.length > 0 && !searchQuery && filterTier === 'all' && (
              <div className="flex items-end justify-center gap-2 sm:gap-3 px-2 sm:px-4 mt-6 mb-4 max-w-lg mx-auto w-full">
                <PodiumUser user={top3[1]} rank={2} />
                <PodiumUser user={top3[0]} rank={1} />
                <PodiumUser user={top3[2]} rank={3} />
              </div>
            )}

            {/* Search + Controls */}
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="Cari pahlawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all border border-zinc-800 focus:border-zinc-600"
                  style={{ backgroundColor: 'rgba(24,24,27,0.8)' }}
                />
              </div>

              {/* Sort + Filter Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortMode(sortMode === 'exp' ? 'level' : 'exp')}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-zinc-800 transition-colors hover:border-zinc-600"
                  style={{ backgroundColor: 'rgba(24,24,27,0.8)', color: '#a1a1aa' }}
                >
                  {sortMode === 'exp' ? <Sparkles size={12} /> : <TrendingUp size={12} />}
                  {sortMode === 'exp' ? 'By XP' : 'By Level'}
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${showFilters || filterTier !== 'all' ? 'border-amber-500/50 text-amber-400' : 'border-zinc-800 hover:border-zinc-600'}`}
                  style={{ backgroundColor: showFilters || filterTier !== 'all' ? 'rgba(245,158,11,0.08)' : 'rgba(24,24,27,0.8)', color: showFilters || filterTier !== 'all' ? undefined : '#a1a1aa' }}
                >
                  <Filter size={12} />
                  Filter{filterTier !== 'all' ? `: ${filterTier}` : ''}
                </button>
                
                {/* Result count */}
                <span className="text-[10px] text-zinc-600 font-medium ml-auto">
                  {processedUsers.length} player
                </span>
              </div>

              {/* Tier Filter Chips */}
              {showFilters && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.6)' }}>
                  {tierFilters.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => setFilterTier(tf.value)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                        filterTier === tf.value 
                          ? `${tf.color} text-white` 
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User List */}
            <div className="flex flex-col gap-2">
              {processedUsers.map((u, i) => {
                const globalIndex = users.findIndex(user => user.id === u.id);
                // Sembunyikan top 3 dari list bawah jika tidak sedang search/filter
                if (!searchQuery && filterTier === 'all' && globalIndex < 3) return null;

                const isCurrentUser = currentUser?.id === u.id;
                const tier = getUserTier(u.level);
                const TierIcon = tier?.icon || Star;
                const isHighLevel = u.level >= 10;
                const isHighlighted = highlightedUser === u.id;
                
                return (
                  <div 
                    key={u.id}
                    onMouseEnter={() => setHighlightedUser(u.id)}
                    onMouseLeave={() => setHighlightedUser(null)}
                    className={`relative flex items-center p-3 sm:p-4 rounded-xl transition-all duration-200 overflow-hidden border ${
                      isCurrentUser 
                        ? 'border-amber-500/40' 
                        : isHighlighted
                          ? 'border-zinc-700'
                          : 'border-zinc-800/60'
                    }`}
                    style={{ 
                      backgroundColor: isCurrentUser 
                        ? 'rgba(245,158,11,0.06)' 
                        : isHighlighted 
                          ? 'rgba(39,39,42,0.5)' 
                          : 'rgba(24,24,27,0.4)'
                    }}
                  >
                    {/* Animated bg for high level */}
                    {isHighLevel && tier && u.level >= 50 && (
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ background: `radial-gradient(circle, currentColor, transparent 70%)` }}></div>
                    )}

                    {/* Rank */}
                    <div className="w-10 sm:w-12 flex justify-center shrink-0 z-10">
                      {getRankIcon(globalIndex)}
                    </div>
                    
                    {/* Avatar */}
                    <div className="relative shrink-0 mx-2 sm:mx-3 z-10 flex items-center justify-center">
                      {isHighLevel && tier && u.level >= 50 && (
                        <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${tier.color} animate-[spin_4s_linear_infinite] blur-[2px] opacity-50`}></div>
                      )}
                      {isHighLevel && tier && u.level >= 10 && u.level < 50 && (
                        <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-r ${tier.color} opacity-40`}></div>
                      )}
                      
                      <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full ${isHighLevel && tier ? `p-[2px] bg-gradient-to-tr ${tier.color}` : 'border border-zinc-800'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                          <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/avatar.jpeg'; }} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 z-10">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <h3 className={`text-sm font-bold truncate max-w-[120px] sm:max-w-none ${
                          isHighLevel && tier ? tier.text : 'text-white'
                        }`}>
                          {u.displayName}
                        </h3>
                        {isCurrentUser && <span className="text-[8px] uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black">Kamu</span>}
                        {tier && (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${tier.bg} ${tier.text} border ${tier.border}`}>
                            <TierIcon size={8} /> {tier.name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${isHighLevel && tier ? tier.text : 'text-zinc-500'}`}>
                          <TierIcon size={11} className={isHighLevel && tier && u.level >= 50 ? 'animate-pulse' : ''} />
                          <span className="text-xs font-bold">Lv.{u.level}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Sparkles size={11} />
                          <span className="text-xs font-medium">{u.exp.toLocaleString()} XP</span>
                        </div>
                      </div>
                    </div>

                    {/* XP Progress mini bar */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 z-10 ml-2">
                      <span className="text-[10px] font-bold text-zinc-500">Next Lv.</span>
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(39,39,42,0.8)' }}>
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all`}
                          style={{ width: `${Math.min(100, (u.exp % 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {processedUsers.length === 0 && (searchQuery || filterTier !== 'all') && (
                <div className="text-center py-12 rounded-xl border border-zinc-800" style={{ backgroundColor: 'rgba(24,24,27,0.4)' }}>
                  <Search size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm font-medium">
                    {searchQuery ? `Tidak ada pahlawan "${searchQuery}"` : `Tidak ada player tier ${filterTier}`}
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterTier('all'); }}
                    className="mt-3 text-xs text-amber-500 hover:text-amber-400 font-bold transition-colors"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Sidebar />
    </>
  );
}
