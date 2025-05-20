'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Paper, useTheme } from '@mui/material';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { useCookies } from 'react-cookie';

interface AppDownloadBannerProps {
  variant?: 'full' | 'compact';
  showCloseButton?: boolean;
  persistentId?: string;
}

const BANNER_DISMISS_DAYS = 7; // How many days to hide the banner after dismissal

export default function AppDownloadBanner({
  variant = 'compact',
  showCloseButton = true,
  persistentId = 'app-download-banner',
}: AppDownloadBannerProps) {
  const theme = useTheme();
  const [cookies, setCookie] = useCookies([`dismissed-${persistentId}`]);
  const [show, setShow] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the banner was previously dismissed
    const isDismissed = !!cookies[`dismissed-${persistentId}`];

    // Check if the app is already installed
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    // Check if the device is mobile
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    setIsStandalone(isInStandaloneMode);
    setIsMobile(isMobileDevice);

    // Only show the banner if:
    // 1. It wasn't dismissed before
    // 2. The app is not already installed
    // 3. The user is on a mobile device
    setShow(!isDismissed && !isInStandaloneMode && isMobileDevice);
  }, [cookies, persistentId]);

  const handleDismiss = () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + BANNER_DISMISS_DAYS);

    setCookie(`dismissed-${persistentId}`, 'true', {
      path: '/',
      expires: expiryDate,
      sameSite: 'strict',
    });

    setShow(false);
  };

  if (!show) return null;

  return (
    <Paper
      elevation={variant === 'full' ? 3 : 1}
      sx={{
        position: variant === 'full' ? 'fixed' : 'relative',
        bottom: variant === 'full' ? 0 : 'auto',
        left: variant === 'full' ? 0 : 'auto',
        right: variant === 'full' ? 0 : 'auto',
        width: '100%',
        zIndex: variant === 'full' ? 1300 : 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: variant === 'full' ? `1px solid ${theme.palette.divider}` : 'none',
        p: variant === 'full' ? 2 : 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <PhoneIphoneIcon color="primary" fontSize={variant === 'full' ? 'large' : 'medium'} />
        <Box>
          <Typography variant={variant === 'full' ? 'body1' : 'body2'} fontWeight="medium">
            Get the Charter App
          </Typography>
          {variant === 'full' && (
            <Typography variant="body2" color="text.secondary">
              Book and manage flights on the go
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        <Button
          component={Link}
          href="/download"
          variant="contained"
          color="primary"
          size={variant === 'full' ? 'medium' : 'small'}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Download Now
        </Button>

        {showCloseButton && (
          <IconButton onClick={handleDismiss} size="small" aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
}
