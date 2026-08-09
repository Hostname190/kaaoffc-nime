// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemUrl = searchParams.get('itemUrl');
  const userId = searchParams.get('userId'); // Optional: untuk mengecek status Like

  if (!itemUrl) {
    return NextResponse.json({ error: 'itemUrl is required' }, { status: 400 });
  }

  // Ambil komentar berdasarkan itemUrl atau global jika 'all'
  let query = supabase.from('comments').select('*');
  
  if (itemUrl !== 'all') {
    query = query.eq('item_url', itemUrl).order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false }).limit(20);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GET comments error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dapatkan role dari auth user metadata
  let roleMap = new Map();
  try {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    if (authData?.users) {
      roleMap = new Map(authData.users.map(u => [u.id, u.user_metadata?.role || 'User']));
    }
  } catch (e) {
    console.error('[GET comments] failed to fetch auth users for roles:', e);
  }

  // Cek komentar mana saja yang sudah di-like oleh user ini
  let userLikes = new Set();
  if (userId && data && data.length > 0) {
    const commentIds = data.map(c => c.id);
    const { data: likesData } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds);
    
    if (likesData) {
      userLikes = new Set(likesData.map(l => l.comment_id));
    }
  }

  const commentsWithRole = data?.map(c => ({
    ...c,
    user_role: roleMap.get(c.user_id) || 'User',
    user_has_liked: userLikes.has(c.id)
  }));

  // Jika butuh descending di parent, kita bisa sort manual atau serahkan ke frontend
  return NextResponse.json(commentsWithRole || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemUrl, userId, userEmail, userAvatar, content, userLevel, userExp, parentId } = body;

    if (!itemUrl || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
    
    let currentExp = profile?.exp ?? userExp ?? 0;
    let currentLevel = profile?.level ?? userLevel ?? 1;
    
    const newExp = currentExp + 10;
    const calculatedLevel = Math.floor(newExp / 100) + 1;
    const newLevel = Math.max(currentLevel, calculatedLevel);

    const { data: commentData, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert([{
        item_url: itemUrl,
        user_id: userId,
        user_email: userEmail,
        user_avatar: userAvatar,
        content: content,
        user_level: newLevel,
        parent_id: parentId || null
      }])
      .select()
      .single();

    if (commentError) throw commentError;

    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        exp: newExp,
        level: newLevel,
        display_name: profile?.display_name || userEmail,
        avatar_url: profile?.avatar_url || userAvatar,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    // Insert activity history
    const activityTitle = itemUrl.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    await supabaseAdmin.from('user_activities').insert({
      user_id: userId,
      activity_type: parentId ? 'BALASAN SAYA' : 'KOMENTAR SAYA',
      target_title: activityTitle,
      target_url: itemUrl,
      content: content,
      xp_earned: 10
    });

    return NextResponse.json({ 
      ...commentData,
      newExp,
      newLevel,
      levelUp: newLevel > currentLevel
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, commentId, userId, content } = body;

    if (!commentId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'edit') {
      if (!content) return NextResponse.json({ error: 'Content required for edit' }, { status: 400 });
      
      const { data, error } = await supabaseAdmin
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', userId) // Hanya pemilik yang bisa edit
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json(data);
      
    } else if (action === 'like' || action === 'unlike') {
      if (action === 'like') {
        const { error: likeError } = await supabaseAdmin
          .from('comment_likes')
          .insert([{ comment_id: commentId, user_id: userId }]);
          
        if (likeError && likeError.code !== '23505') throw likeError; // Abaikan jika sudah pernah like
        
        // Increment count
        await supabaseAdmin.rpc('increment_like', { row_id: commentId }).catch(async () => {
           // Fallback if RPC doesn't exist
           const { data: c } = await supabaseAdmin.from('comments').select('likes_count').eq('id', commentId).single();
           await supabaseAdmin.from('comments').update({ likes_count: (c?.likes_count || 0) + 1 }).eq('id', commentId);
        });
      } else {
        await supabaseAdmin
          .from('comment_likes')
          .delete()
          .match({ comment_id: commentId, user_id: userId });
          
        // Decrement count
        await supabaseAdmin.rpc('decrement_like', { row_id: commentId }).catch(async () => {
           // Fallback if RPC doesn't exist
           const { data: c } = await supabaseAdmin.from('comments').select('likes_count').eq('id', commentId).single();
           await supabaseAdmin.from('comments').update({ likes_count: Math.max(0, (c?.likes_count || 0) - 1) }).eq('id', commentId);
        });
      }
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!commentId || !userId) {
      return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 });
    }

    // Hanya bisa hapus jika user adalah pembuat komentar
    // Note: Jika butuh admin hapus komentar orang lain, perlu cek role di sini
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
