// Utility to calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate contrast ratio between two colors
export function getContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return 0;

  const fgLuminance = getLuminance(fg.r, fg.g, fg.b);
  const bgLuminance = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast meets WCAG standards
export function meetsWCAGStandards(ratio: number, level: 'AA' | 'AAA' = 'AA', isLargeText: boolean = false): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Get contrast issues for a color combination
export function getContrastIssues(foreground: string, background: string, elementType: string): string | null {
  const ratio = getContrastRatio(foreground, background);
  
  if (!meetsWCAGStandards(ratio, 'AA')) {
    return `${elementType}: Insufficient contrast ratio (${ratio.toFixed(2)}:1). Should be at least 4.5:1 for WCAG AA compliance.`;
  }
  
  if (!meetsWCAGStandards(ratio, 'AAA')) {
    return `${elementType}: Meets AA but not AAA standards. Current ratio: ${ratio.toFixed(2)}:1`;
  }
  
  return null;
} 