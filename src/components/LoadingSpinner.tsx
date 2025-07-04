'use client';

import { Box, CircularProgress, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const spinner = <CircularProgress size={size} sx={{ color: theme.palette.primary.main }} />;

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
          backgroundColor: theme.palette.background.paper,
          opacity: 0.9,
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
