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
      <body className="min-h-full bg-slate-50 text-slate-900">
        <div className="flex min-h-screen bg-slate-50">
          <SidebarNav />
          <div className="flex flex-1 flex-col">
            <TopBar />
            <main className="flex-1 bg-gradient-to-b from-white to-slate-50">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
