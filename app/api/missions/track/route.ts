import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // We need user session, so use regular supabase client
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { action_type } = await req.json();

    // Dapatkan user saat ini
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Cari misi aktif dengan action_type tersebut
    const { data: activeMissions, error: mError } = await supabaseAdmin
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .eq('action_type', action_type);

    if (mError) throw mError;
    if (!activeMissions || activeMissions.length === 0) {
      return NextResponse.json({ message: 'No active mission for this action' });
    }

    // Untuk setiap misi yang sesuai, tambahkan progress
    const results = [];
    
    for (const mission of activeMissions) {
      const { data: currentProgress } = await supabaseAdmin
        .from('user_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .maybeSingle();

      let isOldProgress = false;
      if (currentProgress && currentProgress.created_at) {
          const progressDate = new Date(currentProgress.created_at);
          const today = new Date();
          today.setHours(0,0,0,0);
          if (progressDate < today) {
              isOldProgress = true;
          }
      }

      if (currentProgress?.is_completed && !isOldProgress) continue;

      let baseProgress = isOldProgress ? 0 : (currentProgress?.progress || 0);
      let newProgress = baseProgress + 1;
      let isCompleted = newProgress >= mission.target_count;

      const { error: upsertError } = await supabaseAdmin
        .from('user_missions')
        .upsert({
          id: currentProgress?.id,
          user_id: userId,
          mission_id: mission.id,
          progress: newProgress,
          is_completed: isCompleted,
          last_claimed_at: isCompleted ? new Date().toISOString() : (isOldProgress ? null : currentProgress?.last_claimed_at),
          created_at: isOldProgress ? new Date().toISOString() : (currentProgress?.created_at || new Date().toISOString())
        }, { onConflict: 'user_id, mission_id' });

      if (upsertError) continue;

      if (isCompleted) {
        // Berikan EXP
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        let currentExp = profile?.exp || 0;
        let currentLevel = profile?.level || 1;
        
        currentExp += mission.exp_reward;
        
        let expNeeded = currentLevel * 100;
        if (currentExp >= expNeeded) {
          currentLevel += 1;
          currentExp -= expNeeded;
        }

        await supabaseAdmin
          .from('profiles')
          .upsert({ 
            id: userId,
            level: currentLevel, 
            exp: currentExp,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        // Sinkronisasi ke auth.users metadata agar UI langsung update
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { exp: currentExp, level: currentLevel }
        });
      }
      
      results.push({ mission_id: mission.id, progress: newProgress, is_completed: isCompleted });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
