'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFlights } from '@/hooks/useFlights';
import { Flight } from '@/types/flight';
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
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Flight as FlightIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { Button } from '@/components/ui/Button';

// Flight status colors
const getFlightStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'scheduled':
      return 'primary';
    case 'in-progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// Simple FlightDetailModal component
interface FlightDetailModalProps {
  open: boolean;
  onClose: () => void;
  flightId: string | null;
}

function FlightDetailModal({ open, onClose, flightId }: FlightDetailModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Flight Details</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {!flightId ? (
            <Typography>No flight selected</Typography>
          ) : (
            <Typography>Loading flight {flightId} details...</Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function FlightsPage() {
  const { user } = useAuth();
  const { flights, loading, error, refreshFlights } = useFlights(user?.userCode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    await refreshFlights();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleOpenFlightDetails = (flightId: string) => {
    setSelectedFlightId(flightId);
  };

  const handleCloseFlightDetails = () => {
    setSelectedFlightId(null);
  };

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const searchTerms = [
        flight.flightGroupId.toLowerCase(),
        flight.status.toLowerCase(),
        flight.operatorUserCode.toLowerCase(),
        ...flight.legs.map((leg) => leg.departureAirport.toLowerCase()),
        ...flight.legs.map((leg) => leg.arrivalAirport.toLowerCase()),
      ];
      return searchTerms.some((term) => term.includes(searchQuery));
    });
  }, [flights, searchQuery]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Flights
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          View and manage your flight operations
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search flights..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: '300px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleManualRefresh}>
          Refresh
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && filteredFlights.length === 0 && (
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
            No flights found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'Try adjusting your search criteria' : 'Your flights will appear here once created'}
          </Typography>
        </Paper>
      )}

      {!loading && !error && filteredFlights.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredFlights.map((flight) => (
            <Paper 
              key={flight.id}
              elevation={1}
              sx={{ 
                p: 3, 
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {/* Flight Info */}
                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FlightIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      {flight.flightGroupId}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Operator: {flight.operatorUserCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {format(flight.createdAt.toDate(), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                
                {/* Flight Status */}
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Status: <Chip 
                      label={flight.status} 
                      size="small" 
                      color={getFlightStatusColor(flight.status)} 
                    />
                  </Typography>
                  <Typography variant="body2">
                    Legs: {flight.totalLegs}
                  </Typography>
                  <Typography variant="body2">
                    Aircraft: {flight.aircraftId}
                  </Typography>
                </Box>
                
                {/* Actions */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start',
                  flex: '0 0 auto'
                }}>
                  <Tooltip title="View Details">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenFlightDetails(flight.id)}
                      sx={{ 
                        position: { xs: 'absolute', sm: 'relative' }, 
                        top: { xs: '10px', sm: 'auto' }, 
                        right: { xs: '10px', sm: 'auto' } 
                      }}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      
      <FlightDetailModal 
        open={!!selectedFlightId} 
        onClose={handleCloseFlightDetails}
        flightId={selectedFlightId}
      />
    </Container>
  );
}
