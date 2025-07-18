/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Define security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: process.env.NODE_ENV === 'development'
      ? "default-src 'self' 'unsafe-eval' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://maps.googleapis.com https://maps.gstatic.com data: blob:; connect-src 'self' https://www.google-analytics.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebase.googleapis.com https://firebasestorage.googleapis.com https://firebaseremoteconfig.googleapis.com https://content-firebaseremoteconfig.googleapis.com https://maps.googleapis.com https://places.googleapis.com https://api.unsplash.com ws: wss:; img-src 'self' data: https: blob: https://images.unsplash.com https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://cdn.embedly.com; worker-src 'self' blob:;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://maps.googleapis.com https://maps.gstatic.com; connect-src 'self' https://www.google-analytics.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebase.googleapis.com https://firebasestorage.googleapis.com https://firebaseremoteconfig.googleapis.com https://content-firebaseremoteconfig.googleapis.com https://maps.googleapis.com https://api.unsplash.com; img-src 'self' data: blob: https: https://images.unsplash.com https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://cdn.embedly.com;"
  },
];

const nextConfig = {
  reactStrictMode: true,  // Enable React strict mode for improved development experience
  poweredByHeader: false, // Remove X-Powered-By header
  eslint: {
    // Do not skip ESLint during builds; fail build on lint errors
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Do not skip type checking during builds; fail build on TS errors
    ignoreBuildErrors: false,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60, // 1 minute minimum caching
  },
  
  // Improved webpack configuration
  webpack(config, { dev, isServer }) {
    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking and minification
      config.optimization.usedExports = true;
      
      // Split chunks optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
            priority: 40,
            // Don't put react into a separate chunk in development
            // for better hot module replacement
            chunks: dev ? 'async' : 'all',
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            priority: 30,
            name(module) {
              // Get package name from module path
              const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              if (!match) return 'lib';
              
              const packageName = match[1];
              // Some packages are big and should be in their own chunk
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Adding security headers to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache static assets for a year
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache public images for a week
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  
  // Custom redirects
  async redirects() {
    return [
      // Example redirect for legacy URLs
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      //   permanent: true,
      // },
    ];
  },
};

export default withBundleAnalyzer(nextConfig); 