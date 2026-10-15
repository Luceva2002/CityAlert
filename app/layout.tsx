import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

import { Providers } from '@/components/Providers';
import { PWARegister } from '@/components/PWARegister';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CityAlert — La tua città, in tempo reale',
  description:
    'Segnala buche, fontanelle guaste, erba alta e problemi urbani in tempo reale. La mappa civica del tuo comune.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CityAlert',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f4f5f7',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`h-full ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="h-full antialiased bg-(--bg)">
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
