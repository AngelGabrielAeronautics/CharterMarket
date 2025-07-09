/**
 * Utility functions for handling images with CORS proxy support
 */

/**
 * Checks if a URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
}

/**
 * Gets the appropriate image URL, using proxy in development if needed
 */
export function getImageUrl(originalUrl: string): string {
  // If it's not a Firebase Storage URL, return as-is
  if (!isFirebaseStorageUrl(originalUrl)) {
    return originalUrl;
  }

  // In development, use the proxy to avoid CORS issues
  if (process.env.NODE_ENV === 'development') {
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  }

  // In production, return the original URL
  return originalUrl;
}

/**
 * Gets the appropriate image URL for Next.js Image component
 * This version handles both proxy and direct URLs
 */
export function getNextImageUrl(originalUrl: string): string {
  return getImageUrl(originalUrl);
}

/**
 * Checks if we should use the image proxy
 */
export function shouldUseProxy(): boolean {
  return process.env.NODE_ENV === 'development';
} 