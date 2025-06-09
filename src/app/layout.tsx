import { Sen } from 'next/font/google';
import { Metadata } from 'next';
import '../styles/tokens.css';
import './globals.css';
import ClientLayout from './client-layout';
import { validateEnv } from '@/lib/env';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Validate environment variables on server-side
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  // In production, we might want to handle this differently
  if (process.env.NODE_ENV === 'production') {
    throw error; // Stop the app in production if env vars are missing
  }
}

const sen = Sen({
  subsets: ['latin'],
  variable: '--font-sen',
  display: 'swap',
  weight: ['400', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Charter - Private Jet Booking Platform',
  description: 'The worlds first and only charter marketplace.',
  // Adding Open Graph and Twitter card metadata for SEO and social sharing
  openGraph: {
    title: 'Charter. - Private Jet Booking Platform',
    description: 'The worlds first and only charter marketplace.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chartermarket.app',
    siteName: 'Charter.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Charter Aviation Platform',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Charter - Private Jet Booking Platform',
    description: 'The worlds first and only charter marketplace.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      {
        url: '/branding/favicon/Charter-favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/branding/favicon/Charter-favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/branding/favicon/Charter-favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/branding/favicon/Charter-favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        url: '/branding/favicon/Charter-favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    apple: [
      {
        url: '/branding/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'icon',
        url: '/branding/favicon/Charter-favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/branding/favicon/Charter-favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'msapplication-TileColor': '#1A2B3C',
    'msapplication-TileImage': '/branding/favicon/Charter-favicon-96x96.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chartermarket.app'),
};

// Separate viewport configuration as per Next.js metadata API
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A2B3C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={sen.variable}>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
