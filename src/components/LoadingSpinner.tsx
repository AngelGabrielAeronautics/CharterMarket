'use client';

import Image from 'next/image';
import { Box } from '@mui/material';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  fullscreen?: boolean;
}

export default function LoadingSpinner({
  size = 48,
  className = '',
  fullscreen = true,
}: LoadingSpinnerProps) {
  return (
    <Box
      sx={
        fullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(11, 55, 70, 0.8)',
              backdropFilter: 'blur(4px)',
            }
          : {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
      }
      className={clsx(className)}
    >
      <Box
        sx={{
          animation: 'spin 2s linear infinite',
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      >
        <Image
          src="/loaders/Loader.svg"
          alt="Loading..."
          width={size}
          height={size}
          priority
          style={{ color: 'var(--charter-gold)' }}
        />
      </Box>
    </Box>
  );
}
