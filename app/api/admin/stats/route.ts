// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Total novels
    const { count: totalNovels } = await supabaseAdmin
      .from('novels')
      .select('*', { count: 'exact', head: true });

    // Total comments
    const { count: totalComments } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true });

    // Total reports
    const { count: totalReports } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true });

    // Ambil semua user dari Supabase Auth (bukan profiles)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    const totalUsers = authData?.users?.length || 0;

    // Ambil data profiles untuk EXP/Level
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Gabungkan data auth + profiles
    const allUsers = (authData?.users || []).map(u => {
      const p = profilesMap.get(u.id);
      return {
        id: u.id,
        display_name: p?.display_name || u.user_metadata?.display_name || u.email?.split('@')[0] || 'User',
        avatar_url: p?.avatar_url || u.user_metadata?.avatar_url || '/avatar.jpeg',
        level: p?.level || u.user_metadata?.level || 1,
        exp: p?.exp || u.user_metadata?.exp || 0,
        created_at: u.created_at,
        updated_at: p?.updated_at || u.updated_at || u.created_at,
      };
    });

    // Top 5 user berdasarkan level
    const topUsers = [...allUsers]
      .sort((a, b) => b.level - a.level || b.exp - a.exp)
      .slice(0, 5);

    // 5 user terbaru berdasarkan waktu daftar
    const recentUsers = [...allUsers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return NextResponse.json({
      totalNovels: totalNovels || 0,
      totalComments: totalComments || 0,
      totalReports: totalReports || 0,
      totalUsers,
      recentUsers,
      topUsers
    });
  } catch (error: any) {
    console.error('[GET admin/stats error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
