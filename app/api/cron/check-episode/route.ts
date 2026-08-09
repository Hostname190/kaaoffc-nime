import { NextResponse } from 'next/server';
import { getDonghuaHome } from '@/lib/donghua-api';
// CATATAN: Karena Next.js di Vercel tidak bisa menyimpan file lokal yang permanen,
// Anda sebaiknya menggunakan Upstash Redis, Supabase, atau Vercel KV untuk menyimpan 'lastEpisode'.
// Sebagai contoh sementara, kita asumsikan lastEpisode kita ambil dari database:
let mockLastEpisodeId = "temp-initial-id";

export async function GET(req: Request) {
  // Pastikan request ini aman, biasanya menggunakan token rahasia dari URL
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET && secret !== 'my-secret-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Ambil data terbaru dari website Anda (via donghua-api)
    const homeData = await getDonghuaHome();
    const latestEpisodes = homeData.recent || [];

    if (latestEpisodes.length === 0) {
      return NextResponse.json({ message: 'No episodes found.' });
    }

    // Ambil anime teratas (paling baru)
    const newestAnime = latestEpisodes[0];
    
    // 2. Cek apakah ini episode baru
    // Di produksi, Anda harus mengambil 'mockLastEpisodeId' dari Database.
    if (newestAnime.animeId !== mockLastEpisodeId) {
      
      // Ada episode baru! 
      // 3. Kirim perintah ke OneSignal untuk membuat Notifikasi
      const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "MASUKKAN-APP-ID-ONESIGNAL-DISINI";
      const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "MASUKKAN-REST-API-KEY-ONESIGNAL-DISINI";

      const notificationBody = {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Subscribed Users"],
        headings: { en: "🚀 Episode Baru Telah Rilis!" },
        contents: { en: `${newestAnime.title} - ${newestAnime.episodes} sudah rilis!` },
        url: `https://domain-anda.com${newestAnime.href}`, // Ganti dengan domain asli Anda
        big_picture: newestAnime.poster // Menampilkan gambar besar seperti di screenshot Anda
      };

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify(notificationBody)
      });

      const responseData = await response.json();

      // 4. Update 'ingatan' agar tidak mengirim notif lagi untuk episode ini
      mockLastEpisodeId = newestAnime.animeId;
      // Di produksi, simpan mockLastEpisodeId ke Database di sini.

      return NextResponse.json({ 
        success: true, 
        message: 'Notification sent!', 
        anime: newestAnime.title,
        onesignal_response: responseData
      });
    }

    return NextResponse.json({ success: true, message: 'No new episodes. Nothing sent.' });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
