import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Ambil semua misi aktif
    const { data: missions, error: mError } = await supabaseAdmin
      .from('missions')
      .select('*')
      .eq('is_active', true);

    if (mError) throw mError;

    // Ambil progress user
    const { data: userMissions, error: umError } = await supabaseAdmin
      .from('user_missions')
      .select('*')
      .eq('user_id', userId);

    if (umError) throw umError;

    // Gabungkan data
    const userMissionsMap = new Map(userMissions.map((um: any) => [um.mission_id, um]));

    // Untuk check reset hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const merged = missions.map((m: any) => {
      let progress = userMissionsMap.get(m.id);
      
      if (progress && progress.created_at) {
         const progressDate = new Date(progress.created_at);
         if (progressDate < today) {
            // progress sudah usang, reset di client side
            progress = null;
         }
      }

      return {
        ...m,
        progress: progress?.progress || 0,
        is_completed: progress?.is_completed || false,
        last_claimed_at: progress?.last_claimed_at || null
      };
    });

    return NextResponse.json(merged);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, mission_id } = body;

    if (!user_id || !mission_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Dapatkan data misi
    const { data: mission, error: mError } = await supabaseAdmin
      .from('missions')
      .select('*')
      .eq('id', mission_id)
      .single();

    if (mError || !mission) throw new Error('Mission not found');

    if (mission.action_type !== 'login_daily') {
      return NextResponse.json({ error: 'Misi ini hanya bisa diselesaikan otomatis saat Anda membaca atau menonton.' }, { status: 400 });
    }

    // Cek progress saat ini
    const { data: currentProgress, error: cpError } = await supabaseAdmin
      .from('user_missions')
      .select('*')
      .eq('user_id', user_id)
      .eq('mission_id', mission_id)
      .maybeSingle();

    if (cpError) throw cpError;

    let isOldProgress = false;
    if (currentProgress && currentProgress.created_at) {
        const progressDate = new Date(currentProgress.created_at);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (progressDate < today) {
            isOldProgress = true;
        }
    }

    let baseProgress = isOldProgress ? 0 : (currentProgress?.progress || 0);
    
    // Jika sudah completed sebelumnya, tidak bisa diclaim lagi
    if (currentProgress?.is_completed && !isOldProgress) {
      return NextResponse.json({ error: 'Mission already completed' }, { status: 400 });
    }

    let newProgress = baseProgress + 1;
    let isCompleted = newProgress >= mission.target_count;

    const { error: upsertError } = await supabaseAdmin
      .from('user_missions')
      .upsert({
        id: currentProgress?.id,
        user_id,
        mission_id,
        progress: newProgress,
        is_completed: isCompleted,
        last_claimed_at: isCompleted ? new Date().toISOString() : (isOldProgress ? null : currentProgress?.last_claimed_at),
        created_at: isOldProgress ? new Date().toISOString() : (currentProgress?.created_at || new Date().toISOString())
      }, { onConflict: 'user_id, mission_id' });

    if (upsertError) throw upsertError;

    // Jika misi baru saja selesai, berikan EXP
    if (isCompleted) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .maybeSingle();
        
      let currentExp = profile?.exp || 0;
      let currentLevel = profile?.level || 1;
      
      currentExp += mission.exp_reward;
      
      let expNeeded = currentLevel * 100;
      if (currentExp >= expNeeded) {
        currentLevel += 1;
        currentExp -= expNeeded;
      }

      // Update profile
      await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: user_id,
          level: currentLevel, 
          exp: currentExp,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        user_metadata: { exp: currentExp, level: currentLevel }
      });
    }

    return NextResponse.json({ 
      success: true, 
      progress: newProgress, 
      is_completed: isCompleted,
      exp_rewarded: isCompleted ? mission.exp_reward : 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
