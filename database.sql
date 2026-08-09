-- ==============================================================================
-- 🚀 KAAOFFC DATABASE SCHEMA (SUPABASE)
-- ==============================================================================
-- Cara Menggunakan:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy semua kode di file ini, Paste ke dalam SQL Editor
-- 3. Klik tombol "Run"
--
-- File ini akan secara otomatis membuat tabel-tabel utama yang kosong (tanpa data)
-- beserta relasi antar tabel (Foreign Keys).
-- ==============================================================================

-- 1. Tabel Profiles (User Data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user',
    username TEXT,
    display_name TEXT,                                                         -- Nama tampilan user
    avatar_url TEXT,
    exp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    title TEXT DEFAULT 'Newbie',
    bio TEXT,
    banner_url TEXT,
    theme_color TEXT DEFAULT '#1A1A22',
    is_verified BOOLEAN DEFAULT FALSE,                                         -- Badge verified
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())   -- Timestamp update terakhir
);
-- Trigger untuk otomatis membuat profil saat user baru mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Tabel Novels
CREATE TABLE IF NOT EXISTS public.novels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    author TEXT,
    genres TEXT[],
    cover_url TEXT,
    status TEXT DEFAULT 'Ongoing',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Novel Chapters
CREATE TABLE IF NOT EXISTS public.novel_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel User Bookmarks / Watchlist
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_url TEXT NOT NULL,
    title TEXT NOT NULL,
    poster TEXT,
    category TEXT DEFAULT 'Lainnya',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_url)
);

-- 5. Tabel User History (Riwayat Baca/Nonton)
CREATE TABLE IF NOT EXISTS public.user_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_url TEXT NOT NULL,
    title TEXT NOT NULL,
    poster TEXT,
    category TEXT,
    progress INTEGER DEFAULT 0,
    last_episode TEXT,                                                         -- Judul episode/chapter terakhir
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),  -- Untuk sorting riwayat terbaru
    UNIQUE(user_id, item_url)
);

-- 6. Tabel Global Chat (Pesan Chat Umum)
CREATE TABLE IF NOT EXISTS public.global_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,                                                              -- Nullable untuk pesan audio-only
    audio_url TEXT,                                                            -- URL audio message
    reply_to UUID REFERENCES public.global_messages(id) ON DELETE SET NULL,
    reply_to_username TEXT,                                                    -- Username yang di-reply
    level INTEGER DEFAULT 1,                                                   -- Level user saat kirim pesan
    level_text TEXT,                                                           -- Label level user
    avatar_url TEXT,                                                           -- Avatar user saat kirim pesan
    display_name TEXT,                                                         -- Nama tampilan user
    roles TEXT[],                                                              -- Role array user (misal: ['Admin'])
    is_verified BOOLEAN DEFAULT FALSE,                                         -- Badge verified
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Komentar Halaman
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_url TEXT NOT NULL,                                                    -- URL konten yang dikomentari (dipakai di kode)
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,          -- Untuk fitur reply/balasan
    user_email TEXT,                                                           -- Email user saat komentar dibuat
    user_avatar TEXT,                                                          -- Avatar user saat komentar dibuat
    user_level INTEGER DEFAULT 1,                                              -- Level user saat komentar dibuat
    likes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Likes untuk Komentar
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- 9. Tabel Aktivitas User (Gamifikasi/Timeline)
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,                                               -- Contoh: 'EPISODE DITONTON', 'KOMENTAR SAYA'
    target_title TEXT,                                                         -- Judul konten yang terkait aktivitas
    target_url TEXT,                                                           -- URL konten yang terkait aktivitas
    content TEXT,                                                              -- Isi komentar/balasan jika aktivitas komentar
    xp_earned INTEGER DEFAULT 0,                                               -- XP yang didapat dari aktivitas ini
    details JSONB,                                                             -- Data tambahan dalam format JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabel Followers (Sistem Follow User)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- 11. Tabel Rating / Penilaian
CREATE TABLE IF NOT EXISTS public.kaaoffc_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_url TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_url)
);

-- 12. Tabel Laporan Error (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Tabel Private Chats (Daftar Obrolan Pribadi)
CREATE TABLE IF NOT EXISTS public.private_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user1_id, user2_id)
);

-- 14. Tabel Private Messages (Isi Pesan Obrolan Pribadi)
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES public.private_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    anime_url TEXT,
    anime_title TEXT,
    anime_poster TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- MATIKAN RLS (Row Level Security) — WAJIB agar tidak ada error 403 Forbidden
-- Nantinya aktifkan RLS + policies jika sudah masuk fase production.
-- ==============================================================================
ALTER TABLE public.profiles          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.novel_chapters    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_history      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_messages   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaaoffc_ratings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chats     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages  DISABLE ROW LEVEL SECURITY;

-- 15. Tabel Pengaturan Situs (Site Settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- Insert default values
INSERT INTO public.site_settings (key, value) VALUES
('primary_color', '#e53935'),
('site_name', 'Kaaoffc'),
('community_url', 'https://whatsapp.com/channel/0029Vb7w9Dt4yltJRP5azv0k'),
('support_url', 'https://saweria.co/kaaoffc')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- HAPUS POLICY RLS LAMA (jika ada sisa dari konfigurasi sebelumnya)
-- ==============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- GRANT PERMISSIONS — WAJIB agar anon key bisa akses tabel di production
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ==============================================================================
-- KONFIGURASI REALTIME (Wajib untuk Chat)
-- ==============================================================================
-- Masukkan tabel ke publication supabase_realtime agar realtime subscription jalan
DO $$
BEGIN
  -- Cek apakah tabel sudah ada di publication, jika belum tambahkan
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'global_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'private_chats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_chats;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'private_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- Jika publication supabase_realtime tidak ada (mungkin beda setup di database lokal), abaikan
    NULL;
END $$;

-- ==============================================================================
-- SELESAI! SEMUA TABEL TELAH BERHASIL DIBUAT! 🎉
-- ==============================================================================
