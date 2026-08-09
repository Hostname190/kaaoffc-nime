import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get auth user metadata which contains the latest banner and bio
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (authError || !authUser.user) {
      // Fallback to profiles table if auth user not found
      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
      if (profile) return NextResponse.json(profile);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const meta = authUser.user.user_metadata || {};
    
    // Get profiles table data for level, exp, etc
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    
    // Merge them, preferring metadata for display fields
    const mergedProfile = {
      ...(profile || {}),
      id,
      username: meta.username || meta.display_name || profile?.username || 'Pengguna',
      display_name: meta.display_name || meta.username || profile?.username || 'Pengguna',
      avatar_url: meta.avatar_url || profile?.avatar_url || '/avatar.jpeg',
      banner_url: meta.banner_url || profile?.banner_url || '',
      bio: meta.bio || profile?.bio || 'Belum ada bio.',
      role: meta.role || profile?.role || 'User',
      is_verified: meta.is_verified || profile?.is_verified || false,
      level: meta.level || profile?.level || 1,
      exp: meta.exp || profile?.exp || 0,
    };

    return NextResponse.json(mergedProfile);
  } catch (error: any) {
    console.error('[GET /api/users/[id]] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
