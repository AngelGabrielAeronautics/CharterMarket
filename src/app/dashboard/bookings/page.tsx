"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useClientBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';
import { format } from 'date-fns';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Alert
} from '@mui/material';

export default function BookingsPage() {
  const { user } = useAuth();
  const { bookings, loading, error } = useClientBookings(user?.uid);

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}><Typography>Loading bookings...</Typography></Box>;
  if (error) return <Box sx={{ p: 8, textAlign: 'center' }}><Alert severity="error">{error}</Alert></Box>;
  if (!bookings.length) return <Box sx={{ p: 8, textAlign: 'center' }}><Typography>No bookings found.</Typography></Box>;

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        My Bookings
      </Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {bookings.map((b) => (
          <Paper key={b.id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
            <Link href={`/dashboard/bookings/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium" color="text.primary">
                    Booking {b.bookingId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.routing.departureAirport} → {b.routing.arrivalAirport} on {format(b.routing.departureDate.toDate(), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: <strong>{b.status}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total: <strong>${b.totalPrice.toFixed(2)}</strong>
                  </Typography>
                </Box>
              </Box>
            </Link>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
} 