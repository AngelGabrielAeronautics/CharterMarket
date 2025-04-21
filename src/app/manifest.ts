import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const domain = 'https://chartermarket.app';
  
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
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
    orientation: 'portrait',
    prefer_related_applications: true,
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=app.chartermarket',
        id: 'app.chartermarket'
      },
      {
        platform: 'itunes',
        url: 'https://apps.apple.com/app/chartermarket/id123456789'
      }
    ],
    categories: ['travel', 'business', 'lifestyle'],
    shortcuts: [
      {
        name: "Book Flight",
        url: "/book",
        description: "Start booking a private flight"
      },
      {
        name: "My Bookings",
        url: "/dashboard/bookings",
        description: "View your flight bookings"
      }
    ],
    protocol_handlers: [
      {
        protocol: 'web+charter',
        url: '/handle/%s'
      }
    ]
  }
} 