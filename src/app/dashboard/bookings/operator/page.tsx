'use client';

import { Box, Paper, Typography, Stack } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorBookings } from '@/hooks/useBookings';
import { format } from 'date-fns';

// Helper to parse Firestore Timestamp or raw JSON into JS Date
function toJsDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  return new Date(value);
}

export default function OperatorBookingsPage() {
  const { user, userRole } = useAuth();
  const { bookings, loading, error } = useOperatorBookings(
    userRole === 'operator' ? user?.userCode : undefined
  );

  if (loading)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography>Loading bookings...</Typography>
      </Box>
    );
  if (error)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  if (!bookings.length)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <Typography>No bookings found.</Typography>
      </Box>
    );

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Operator Bookings
      </Typography>
      <Stack spacing={2}>
        {bookings.map((b) => (
          <Paper
            key={b.id}
            variant="outlined"
            sx={{ p: 2, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Link href={`/dashboard/bookings/${b.id}`} passHref>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Booking {b.bookingId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.routing.departureAirport} → {b.routing.arrivalAirport} on{' '}
                    {format(toJsDate(b.routing.departureDate), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Client: <strong>{b.clientId}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: <strong>{b.status}</strong>
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
