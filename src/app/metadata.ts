import { Metadata } from 'next';

const metadata: Metadata = {
  title: 'Charter Aviation Platform',
  description: 'Book private charter flights with ease',
  icons: {
    icon: [
      {
        url: '/branding/favicon/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        url: '/branding/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        url: '/branding/favicon/favicon.ico',
        sizes: 'any'
      }
    ],
    apple: [
      {
        url: '/branding/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default metadata; 