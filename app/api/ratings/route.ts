// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Ambil semua rating untuk item ini
    const { data, error } = await supabase
      .from('kaaoffc_ratings')
      .select('rating_value')
      .eq('item_url', url);

    if (error) {
      // Jika tabel belum ada, kita bisa mengembalikan default dummy
      if (error.code === '42P01') {
        return NextResponse.json({ average: 0, count: 0, error: 'Table missing, please create it.' });
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ average: 0, count: 0 });
    }

    const sum = data.reduce((acc, curr) => acc + curr.rating_value, 0);
    const average = sum / data.length;

    return NextResponse.json({ 
      average: Number(average.toFixed(1)), 
      count: data.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url, userId, rating } = await request.json();

    if (!url || !userId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert rating (1 user hanya bisa 1 rating per item)
    // Menggunakan public client, pastikan ada RLS update/insert
    const { data, error } = await supabase
      .from('kaaoffc_ratings')
      .upsert({
        item_url: url,
        user_id: userId,
        rating_value: rating,
        updated_at: new Date().toISOString()
      }, { onConflict: 'item_url,user_id' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
