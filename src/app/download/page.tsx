'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Dialog,
  IconButton,
} from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import {
  PhoneIphone,
  CheckCircle,
  FlightTakeoff,
  Notifications,
  OfflinePin,
  Security,
  Payment,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';

export default function DownloadPage() {
  const theme = useTheme();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showPwaInstall, setShowPwaInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Check if the device is mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    // Check if the app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent default browser behavior
      e.preventDefault();
      // Save the event for later
      setDeferredPrompt(e);
      // Show the install button
      setShowPwaInstall(true);
    });

    // Hide install button if already installed
    if (isInStandaloneMode) {
      setShowPwaInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
    };
  }, []);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      // Reset the deferred prompt
      setDeferredPrompt(null);
      // Hide the install button
      setShowPwaInstall(false);
      // Log the outcome
      console.log(`User ${outcome} the install prompt`);
    }
  };

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const content = (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, position: 'relative' }}>
      {/* Close button */}
      <IconButton
        aria-label="Close"
        onClick={handleClose}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" textAlign="center" gutterBottom>
          Download the Charter App
        </Typography>

        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Manage your private flights on the go with our mobile app
        </Typography>

        <Grid container spacing={4}>
          {/* App Screenshots */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Box
              sx={{
                position: 'relative',
                height: { xs: 400, md: 600 },
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 220, md: 280 },
                  height: { xs: 400, md: 600 },
                  border: '12px solid #333',
                  borderRadius: 5,
                  overflow: 'hidden',
                  boxShadow: theme.shadows[10],
                }}
              >
                {/* Placeholder for a mockup of the app interface */}
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pt: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: '90%',
                      height: 40,
                      bgcolor: '#1A2B3C',
                      borderRadius: 1,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="subtitle2" color="white">
                      Charter
                    </Typography>
                  </Box>
                  <Box
                    sx={{ width: '90%', height: 120, bgcolor: '#C4A962', borderRadius: 1, mb: 2 }}
                  ></Box>
                  <Box
                    sx={{
                      width: '90%',
                      height: 80,
                      bgcolor: 'white',
                      borderRadius: 1,
                      mb: 2,
                      border: '1px solid #ddd',
                    }}
                  ></Box>
                  <Box
                    sx={{
                      width: '90%',
                      height: 80,
                      bgcolor: 'white',
                      borderRadius: 1,
                      mb: 2,
                      border: '1px solid #ddd',
                    }}
                  ></Box>
                  <Box
                    sx={{
                      width: '90%',
                      height: 80,
                      bgcolor: 'white',
                      borderRadius: 1,
                      mb: 2,
                      border: '1px solid #ddd',
                    }}
                  ></Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      width: '100%',
                      height: 60,
                      bgcolor: 'white',
                      borderTop: '1px solid #ddd',
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      px: 2,
                    }}
                  >
                    <FlightTakeoff fontSize="small" />
                    <Notifications fontSize="small" />
                    <PhoneIphone fontSize="small" />
                    <Payment fontSize="small" />
                    <Security fontSize="small" />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Download Links */}
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Get the full Charter experience
              </Typography>

              <List sx={{ mb: 4 }}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Instant Notifications"
                    secondary="Get alerts when operators respond to your quote requests"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Offline Access"
                    secondary="View your bookings and tickets even without an internet connection"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Secure Payments"
                    secondary="Safely make payments for your charter flights"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Digital E-Tickets"
                    secondary="Access your boarding passes right from your phone"
                  />
                </ListItem>
              </List>

              <Box
                sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}
              >
                {/* Apple App Store Badge */}
                <Button
                  component="a"
                  href="https://apps.apple.com/app/chartermarket/id123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  sx={{
                    bgcolor: '#000000',
                    color: 'white',
                    height: 54,
                    width: { xs: '100%', sm: 200 },
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      bgcolor: '#333',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      mr: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                      Download on the
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                      App Store
                    </Typography>
                  </Box>
                  <PhoneIphone />
                </Button>

                {/* Google Play Store Badge */}
                <Button
                  component="a"
                  href="https://play.google.com/store/apps/details?id=app.chartermarket"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  sx={{
                    bgcolor: '#000000',
                    color: 'white',
                    height: 54,
                    width: { xs: '100%', sm: 200 },
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      bgcolor: '#333',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      mr: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                      GET IT ON
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                      Google Play
                    </Typography>
                  </Box>
                  <PhoneIphone />
                </Button>
              </Box>

              {/* Web App Install Prompt */}
              {showPwaInstall && (
                <Card variant="outlined" sx={{ bgcolor: '#f8f8f8', mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <OfflinePin color="primary" fontSize="large" />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Install Charter as a Web App
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Use Charter even without an internet connection
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={handlePwaInstall}
                          sx={{ mt: 1 }}
                        >
                          Install Now
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Typography variant="body2" color="text.secondary">
                By downloading our app, you agree to our{' '}
                <Link href="/terms" style={{ color: theme.palette.primary.main }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: theme.palette.primary.main }}>
                  Privacy Policy
                </Link>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(0,0,0,0.25)',
        },
      }}
    >
      {content}
    </Dialog>
  );
}
