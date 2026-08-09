# 🚀 Kaaoffc - Platform Streaming Anime & Komik Modern

Selamat datang di *Source Code* **Kaaoffc**! Ini adalah platform modern berbasis Next.js untuk menonton Anime, Donghua, dan membaca Komik serta Novel, dilengkapi dengan sistem Gamifikasi (Leveling) dan Komunitas (Komentar & Chat).

Ikuti panduan di bawah ini langkah demi langkah untuk melakukan instalasi, mengkonfigurasi database, hingga mendeploy (*online*-kan) web ini ke Vercel.

---

## 🛠️ Persiapan Awal (Requirements)
Sebelum mulai, pastikan Anda sudah memiliki:
1. Akun [GitHub](https://github.com/) (Untuk menyimpan source code)
2. Akun [Supabase](https://supabase.com/) (Untuk Database & Autentikasi User)
3. Akun [Vercel](https://vercel.com/) (Untuk Hosting / Deploy Web)
4. [Node.js](https://nodejs.org/) terinstall di laptop/PC Anda (Jika ingin menjalankan di komputer lokal)

---

## 🗄️ Langkah 1: Setup Database Supabase

Proyek ini menggunakan **Supabase** (PostgreSQL) sebagai database utama. Anda harus membuat project Supabase baru dan meng-import tabel-tabelnya.

1. Buka [supabase.com](https://supabase.com/) dan login.
2. Klik tombol **"New Project"**.
3. Masukkan nama project (misal: `kaaoffc-db`), buat *database password* yang kuat, dan pilih region terdekat (misal: Singapore). Tunggu beberapa menit hingga database selesai dibuat.
4. Setelah project Supabase aktif, pergi ke menu **"SQL Editor"** (ikon terminal `>_` di sebelah kiri).
5. Klik **"New Query"**.
6. Buka file `database.sql` yang ada di dalam source code ini. **Copy seluruh isinya** dan **Paste** ke dalam Supabase SQL Editor.
7. Klik tombol **"Run"** (atau tekan `Ctrl+Enter`). 
   *(Ini akan otomatis membuat semua tabel yang dibutuhkan seperti profiles, user_history, comments, dll).*

### Konfigurasi Login (Authentication)
Agar user bisa login menggunakan Google:
1. Di dashboard Supabase, pergi ke menu **"Authentication"** > **"Providers"**.
2. Cari **Google** dan aktifkan (*Enable*).
3. Anda perlu mengisi `Client ID` dan `Client Secret` dari Google Cloud Console. *(Cari tutorial di YouTube: "How to setup Supabase Google Auth" untuk detail langkah mendapatkan Client ID Google)*.
4. Biarkan Email provider tetap aktif jika Anda ingin user bisa daftar pakai Email/Password.

---

## 🔑 Langkah 2: Ambil API Keys Supabase

Agar web Next.js bisa berkomunikasi dengan Supabase, kita butuh kunci rahasianya.

1. Di Supabase, pergi ke menu **"Project Settings"** (ikon gir ⚙️ di kiri bawah) > pilih **"API"**.
2. Anda akan melihat **Project URL** dan **Project API Keys** (`anon` `public` dan `service_role` `secret`).
3. Biarkan tab ini tetap terbuka karena kita akan menyalin kunci ini pada langkah selanjutnya.

---

## 💻 Langkah 3: Menjalankan Web di Komputer (Lokal)

Jika Anda ingin mencoba atau mengedit webnya di komputer sendiri:

1. Ekstrak *source code* yang sudah Anda download.
2. Buka folder tersebut di *Code Editor* (contoh: **VS Code**).
3. Buat file baru bernama `.env.local` di folder paling luar (sejajar dengan `package.json`).
4. Isi file `.env.local` dengan format berikut, lalu ganti tanda kurung `[...]` dengan API Key dari langkah 2:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...[ANON-KEY-ANDA]
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...[SERVICE-ROLE-KEY-ANDA]
   ```
5. Buka **Terminal** di dalam VS Code (tekan `Ctrl` + `~`).
6. Jalankan perintah instalasi paket:
   ```bash
   npm install
   ```
7. Setelah selesai, jalankan website:
   ```bash
   npm run dev
   ```
8. Buka browser dan pergi ke `http://localhost:3000`. Web Kaaoffc Anda sudah berjalan!

---

## 🚀 Langkah 4: Deploy ke Vercel (Online-kan Website)

Agar web Anda bisa diakses oleh semua orang di internet (online), kita akan menggunakan Vercel.

### A. Upload Code ke GitHub
1. Buka [GitHub](https://github.com/) dan buat *Repository* baru (Public atau Private).
2. Upload seluruh source code ini ke repository GitHub tersebut. *(Jika Anda bingung, cari tutorial "Cara upload project Next.js ke GitHub")*.

### B. Deploy dari Vercel
1. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** > **"Project"**.
3. Vercel akan menampilkan daftar repository GitHub Anda. Cari repository Kaaoffc yang baru Anda upload, lalu klik **"Import"**.
4. Di halaman konfigurasi (Configure Project), scroll ke bawah ke bagian **Environment Variables**.
5. Masukkan ketiga kunci rahasia Supabase persis seperti di file `.env.local`:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` | Value: `https://[PROJECT-REF]...` *(lalu klik Add)*
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Value: `ey...` *(lalu klik Add)*
   - Name: `SUPABASE_SERVICE_ROLE_KEY` | Value: `ey...` *(lalu klik Add)*
6. Klik tombol biru **"Deploy"**.
7. Tunggu sekitar 2-5 menit. Vercel sedang mem-build web Anda.
8. Selesai! Vercel akan memberikan link/URL gratis (contoh: `kaaoffc.vercel.app`) untuk web Anda.

---

## 🛡️ Langkah 5: Cara Masuk ke Admin Dashboard

Website ini memiliki halaman Admin tersembunyi untuk mengelola Novel, User, dan Komentar.

**Cara memberikan akses Admin ke akun Anda:**
1. Login ke website Kaaoffc Anda (bisa pakai Google atau Email).
2. Kembali ke dashboard **Supabase** Anda.
3. Buka menu **"Table Editor"** > klik tabel **`profiles`**.
4. Cari nama/email Anda di dalam tabel tersebut.
5. Pada kolom **`role`**, klik teksnya dan ubah dari `user` menjadi `admin`. (Jika kolom tidak bisa diedit langsung, klik tombol edit baris).
6. Kembali ke website Kaaoffc, lalu *Refresh* halamannya.
7. Buka halaman Profil Anda, sekarang akan muncul menu **"Dashboard Admin"** berwarna merah. Atau Anda bisa langsung mengakses URL `/admin`.

---

## ❓ Troubleshooting (Masalah yang Sering Terjadi)

- **Error saat Deploy di Vercel?**
  Pastikan Anda tidak typo saat memasukkan *Environment Variables*. Pastikan juga Anda tidak salah meng-copy `anon` key dan `service_role` key.
- **Novel tidak muncul?**
  Anda harus menambahkannya secara manual dari **Dashboard Admin** > **Kelola Novel**.
- **Gambar Donghua/Anime tidak muncul?**
  Web ini menggunakan API *scraping* pihak ketiga untuk data Anime & Donghua. Jika gambar tidak muncul, kemungkinan sumber aslinya sedang down atau mengganti sistem proteksinya.

🎉 **Selamat mengelola platform anime & komik Anda sendiri!**
