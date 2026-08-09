import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, item_url, item_type, reason } = body;

    if (!user_id || !item_url || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id,
        item_url,
        item_type: item_type || 'unknown',
        reason,
        status: 'pending'
      });

    if (error) {
      console.error('[POST reports error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST reports catch]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
