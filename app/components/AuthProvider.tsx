// @ts-nocheck
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUserMeta: (data: any) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  updateUserMeta: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (currentUser: User) => {
    try {
      const meta = currentUser.user_metadata || {};
      const displayName = meta.display_name || currentUser.email?.split('@')[0] || 'Pengguna';
      const avatarUrl = meta.avatar_url || '/avatar.jpeg';

      // Panggil API server-side agar bisa pakai Admin key dan bypass RLS
      await fetch('/api/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          level: meta.level || 1,
          exp: meta.exp || 0,
          display_name: displayName,
          avatar_url: avatarUrl,
          bio: meta.bio,
          banner_url: meta.banner_url,
          role: meta.role,
          is_verified: meta.is_verified,
        }),
      });
    } catch (e) {
      console.error('Error syncing profile', e);
    }
  };

  // Logic Leveling & Daily EXP
  const checkDailyLogin = async (currentUser: User) => {
    try {
      const today = new Date().toDateString();
      const meta = currentUser.user_metadata || {};
      
      const lastLogin = meta.last_daily_login;
      
      if (lastLogin !== today) {
        // Berikan EXP
        let currentExp = meta.exp || 0;
        let currentLevel = meta.level || 1;
        
        currentExp += 50; // Bonus harian
        
        // Cek naik level (misal batasnya level * 100)
        let expNeeded = currentLevel * 100;
        if (currentExp >= expNeeded) {
          currentLevel += 1;
          currentExp -= expNeeded; // Reset atau lanjutkan sisa exp
        }
        
        const { data, error } = await supabase.auth.updateUser({
          data: {
            exp: currentExp,
            level: currentLevel,
            last_daily_login: today,
          }
        });
        
        if (!error) {
          // Sync level ke tabel profiles
          const displayName = currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'Pengguna';
          const avatarUrl = currentUser.user_metadata?.avatar_url || '/avatar.jpeg';
          supabase.from('profiles').upsert({ 
            id: currentUser.id, 
            level: currentLevel,
            exp: currentExp,
            display_name: displayName,
            avatar_url: avatarUrl
          }).then();
        }
        
        if (data.user) {
          setUser(data.user);
          syncProfile(data.user); // Sync after daily update
        }
      } else {
        // Sync profile anyway to ensure user_metadata modifications (like cheats) are reflected in profiles table
        syncProfile(currentUser);
      }
    } catch (e) {
      console.error('Error daily login check', e);
    }
  };

  useEffect(() => {
    // Ambil session saat pertama kali load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkDailyLogin(session.user);
      }
      setLoading(false);
    });

    // Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN' && session?.user) {
        checkDailyLogin(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
      }
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUserMeta = async (data: any) => {
    const { data: result, error } = await supabase.auth.updateUser({ data });
    if (error) return { error: error.message };
    if (result.user) {
      setUser(result.user);
      // Jika ada update data profil dasar, pastikan sync langsung
      if (data.level !== undefined || data.exp !== undefined || data.display_name !== undefined || data.avatar_url !== undefined || data.bio !== undefined || data.banner_url !== undefined) {
        const currentMeta = result.user.user_metadata;
        const displayName = currentMeta?.display_name || result.user.email?.split('@')[0] || 'Pengguna';
        const avatarUrl = currentMeta?.avatar_url || '/avatar.jpeg';
        
        const updatePayload: any = {
          id: result.user.id, 
          level: currentMeta?.level || 1,
          exp: currentMeta?.exp || 0,
          display_name: displayName,
          avatar_url: avatarUrl
        };
        
        if (currentMeta?.bio !== undefined) updatePayload.bio = currentMeta.bio;
        if (currentMeta?.banner_url !== undefined) updatePayload.banner_url = currentMeta.banner_url;
        if (currentMeta?.role !== undefined) updatePayload.role = currentMeta.role;
        if (currentMeta?.is_verified !== undefined) updatePayload.is_verified = currentMeta.is_verified;

        supabase.from('profiles').upsert(updatePayload).then();
      }
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signUp, signOut, updateUserMeta }}>
      {children}
    </AuthContext.Provider>
  );
}
