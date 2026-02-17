import './globals.css';
import { BottomNav } from '@/components/bottom-nav';
import type { Metadata } from 'next';
import { PWARegister } from '@/components/pwa-register';
import { AppHeader } from '@/components/app-header';

export const metadata: Metadata = {
  title: 'AI Control Notebook',
  description: 'Personal AI + automation control tower',
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        <AppHeader />
        <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 pb-28 pt-5">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
