import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SidebarNav } from '../components/SidebarNav';
import { TopBar } from '../components/TopBar';
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'FabZone Admin · Control Center',
  description: 'Monitor buyers, sellers, orders, and deliveries for FabZone marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f6f8] text-slate-900 overflow-hidden">
        <div className="flex h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="flex w-full max-w-[1500px] h-full max-h-[960px] rounded-[2rem] bg-white shadow-xl overflow-hidden border border-slate-200">
            <SidebarNav />
            <div className="flex flex-1 flex-col overflow-hidden relative bg-[#fafbfc] border-l border-slate-100">
              <TopBar />
              <main className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
                <div className="mx-auto w-full max-w-7xl h-full">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
