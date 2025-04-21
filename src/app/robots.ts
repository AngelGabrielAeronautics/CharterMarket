import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',  // Protect private dashboard pages
        '/api/',        // Protect API routes
        '/admin/',      // Protect admin routes
        '/*.json',      // Protect JSON files
        '/*.xml',       // Protect XML files
      ],
    },
    sitemap: 'https://charter.angelgabriel.co.za/sitemap.xml',
  };
} 