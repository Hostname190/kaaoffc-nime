import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, content, reply_to, reply_to_username, level, level_text, avatar_url, display_name, role, is_verified, audio_url } = body;

    if (!user_id || (!content && !audio_url)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. RATE LIMITING CHECK
    // Check if the user has sent a message in the last 3 seconds
    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();
    
    const { data: recentMessages, error: rateLimitError } = await supabaseAdmin
      .from('global_messages')
      .select('id, created_at')
      .eq('user_id', user_id)
      .gte('created_at', threeSecondsAgo)
      .limit(1);

    if (rateLimitError) {
      console.error('[Rate limit check error]', rateLimitError);
    }

    if (recentMessages && recentMessages.length > 0) {
      return NextResponse.json({ error: 'Tunggu beberapa detik sebelum mengirim pesan lagi (Anti-Spam).' }, { status: 429 });
    }

    // 2. SECURITY CHECK: Verify user actually has these roles/verified status in DB
    // We don't trust the client payload for role and is_verified
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, is_verified')
      .eq('id', user_id)
      .single();

    // 3. INSERT MESSAGE
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
    const metaData = authUser?.user?.user_metadata || {};
    
    const dbRole = (profile?.role || '').toLowerCase();
    const metaRole = (metaData.role || '').toLowerCase();
    const username = (metaData.username || metaData.display_name || '').toLowerCase();
    const isVerifiedMeta = metaData.is_verified || false;

    const isDbAdmin = dbRole.includes('admin') || dbRole.includes('developer') || dbRole.includes('moderator') || dbRole.includes('owner') ||
                      metaRole.includes('admin') || metaRole.includes('developer') || metaRole.includes('moderator') ||
                      username.includes('admin') || username.includes('dev') || username.includes('cs') || isVerifiedMeta;

    const isVerified = profile?.is_verified || isDbAdmin;

    const msgData = {
      ...body,
      user_id,
      content: content ? content.trim().substring(0, 1000) : null,
      audio_url: audio_url || null,
      // Overrides for security
      roles: isDbAdmin ? [metaData.role || profile?.role || 'Admin'] : [profile?.role || 'User'],
      is_verified: isVerified
    };

    // Remove undefined/invalid fields that we accidentally added in previous version
    delete msgData.role;
    delete msgData.display_name;
    delete msgData.level;

    const { data: newMsg, error: insertError } = await supabaseAdmin
      .from('global_messages')
      .insert([msgData])
      .select()
      .single();

    if (insertError) {
      console.error('[Insert message error]', insertError);
      return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error: any) {
    console.error('[Chat API Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
