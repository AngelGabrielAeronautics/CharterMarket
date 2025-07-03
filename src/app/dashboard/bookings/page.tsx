'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useClientBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';
import { format } from 'date-fns';
import { Box, Paper, Typography, Stack, Alert } from '@mui/material';
import PageLayout from '@/components/ui/PageLayout';

// Helper to parse Firestore Timestamp or raw JSON into JS Date
function toJsDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  return new Date(value);
}

export default function BookingsPage() {
  const { user } = useAuth();
  const { bookings, loading, error } = useClientBookings(user?.userCode);

  if (loading) {
    return (
      <PageLayout title="My Flights">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography>Loading bookings...</Typography>
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="My Flights">
        <Alert severity="error">{error}</Alert>
      </PageLayout>
    );
  }

  if (!bookings.length) {
    return (
      <PageLayout title="My Flights">
        <Typography>No bookings found.</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Flights">
      <Stack spacing={2} sx={{ mt: 2 }}>
        {bookings.map((b) => (
          <Paper
            key={b.id}
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Link
              href={`/dashboard/bookings/${b.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium" color="text.primary">
                    Booking {b.bookingId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.routing.departureAirport} → {b.routing.arrivalAirport} on{' '}
                    {format(toJsDate(b.routing.departureDate), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: <strong>{b.status}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total:{' '}
                    <strong>
                      ${((b as any).totalPrice || b.payment?.totalAmount || 0).toFixed(2)}
                    </strong>
                  </Typography>
                </Box>
              </Box>
            </Link>
          </Paper>
        ))}
      </Stack>
    </PageLayout>
  );
}
