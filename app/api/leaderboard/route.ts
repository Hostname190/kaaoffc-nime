// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Gunakan supabaseAdmin agar bisa baca profiles tanpa RLS blocking
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, level, exp, display_name, avatar_url')
      .order('level', { ascending: false })
      .order('exp', { ascending: false })
      .limit(100);

    if (profileErr) {
      console.error("Error fetching profiles:", profileErr);
    }

    // Juga ambil dari comments sebagai fallback/tambahan
    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('user_id, user_email, user_avatar, user_level')
      .order('user_level', { ascending: false });

    // Gabungkan: profiles jadi prioritas, comments jadi fallback
    const userMap = new Map<string, any>();

    // Masukkan data dari comments dulu (prioritas lebih rendah)
    if (comments) {
      for (const c of comments) {
        if (!c.user_id) continue;
        const existing = userMap.get(c.user_id);
        if (!existing || (c.user_level || 1) > (existing.level || 1)) {
          userMap.set(c.user_id, {
            id: c.user_id,
            displayName: c.user_email || 'Pengguna',
            avatarUrl: c.user_avatar || '/avatar.jpeg',
            level: c.user_level || 1,
            exp: 0,
          });
        }
      }
    }

    // Override dengan data profiles (lebih akurat)
    if (profiles) {
      for (const p of profiles) {
        userMap.set(p.id, {
          id: p.id,
          displayName: p.display_name || 'Pengguna',
          avatarUrl: p.avatar_url || '/avatar.jpeg',
          level: p.level || 1,
          exp: p.exp || 0,
        });
      }
    }

    const leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.level - a.level || b.exp - a.exp)
      .slice(0, 100);

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error("Leaderboard exception:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
