'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorBookings } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { Box, Paper, Typography, Stack, Alert, CircularProgress, Container } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

export default function OperatorBookingsPage() {
  const { user, userRole } = useAuth();
  const { bookings, loading, error, refreshBookings } = useOperatorBookings(
    userRole === 'operator' ? user?.userCode : undefined
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Operator Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage flight bookings for your aircraft
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshBookings}>
          Refresh
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && bookings.length === 0 ? (
        <Paper 
          elevation={1}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 1,
            mb: 2
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When clients book flights with your operator, they will appear here
          </Typography>
        </Paper>
      ) : (
        <Paper 
          elevation={1}
          sx={{
            p: 0,
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2
          }}
        >
          <Stack>
            {bookings.map((b) => (
              <Box
                key={b.id}
                sx={{ 
                  p: 3,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:hover': { bgcolor: 'action.hover' } 
                }}
              >
                <Link href={`/dashboard/bookings/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Container>
  );
}
