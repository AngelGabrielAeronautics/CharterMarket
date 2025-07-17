import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Box, Typography, useTheme as useMuiTheme, useMediaQuery } from '@mui/material';

interface LogoProps {
  href?: string;
  height?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  sx?: any;
  srcOverride?: string;
}

export default function Logo({ href, height = 40, sx = {}, srcOverride }: LogoProps) {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const [imageError, setImageError] = useState(false);
  
  // Handle responsive height values at component level
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const logoHeight = (() => {
    if (typeof height === 'number') return height;
    
    if (isMobile && height.xs) return height.xs;
    if (isTablet && height.sm) return height.sm;
    if (height.md) return height.md;
    if (height.lg) return height.lg;
    
    return typeof height === 'object' ? (height.xs || height.sm || height.md || height.lg || 40) : 40;
  })();
  
  const logoSrc = srcOverride
    ? srcOverride
    : isDarkMode 
      ? '/branding/logos/light/charter-logo-dark-mode.png'
      : '/branding/logos/dark/charter-logo-light-mode.png';
    
  const logoComponent = (
    <Box sx={{ position: 'relative', transition: 'opacity 200ms', ...sx }}>
      {imageError ? (
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color={isDarkMode ? 'common.white' : 'text.primary'}
          sx={{
            fontSize: {
              xs: '1.2rem',
              sm: '1.5rem', 
              md: '2.125rem'
            }
          }}
        >
          CHARTER
        </Typography>
      ) : (
        <Image
          src={logoSrc}
          alt="Charter Logo"
          height={logoHeight}
          width={logoHeight * 3.5}
          style={{ 
            objectFit: 'contain',
          }}
          priority
          onError={() => setImageError(true)}
        />
      )}
    </Box>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', transition: 'opacity 200ms' }}>
        {logoComponent}
      </Link>
    );
  }

  return logoComponent;
} 