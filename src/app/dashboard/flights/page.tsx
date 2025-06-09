'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Flight as FlightIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'; // Assuming you have a Table component
import { toDate } from '@/utils/date-helpers'; // Import the new helper

// Define more specific booking status colors
const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'confirmed':
    case 'client-ready':
    case 'flight-ready':
      return 'success';
    case 'archived':
      return 'info';
    case 'cancelled':
      return 'error';
    case 'pending-payment':
    case 'deposit-paid':
      return 'warning';
    default:
      return 'default';
  }
};

export default function FlightsPage() {
  const { user, userRole } = useAuth();
  const { bookings, loading, error, refreshBookings } = useBookings(
    user?.userCode,
    userRole ?? undefined
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (refreshBookings) {
      await refreshBookings();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredFlights = useMemo(() => {
    return (
      bookings?.filter((booking: Booking) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          booking.bookingId?.toLowerCase().includes(searchTermLower) ||
          booking.routing.departureAirport.toLowerCase().includes(searchTermLower) ||
          booking.routing.arrivalAirport.toLowerCase().includes(searchTermLower) ||
          booking.status.toLowerCase().includes(searchTermLower)
        );
      }) || []
    );
  }, [bookings, searchTerm]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FlightIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h4" fontWeight="bold">
            All Flights
          </Typography>
          <Tooltip title="Refresh Flights">
            <span>
              <IconButton
                onClick={handleManualRefresh}
                sx={{ ml: 2 }}
                color="primary"
                disabled={isRefreshing || loading}
              >
                <RefreshIcon
                  sx={{
                    animation: isRefreshing || loading ? 'spin 1s linear infinite' : 'none',
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <TextField
          placeholder="Search flights..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }} variant="outlined">
        {loading && !isRefreshing ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading flights...</Typography>
          </Box>
        ) : filteredFlights.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>No flights found.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead sx={{ textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlights.map((flight) => {
                const departureDate = toDate(flight.routing.departureDate);
                return (
                  <TableRow key={flight.id}>
                    <TableCell>{flight.bookingId}</TableCell>
                    <TableCell>
                      {flight.routing.departureAirport} → {flight.routing.arrivalAirport}
                    </TableCell>
                    <TableCell>
                      {departureDate ? format(departureDate, 'dd MMM yyyy') : 'Invalid Date'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={flight.status}
                        size="small"
                        color={getStatusColor(flight.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          component={Link}
                          href={`/dashboard/bookings/${flight.id}`}
                          size="small"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
