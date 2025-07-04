import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface LogoProps {
  href?: string;
  height?: number;
  sx?: any;
  srcOverride?: string;
}

export default function Logo({ href, height = 40, sx = {}, srcOverride }: LogoProps) {
  const { isDarkMode } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  const logoSrc = srcOverride
    ? srcOverride
    : isDarkMode 
      ? '/branding/logos/light/charter logo - dark mode.png'
      : '/branding/logos/dark/charter logo - light mode.png';
    
  const logoComponent = (
    <Box sx={{ position: 'relative', transition: 'opacity 200ms', ...sx }}>
      {imageError ? (
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color={isDarkMode ? 'common.white' : 'text.primary'}
        >
          CHARTER
        </Typography>
      ) : (
        <Image
          src={logoSrc}
          alt="Charter Logo"
          height={height}
          width={0}
          sizes={`${height * 3.5}px`}
          style={{ 
            width: 'auto', 
            height: `${height}px`, 
            objectFit: 'contain',
            maxWidth: `${height * 4}px` 
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