'use client';

import { Box, CircularProgress } from '@mui/material';
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
  const spinner = <CircularProgress size={size} sx={{ color: 'var(--charter-gold)' }} />;

  if (fullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(11, 55, 70, 0.8)',
          backdropFilter: 'blur(4px)',
        }}
        className={clsx(className)}
      >
        {spinner}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={clsx(className)}
    >
      {spinner}
    </Box>
  );
}
