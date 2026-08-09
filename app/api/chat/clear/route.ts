import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin (Check both profile and user_metadata to match frontend logic)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const metaData = authUser?.user?.user_metadata || {};
    
    const dbRole = (profile?.role || '').toLowerCase();
    const metaRole = (metaData.role || '').toLowerCase();
    const username = (metaData.username || metaData.display_name || '').toLowerCase();

    const isDbAdmin = dbRole.includes('admin') || dbRole.includes('developer') || dbRole.includes('moderator') || dbRole.includes('owner');
    const isMetaAdmin = metaRole.includes('admin') || metaRole.includes('developer') || metaRole.includes('moderator');
    const isUsernameAdmin = username.includes('admin') || username.includes('dev') || username.includes('cs');

    const isAdmin = isDbAdmin || isMetaAdmin || isUsernameAdmin;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Hanya Admin yang bisa menghapus semua chat.' }, { status: 403 });
    }

    // Delete all messages by using a condition that is always true
    const { error: deleteError } = await supabaseAdmin
      .from('global_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('[Clear chat error]', deleteError);
      return NextResponse.json({ error: 'Gagal menghapus pesan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Semua pesan berhasil dihapus' });
  } catch (error: any) {
    console.error('[Clear Chat API Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
