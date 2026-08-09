// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Count total users from auth.users via admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1, page: 1 });
    
    if (error) {
      return NextResponse.json({ count: 0, error: error.message }, { status: 200 });
    }

    // The total is available from the response
    const totalUsers = data?.total || data?.users?.length || 0;

    return NextResponse.json({ count: totalUsers });
  } catch (e: any) {
    // Fallback: count from profiles table
    try {
      const { count, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      return NextResponse.json({ count: count || 0 });
    } catch {
      return NextResponse.json({ count: 0 });
    }
  }
}
