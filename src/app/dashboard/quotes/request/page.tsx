'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BookingForm from '@/components/BookingForm';
import { Box, Container, CircularProgress, Typography, Paper } from '@mui/material';
import tokens from '@/styles/tokens';

export default function RequestQuotePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard/quotes/request');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: tokens.spacing[4].value }}>
      <Box sx={{ mb: tokens.spacing[4].value }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Request a Charter Quote
        </Typography>
      </Box>
      <Paper
        sx={{
          p: tokens.spacing[4].value,
          borderRadius: tokens.borderRadius.md.value,
          boxShadow: tokens.shadow.medium.value,
        }}
      >
        <BookingForm />
      </Paper>
    </Container>
  );
}
