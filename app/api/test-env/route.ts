import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'is set (masked)' : 'not set',
    NODE_ENV: process.env.NODE_ENV
  });
}
