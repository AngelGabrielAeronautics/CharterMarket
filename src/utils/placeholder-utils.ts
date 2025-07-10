/**
 * Generates a base64 encoded SVG placeholder image
 */
export function generateSVGPlaceholder({
  width = 400,
  height = 300,
  text = 'Image',
  backgroundColor = '#1A2B3C',
  textColor = '#FFFFFF',
}: {
  width?: number;
  height?: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
} = {}): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
         fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
      <text x="50%" y="50%" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${Math.min(width, height) / 8}" 
            font-weight="600" 
            fill="${textColor}" 
            text-anchor="middle" 
            dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
  
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generates optimized placeholder URLs for different image types
 */
export const placeholders = {
  destination: (name: string) => generateSVGPlaceholder({
    width: 800,
    height: 1200,
    text: name,
    backgroundColor: '#1A2B3C',
  }),
  
  aircraft: (type: string) => generateSVGPlaceholder({
    width: 600,
    height: 400,
    text: type,
    backgroundColor: '#1A2B3C',
  }),
  
  profile: (initials: string) => generateSVGPlaceholder({
    width: 200,
    height: 200,
    text: initials,
    backgroundColor: '#C4A962',
  }),
  
  city: (cityName: string) => generateSVGPlaceholder({
    width: 800,
    height: 600,
    text: cityName,
    backgroundColor: '#1A2B3C',
  }),
  
  general: (text: string = 'Image') => generateSVGPlaceholder({
    width: 400,
    height: 300,
    text,
    backgroundColor: '#f5f5f5',
    textColor: '#666666',
  }),
};

/**
 * Creates a data URL for an empty 1x1 transparent pixel
 */
export const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Checks if an image URL is likely to be working
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Creates a fallback chain for image loading
 */
export function createImageFallbackChain(
  primaryUrl: string,
  fallbackText: string,
  type: 'destination' | 'aircraft' | 'profile' | 'city' | 'general' = 'general'
): string[] {
  const chain = [];
  
  if (isValidImageUrl(primaryUrl)) {
    chain.push(primaryUrl);
  }
  
  // Add type-specific placeholder
  chain.push(placeholders[type](fallbackText));
  
  // Add final fallback
  chain.push(TRANSPARENT_PIXEL);
  
  return chain;
} 