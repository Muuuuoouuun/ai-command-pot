import './globals.css';
import { BottomNav } from '@/components/bottom-nav';
import type { Metadata } from 'next';
import { PWARegister } from '@/components/pwa-register';
import { AppHeader } from '@/components/app-header';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'AI Control Notebook',
  description: 'Personal AI + automation control tower',
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink min-h-screen">
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 fixed inset-y-0 z-50">
            <Sidebar />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
            <div className="lg:hidden">
              <AppHeader />
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
              {children}
            </div>
          </main>
        </div>

        <PWARegister />
        <BottomNav />
      </body>
    </html>
  );
}
