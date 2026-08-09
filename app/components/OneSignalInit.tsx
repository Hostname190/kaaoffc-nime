// @ts-nocheck
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function OneSignalInit() {
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId || appId === "MASUKKAN-APP-ID-ONESIGNAL-DISINI") {
          console.log("OneSignal App ID belum diset, melewati inisialisasi OneSignal.");
          return;
        }
        await OneSignal.init({
          appId: appId,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_ID || "",
          notifyButton: {
            enable: false,
            text: {
                'tip.state.unsubscribed': 'Berlangganan Notifikasi',
                'tip.state.subscribed': 'Anda sudah berlangganan',
                'tip.state.blocked': 'Notifikasi diblokir',
                'message.prenotify': 'Klik untuk berlangganan notifikasi episode anime baru',
                'message.action.subscribed': 'Terima kasih telah berlangganan!',
                'message.action.resubscribed': 'Anda sudah berlangganan notifikasi',
                'message.action.unsubscribed': 'Anda tidak akan menerima notifikasi lagi'
            }
          },
          allowLocalhostAsSecureOrigin: true,
        });
        
        // Memaksa memunculkan pop-up izin notifikasi jika user belum berlangganan
        OneSignal.Slidedown.promptPush();
      });
    }
  }, []);

  return (
    <>
      <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
    </>
  );
}
