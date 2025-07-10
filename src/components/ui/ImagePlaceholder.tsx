'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

interface ImagePlaceholderProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fallbackText?: string;
  fallbackColor?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export default function ImagePlaceholder({
  src,
  alt,
  width,
  height,
  fallbackText,
  fallbackColor = '#1A2B3C',
  objectFit = 'cover',
  priority = false,
  sizes,
  style,
  onLoad,
  onError,
}: ImagePlaceholderProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Extract text from alt or src if no fallbackText provided
  const displayText = fallbackText || alt || src.split('/').pop()?.split('.')[0] || 'Image';

  if (hasError) {
    return (
      <Box
        sx={{
          width: width || '100%',
          height: height || '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fallbackColor,
          color: 'white',
          fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
          fontWeight: 'bold',
          textAlign: 'center',
          padding: 2,
          position: 'relative',
          ...style,
        }}
      >
        <Typography
          variant="inherit"
          sx={{
            textTransform: 'capitalize',
            lineHeight: 1.2,
          }}
        >
          {displayText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: width || '100%',
        height: height || '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              border: '2px solid #e0e0e0',
              borderTop: '2px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Box>
      )}
      <Image
        src={src}
        alt={alt}
        fill={!width && !height}
        width={width ? Number(width) : undefined}
        height={height ? Number(height) : undefined}
        style={{
          objectFit,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        sizes={sizes}
      />
    </Box>
  );
} 