'use client';

import { useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PaymentVerification from '@/components/admin/PaymentVerification';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protect admin route
  useEffect(() => {
    if (!loading && user && user.role !== 'admin' && user.role !== 'superAdmin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
    return null; // Will redirect in useEffect
  }

  return (
    <Box className="container mx-auto px-4 py-8" sx={{ maxWidth: '1200px' }}>
      <PaymentVerification />
    </Box>
  );
}
