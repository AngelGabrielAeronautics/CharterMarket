'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFlights, useFlightDetail } from '@/hooks/useFlights';
import { Flight, FlightLeg } from '@/types/flight';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Flight as FlightIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  FlightTakeoff as TakeoffIcon,
  FlightLand as LandIcon,
  Groups as GroupsIcon,
  AirplaneTicket as TicketIcon,
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button } from '@/components/ui/Button';
import tokens from '@/styles/tokens';
import PageLayout from '@/components/ui/PageLayout';

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

// Leg status colors
const getLegStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'scheduled':
    case 'available':
      return 'primary';
    case 'booked':
      return 'info';
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

interface FlightDetailModalProps {
  open: boolean;
  onClose: () => void;
  flightId: string | null;
}

function FlightDetailModal({ open, onClose, flightId }: FlightDetailModalProps) {
  const { flight, loading, error } = useFlightDetail(flightId || undefined);

  if (!flightId) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Flight Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {flight && (
          <Box sx={{ py: 2 }}>
            {/* Flight Overview */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Flight Overview
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><FlightIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Flight Group ID" 
                          secondary={flight.flightGroupId} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Operator" 
                          secondary={flight.operatorUserCode} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><ScheduleIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Status" 
                          secondary={
                            <Chip 
                              label={flight.status} 
                              size="small" 
                              color={getFlightStatusColor(flight.status)} 
                            />
                          } 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TicketIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Total Legs" 
                          secondary={flight.totalLegs} 
                        />
                      </ListItem>
                    </List>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Reference Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><ReceiptIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Primary Booking" 
                          secondary={flight.primaryBookingId || 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><LocationIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Aircraft ID" 
                          secondary={flight.aircraftId} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><ScheduleIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Created" 
                          secondary={format(flight.createdAt.toDate(), 'MMM dd, yyyy HH:mm')} 
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Flight Legs */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Flight Legs ({flight.legs.length})
            </Typography>
            
            {flight.legs.map((leg, index) => (
              <Accordion key={leg.legNumber} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Leg {leg.legNumber}: {leg.flightNumber}
                    </Typography>
                    <Chip 
                      label={leg.legType} 
                      size="small" 
                      color={leg.legType === 'passenger' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                    <Chip 
                      label={leg.status} 
                      size="small" 
                      color={getLegStatusColor(leg.status)} 
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                      {leg.departureAirport} → {leg.arrivalAirport}
                    </Typography>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Route Information */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Route Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><TakeoffIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Departure" 
                            secondary={`${leg.departureAirport} ${leg.departureAirportName ? `(${leg.departureAirportName})` : ''}`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><LandIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Arrival" 
                            secondary={`${leg.arrivalAirport} ${leg.arrivalAirportName ? `(${leg.arrivalAirportName})` : ''}`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ScheduleIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Scheduled Departure" 
                            secondary={format(leg.scheduledDepartureTime.toDate(), 'MMM dd, yyyy HH:mm')} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ScheduleIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Scheduled Arrival" 
                            secondary={format(leg.scheduledArrivalTime.toDate(), 'MMM dd, yyyy HH:mm')} 
                          />
                        </ListItem>
                      </List>
                    </Grid>

                    {/* Capacity & Bookings */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Capacity & Bookings
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><GroupsIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Max Seats" 
                            secondary={leg.maxSeats} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><GroupsIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Available Seats" 
                            secondary={leg.availableSeats || 0} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><TicketIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Bookings" 
                            secondary={leg.bookingIds?.length || 0} 
                          />
                        </ListItem>
                        {leg.bookingIds && leg.bookingIds.length > 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="Booking IDs" 
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  {leg.bookingIds.map((bookingId, idx) => (
                                    <Chip 
                                      key={idx} 
                                      label={bookingId} 
                                      size="small" 
                                      variant="outlined" 
                                      sx={{ mr: 1, mb: 1 }}
                                    />
                                  ))}
                                </Box>
                              } 
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function FlightsPage() {
  const { user, userRole } = useAuth();
  const { flights, loading, error, refreshFlights } = useFlights(user?.userCode, userRole || undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshFlights();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredFlights = useMemo(() => {
    return flights.filter((flight: Flight) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        flight.flightGroupId.toLowerCase().includes(searchTermLower) ||
        flight.operatorUserCode.toLowerCase().includes(searchTermLower) ||
        flight.status.toLowerCase().includes(searchTermLower) ||
        flight.legs.some(leg => 
          leg.departureAirport.toLowerCase().includes(searchTermLower) ||
          leg.arrivalAirport.toLowerCase().includes(searchTermLower) ||
          leg.flightNumber.toLowerCase().includes(searchTermLower)
        )
      );
    });
  }, [flights, searchTerm]);

  return (
    <PageLayout
      title="Flights"
      subtitle="Comprehensive flight management bringing together all booking components"
      icon={<FlightIcon color="primary" sx={{ fontSize: 32 }} />}
      actions={
        <>
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
            sx={{ width: { xs: 200, sm: 300 } }}
          />
          <Tooltip title="Refresh Flights">
            <span>
              <IconButton
                onClick={handleManualRefresh}
                color="primary"
                disabled={isRefreshing || loading}
              >
                <RefreshIcon
                  sx={{ animation: isRefreshing || loading ? 'spin 1s linear infinite' : 'none' }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Flight Cards */}
      {loading && !isRefreshing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6">Loading flights...</Typography>
            <Typography variant="body2" color="text.secondary">
              Gathering comprehensive flight data
            </Typography>
          </Box>
        </Box>
      ) : filteredFlights.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <FlightIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No flights found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search criteria' : 'Flights will appear here once created from confirmed bookings'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredFlights.map((flight) => {
            const primaryLeg = flight.legs.find(leg => leg.legType === 'passenger') || flight.legs[0];
            const totalBookings = flight.legs.reduce((acc, leg) => acc + (leg.bookingIds?.length || 0), 0);
            
            return (
              <Grid size={{ xs: 12, lg: 6, xl: 4 }} key={flight.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': { 
                      boxShadow: tokens.shadow.heavy.value,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    borderRadius: 2,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedFlightId(flight.id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Flight Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {flight.flightGroupId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {flight.operatorUserCode}
                        </Typography>
                      </Box>
                      <Chip 
                        label={flight.status} 
                        size="small" 
                        color={getFlightStatusColor(flight.status)} 
                      />
                    </Box>

                    {/* Primary Route */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {primaryLeg.departureAirport}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(primaryLeg.scheduledDepartureTime.toDate(), 'HH:mm')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                        <FlightIcon sx={{ transform: 'rotate(90deg)', color: 'primary.main' }} />
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {primaryLeg.arrivalAirport}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(primaryLeg.scheduledArrivalTime.toDate(), 'HH:mm')}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Flight Stats */}
                    <Grid container spacing={2}>
                      <Grid size={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            {flight.totalLegs}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Legs
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            {totalBookings}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Bookings
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            {format(primaryLeg.scheduledDepartureTime.toDate(), 'MMM dd')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Date
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Leg Types */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {flight.legs.map((leg) => (
                        <Chip 
                          key={leg.legNumber}
                          label={`${leg.legType} leg`}
                          size="small"
                          variant="outlined"
                          color={leg.legType === 'passenger' ? 'primary' : 'default'}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Flight Detail Modal */}
      <FlightDetailModal 
        open={!!selectedFlightId}
        onClose={() => setSelectedFlightId(null)}
        flightId={selectedFlightId}
      />
    </PageLayout>
  );
}
