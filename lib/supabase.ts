import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined;
  supabaseAdmin: ReturnType<typeof createClient> | undefined;
}

declare global {
  interface Window {
    supabaseClient: any;
  }
}

// Client biasa untuk read (publik)
export const supabase = (() => {
  if (typeof window !== 'undefined') {
    // Di browser, simpan di objek window agar tidak re-create saat hot reload
    if (!window.supabaseClient) {
      window.supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true } });
    }
    return window.supabaseClient as ReturnType<typeof createClient>;
  }
  return globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true } });
})();

// Admin client untuk write (bypass RLS) — hanya dipakai di server-side API
export const supabaseAdmin = typeof window === 'undefined' ? (globalForSupabase.supabaseAdmin ?? createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // fallback ke anon jika service key belum diset
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)) : null as any;

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}
