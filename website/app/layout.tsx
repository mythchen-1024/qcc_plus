import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'QCC Plus - Enterprise Claude Proxy Gateway',
    template: '%s | QCC Plus'
  },
  description: 'Next-generation Claude API proxy with multi-tenant architecture, intelligent routing, and 99.99% uptime. Deploy in 60 seconds.',
  keywords: ['Claude Proxy', 'AI Gateway', 'API Proxy', 'Multi-tenant', 'Enterprise AI', 'Claude Code', 'Anthropic'],
  authors: [{ name: 'QCC Plus Team' }],
  creator: 'QCC Plus',
  publisher: 'QCC Plus',
  openGraph: {
    title: 'QCC Plus - The Quantum Gateway to Claude',
    description: 'Enterprise-grade proxy infrastructure for AI-powered applications',
    url: 'https://qccplus.com',
    siteName: 'QCC Plus',
    images: [
      {
        url: '/qcc_plus_icon_dark.png',
        width: 1200,
        height: 630,
        alt: 'QCC Plus'
      }
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QCC Plus - Enterprise Claude Proxy Gateway',
    description: 'Next-generation Claude API proxy with multi-tenant architecture',
    images: ['/qcc_plus_icon_dark.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
