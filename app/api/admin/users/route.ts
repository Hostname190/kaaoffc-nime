// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Ambil daftar seluruh user langsung dari Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('[GET admin/users error]', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Ambil juga data profiles jika ada perubahan EXP/Level yang belum sinkron ke Auth
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Gabungkan data Auth dan Profiles
    const users = authData.users.map(u => {
      const p = profilesMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        display_name: p?.display_name || u.user_metadata?.display_name || u.email?.split('@')[0],
        avatar_url: p?.avatar_url || u.user_metadata?.avatar_url,
        level: p?.level || u.user_metadata?.level || 1,
        exp: p?.exp || u.user_metadata?.exp || 0,
        is_banned: u.user_metadata?.is_banned || false,
        ban_reason: u.user_metadata?.ban_reason || '',
        role: u.user_metadata?.role || 'User',
        created_at: u.created_at,
        updated_at: p?.updated_at || u.updated_at
      };
    });

    // Urutkan berdasarkan level tertinggi
    users.sort((a, b) => b.level - a.level || b.exp - a.exp);

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('[GET admin/users catch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
