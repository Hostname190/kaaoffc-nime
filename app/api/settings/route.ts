import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Default settings agar website tidak error saat tabel site_settings belum dibuat
const DEFAULT_SETTINGS = {
  primary_color: '#e53935',
  site_name: 'Kaaoffc',
  community_url: 'https://whatsapp.com/channel/0029Vb7w9Dt4yltJRP5azv0k',
  support_url: 'https://saweria.co/kaaoffc',
  social_whatsapp: '',
  social_discord: '',
  social_facebook: '',
  social_tiktok: '',
};

export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*');

    if (error) {
      // Jika tabel belum ada atau error lain, kembalikan default (bukan 500)
      console.warn('[api/settings] Menggunakan nilai default karena:', error.message);
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    const mapped = (settings || []).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, { ...DEFAULT_SETTINGS } as any);

    return NextResponse.json(mapped);
  } catch (error: any) {
    // Fallback terakhir: kembalikan default, jangan crash
    console.warn('[api/settings] Fallback ke default:', error.message);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}
