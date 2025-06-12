'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import FlightCalendar, { CalendarFlight } from '@/components/calendar/FlightCalendar';
import { useBookings } from '@/hooks/useBookings';
import { Booking, BookingStatus } from '@/types/booking';
import { Timestamp } from 'firebase/firestore';
import { UserRole } from '@/lib/userCode';

// Helper to transform Booking status to CalendarFlight status
const transformBookingStatus = (status: BookingStatus): 'confirmed' | 'pending' | 'cancelled' => {
  switch (status) {
    case 'confirmed':
    case 'client-ready':
    case 'flight-ready':
    case 'archived':
      return 'confirmed';
    case 'cancelled':
    case 'credited':
    case 'refunded':
      return 'cancelled';
    case 'pending-payment':
    case 'deposit-paid':
    default:
      return 'pending';
  }
};

const transformBookingToCalendarFlight = (
  booking: Booking,
  userRole: UserRole | null
): CalendarFlight => {
  return {
    id: booking.id,
    flightCode: booking.flightDetails?.flightNumber || booking.bookingId,
    from: booking.routing.departureAirport,
    to: booking.routing.arrivalAirport,
    date: (booking.routing.departureDate as Timestamp).toDate(),
    status: transformBookingStatus(booking.status),
    role: userRole === 'operator' ? 'both' : 'departure',
    passengers: booking.passengerCount,
    operatorCode: booking.operator.operatorUserCode,
    operatorName: booking.operator.operatorName,
    // clientName can be added later if needed, for now it's self-evident
  };
};

export default function CalendarPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refreshBookings,
  } = useBookings(user?.userCode, userRole ?? undefined);

  const [flights, setFlights] = useState<CalendarFlight[]>([]);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (bookings) {
      const calendarFlights = bookings.map((booking) =>
        transformBookingToCalendarFlight(booking, userRole)
      );
      setFlights(calendarFlights);
    }
  }, [bookings, userRole]);

  // Handle change of view type (calendar/list)
  const handleViewTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewType: 'calendar' | 'list' | null
  ) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };

  // Refresh flights data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshBookings) {
      await refreshBookings();
    }
    setIsRefreshing(false);
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Please sign in to view your flight calendar.
        </Typography>
      </Box>
    );
  }

  const isLoading = bookingsLoading || isRefreshing;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Flight Calendar
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewTypeChange}
            aria-label="view type"
            size="small"
          >
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              Calendar
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ListIcon fontSize="small" sx={{ mr: 1 }} />
              List
            </ToggleButton>
          </ToggleButtonGroup>

          <Tooltip title="Refresh data">
            <span>
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshIcon
                  sx={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={500} animation="wave" sx={{ borderRadius: 2 }} />
        </Box>
      ) : viewType === 'calendar' ? (
        <FlightCalendar flights={flights} userRole={userRole!} />
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Flight List View
          </Typography>

          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" paragraph>
              List view is coming soon!
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setViewType('calendar')}
              startIcon={<CalendarIcon />}
            >
              Switch to Calendar View
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
