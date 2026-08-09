import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import MobileMenuChips from './components/MobileMenuChips';
import AuthProvider from './components/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Kaaoffc - Streaming Donghua & Baca Webtoon',
  description: 'Situs terlengkap untuk nonton Donghua dan baca Webtoon/Manga.',
  manifest: '/manifest.json',
  referrer: 'no-referrer',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kaaoffc',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b', // zinc-950
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import MainLayoutWrapper from './MainLayoutWrapper';
import OnboardingScreen from './components/OnboardingScreen';
import PreferenceApplier from './components/PreferenceApplier';
import OneSignalInit from './components/OneSignalInit';

import GlobalChatWrapper from './components/GlobalChatWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} data-theme="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="font-sans antialiased bg-zinc-200 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-50 min-h-screen flex flex-col md:pb-0">
        <AuthProvider>
        <SplashScreen />
        <OnboardingScreen />
        <PreferenceApplier />
        <OneSignalInit />
        
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>

        <GlobalChatWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
