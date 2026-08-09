// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { level, exp, role, is_banned, ban_reason } = body;

    if (level === undefined && exp === undefined && role === undefined && is_banned === undefined && ban_reason === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updateData: any = {};
    if (level !== undefined) updateData.level = Number(level);
    if (exp !== undefined) updateData.exp = Number(exp);
    if (role !== undefined) updateData.role = role;

    // 1. Update tabel profiles
    if (level !== undefined || exp !== undefined || role !== undefined) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
        { id, ...updateData },
        { onConflict: 'id' }
      );

      if (profileError) {
        console.error('[PUT admin/users profileError]', profileError);
        // Kita tidak mereturn 500 di sini, agar metadata tetap terupdate, tapi kita log errornya
      }
    }

    const metaUpdate: any = {};
    if (level !== undefined) metaUpdate.level = Number(level);
    if (exp !== undefined) metaUpdate.exp = Number(exp);
    if (role !== undefined) metaUpdate.role = role;
    if (is_banned !== undefined) metaUpdate.is_banned = Boolean(is_banned);
    if (ban_reason !== undefined) metaUpdate.ban_reason = ban_reason;

    try {
      // Perlu baca metadata saat ini dulu agar tidak tertimpa
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(id);
      const currentMeta = user?.user_metadata || {};
      
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { ...currentMeta, ...metaUpdate }
      });
    } catch (adminError: any) {
      console.error('[PUT admin/users] Gagal update auth metadata:', adminError);
      return NextResponse.json({ success: false, error: adminError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: updateData });
  } catch (error: any) {
    console.error('[PUT admin/users catch]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const errors: string[] = [];

    // 1. Hapus auth user TERLEBIH DAHULU
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) {
        console.error('[DELETE admin/users] auth delete error:', authError);
        errors.push(`Auth: ${authError.message}`);
      }
    } catch (adminError: any) {
      console.error('[DELETE admin/users] auth delete catch:', adminError);
      errors.push(`Auth: ${adminError.message}`);
    }

    // 2. Hapus data terkait secara manual untuk mencegah error foreign key
    const tables = ['comments', 'global_messages', 'user_bookmarks', 'user_activities', 'user_history', 'comment_likes', 'user_follows', 'kaaoffc_ratings'];
    for (const table of tables) {
      const { error: tableError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', id);
      
      // Ignore errors if the table doesn't exist in their schema
      if (tableError && !tableError.message.includes('Could not find the table')) {
        console.error(`[DELETE admin/users] ${table} delete error:`, tableError);
        errors.push(`${table}: ${tableError.message}`);
      }
    }

    // 3. Hapus dari tabel profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (profileError) {
      console.error('[DELETE admin/users] profile delete error:', profileError);
      return NextResponse.json({ 
        success: false, 
        error: `Gagal menghapus profil utama: ${profileError.message}` 
      }, { status: 200 });
    }

    if (errors.length > 0) {
      console.warn('[DELETE admin/users] Deleted profile but had some minor errors:', errors);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE admin/users catch]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
