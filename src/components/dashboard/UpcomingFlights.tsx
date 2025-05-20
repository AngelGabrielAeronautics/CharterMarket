'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { useClientBookings } from '@/hooks/useBookings';
import FlightStatusCard from '@/components/ui/FlightStatusCard';
import { Booking } from '@/types/booking';
import { useRouter } from 'next/navigation';
import { isFuture, isPast, isToday, compareDesc } from 'date-fns';

interface UpcomingFlightsProps {
  userCode: string;
}

// Helper function to convert any timestamp/date object to JS Date
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

export default function UpcomingFlights({ userCode }: UpcomingFlightsProps) {
  const { bookings, loading, error } = useClientBookings(userCode);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFlightCardClick = (bookingId: string) => {
    router.push(`/dashboard/bookings/${bookingId}`);
  };

  // Filter and sort bookings by date
  const processedBookings = bookings
    .map((booking) => ({
      ...booking,
      departureDateObj: toJsDate(booking.routing.departureDate),
    }))
    .sort((a, b) => compareDesc(b.departureDateObj, a.departureDateObj));

  const upcomingBookings = processedBookings.filter(
    (booking) =>
      booking.status !== 'cancelled' &&
      (isFuture(booking.departureDateObj) || isToday(booking.departureDateObj))
  );

  const pastBookings = processedBookings.filter(
    (booking) => isPast(booking.departureDateObj) && !isToday(booking.departureDateObj)
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Loading your flights...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }

    if (activeTab === 0 && upcomingBookings.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" gutterBottom>
            You don't have any upcoming flights
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/dashboard/quotes/request')}
            sx={{ mt: 2 }}
          >
            Book a Flight
          </Button>
        </Box>
      );
    }

    if (activeTab === 1 && pastBookings.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1">You don't have any past flight history</Typography>
        </Box>
      );
    }

    const displayedBookings = activeTab === 0 ? upcomingBookings : pastBookings;

    return (
      <Stack spacing={2} sx={{ mt: 2 }}>
        {displayedBookings.map((booking) => (
          <FlightStatusCard
            key={booking.id}
            bookingId={booking.bookingId}
            departureAirport={booking.routing.departureAirport}
            arrivalAirport={booking.routing.arrivalAirport}
            departureDate={booking.departureDateObj}
            status={booking.status}
            flightNumber={booking.flightNumber}
            operatorName={booking.operatorName}
            isPaid={booking.isPaid}
            onClick={() => handleFlightCardClick(booking.id)}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="medium" gutterBottom>
        My Flights
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label={`Upcoming (${upcomingBookings.length})`} id="tab-0" />
        <Tab label={`Past (${pastBookings.length})`} id="tab-1" />
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      {renderContent()}
    </Paper>
  );
}
