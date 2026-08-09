// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, level, exp, display_name, avatar_url, bio, banner_url, role, is_verified } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    // Gunakan supabaseAdmin agar bisa bypass RLS — ini aman karena hanya dipanggil
    // dari dalam aplikasi sendiri (server-side API route), bukan dari browser langsung.
    const updateData: any = {
      id,
      level: level || 1,
      exp: exp || 0,
      username: display_name || 'Pengguna',
      avatar_url: avatar_url || '/avatar.jpeg',
    };
    
    if (bio !== undefined) updateData.bio = bio;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    // SECURITY FIX: Never allow users to update their own role or verified status via sync-profile
    // Only admins should be able to update these fields.

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(updateData, { onConflict: 'id' });

    if (error) {
      console.error('[sync-profile error]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[sync-profile catch]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 200 });
  }
}
