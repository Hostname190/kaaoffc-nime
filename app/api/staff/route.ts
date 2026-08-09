// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('[GET staff error]', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const staffUsers = authData.users
      .map(u => {
        const p = profilesMap.get(u.id);
        return {
          id: u.id,
          display_name: p?.display_name || u.user_metadata?.display_name || u.email?.split('@')[0] || 'Staff',
          avatar_url: p?.avatar_url || u.user_metadata?.avatar_url || '/avatar.jpeg',
          role: u.user_metadata?.role || 'User',
          level: p?.level || u.user_metadata?.level || 1,
        };
      })
      .filter(u => u.role !== 'User' && u.role !== undefined);

    staffUsers.sort((a, b) => {
      const order: any = { 'Developer': 1, 'Admin': 2, 'Moderator': 3, 'Author': 4 };
      const roleA = order[a.role] || 99;
      const roleB = order[b.role] || 99;
      return roleA - roleB || b.level - a.level;
    });

    return NextResponse.json(staffUsers);
  } catch (error: any) {
    console.error('[GET staff catch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
