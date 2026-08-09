// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, action, amount } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Dapatkan profil saat ini untuk cek EXP dari auth admin
    const { data: { user: adminUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let currentExp = adminUser.user_metadata?.exp || 0;
    let currentLevel = adminUser.user_metadata?.level || 1;
    
    // Tambah EXP
    const newExp = currentExp + amount;
    
    // Hitung level baru (100 exp = 1 level). 
    const calculatedLevel = Math.floor(newExp / 100) + 1;
    const newLevel = Math.max(currentLevel, calculatedLevel);

    // 2. Update EXP dan Level di tabel profiles
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        exp: newExp,
        level: newLevel,
        display_name: adminUser.user_metadata?.display_name || adminUser.email?.split('@')[0],
        avatar_url: adminUser.user_metadata?.avatar_url || '/avatar.jpeg',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    // 3. Update metadata auth (supaya sinkron di web)
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        exp: newExp,
        level: newLevel,
        display_name: adminUser.user_metadata?.display_name || adminUser.email?.split('@')[0],
        avatar_url: adminUser.user_metadata?.avatar_url || '/avatar.jpeg'
      }
    });

    return NextResponse.json({ 
      success: true,
      newExp,
      newLevel,
      levelUp: newLevel > currentLevel
    });
  } catch (error: any) {
    console.error('[POST add-exp catch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
