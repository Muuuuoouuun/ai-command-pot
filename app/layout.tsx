import './globals.css';
import { BottomNav } from '@/components/bottom-nav';
import { SideNav } from '@/components/side-nav';
import { ThemeProvider } from '@/components/theme-provider';
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
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('aicn-theme')||'warm';document.documentElement.setAttribute('data-theme',t);}catch(e){}`
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <PWARegister />
          {/* Mobile header — hidden on desktop */}
          <AppHeader />
          <div className="lg:flex">
            {/* Desktop left sidebar */}
            <SideNav />
            {/* Page content */}
            <main className="flex-1 mx-auto min-h-screen max-w-3xl space-y-6 px-4 pb-28 pt-5 lg:max-w-4xl lg:pb-10 lg:pt-8 lg:px-8">
              {children}
            </main>
          </div>
          {/* Mobile bottom nav — hidden on desktop */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
