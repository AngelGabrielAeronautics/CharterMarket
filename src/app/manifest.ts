import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const domain =
    process.env.NODE_ENV === 'production'
      ? 'https://chartermarket.app'
      : `http://localhost:${process.env.PORT || 3000}`;

  return {
    name: 'Charter Aviation Platform',
    short_name: 'Charter',
    description: 'Your trusted partner in private aviation',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#1A2B3C',
    scope: '/',
    id: domain,
    icons: [
      {
        src: '/branding/favicon/Charter-favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/branding/favicon/Charter-favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/branding/favicon/Charter-favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/branding/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    orientation: 'portrait',
    prefer_related_applications: true,
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=app.chartermarket',
        id: 'app.chartermarket',
      },
      {
        platform: 'itunes',
        url: 'https://apps.apple.com/app/chartermarket/id123456789',
      },
    ],
    categories: ['travel', 'business', 'lifestyle'],
    shortcuts: [
      {
        name: 'Book Flight',
        url: '/book',
        description: 'Start booking a private flight',
      },
      {
        name: 'My Bookings',
        url: '/dashboard/bookings',
        description: 'View your flight bookings',
      },
    ],
    protocol_handlers: [
      {
        protocol: 'web+charter',
        url: '/handle/%s',
      },
    ],
  };
}
