'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudDownload as DownloadIcon,
  Assignment as ManifestIcon,
  RemoveRedEye as ViewIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Flight as FlightIcon,
  EventAvailable as DateIcon,
  Sort as SortIcon,
  ArrowDownward as DescIcon,
  ArrowUpward as AscIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Mock data for flights
const mockFlights = [
  {
    id: 'flight1',
    bookingId: 'FLT-OP-JETS-20230601-1234',
    route: 'FAJS → FACT',
    departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    passengerCount: 4,
    status: 'confirmed',
    aircraft: 'ZS-ABC',
    client: 'John Smith',
    passengerManifestStatus: 'complete',
  },
  {
    id: 'flight2',
    bookingId: 'FLT-OP-JETS-20230610-5678',
    route: 'FACT → FALE',
    departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    passengerCount: 6,
    status: 'confirmed',
    aircraft: 'ZS-XYZ',
    client: 'ABC Travel Agency',
    passengerManifestStatus: 'incomplete',
  },
  {
    id: 'flight3',
    bookingId: 'FLT-OP-JETS-20230515-9012',
    route: 'FAJS → FBSK',
    departureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    passengerCount: 6,
    status: 'completed',
    aircraft: 'ZS-ABC',
    client: 'Luxury Travels',
    passengerManifestStatus: 'complete',
  },
];

// Mock data for passengers
const mockPassengers = [
  {
    id: 'pax1',
    flightId: 'flight1',
    firstName: 'John',
    lastName: 'Smith',
    passport: 'AB123456',
    nationality: 'South African',
    dob: new Date('1985-05-15'),
    specialRequirements: 'Vegetarian meal',
    passportExpiry: new Date('2028-06-20'),
    issuingCountry: 'South Africa',
    contactNumber: '+27 82 123 4567',
    email: 'john.smith@example.com',
  },
  {
    id: 'pax2',
    flightId: 'flight1',
    firstName: 'Jane',
    lastName: 'Smith',
    passport: 'AB789012',
    nationality: 'South African',
    dob: new Date('1988-09-22'),
    specialRequirements: null,
    passportExpiry: new Date('2027-11-15'),
    issuingCountry: 'South Africa',
    contactNumber: '+27 83 987 6543',
    email: 'jane.smith@example.com',
  },
  {
    id: 'pax3',
    flightId: 'flight1',
    firstName: 'Michael',
    lastName: 'Johnson',
    passport: 'CD345678',
    nationality: 'American',
    dob: new Date('1975-12-03'),
    specialRequirements: 'Wheelchair assistance',
    passportExpiry: new Date('2029-01-10'),
    issuingCountry: 'United States',
    contactNumber: '+1 555 123 4567',
    email: 'michael.johnson@example.com',
  },
  {
    id: 'pax4',
    flightId: 'flight1',
    firstName: 'Sarah',
    lastName: 'Williams',
    passport: 'EF901234',
    nationality: 'British',
    dob: new Date('1990-03-18'),
    specialRequirements: null,
    passportExpiry: new Date('2026-08-25'),
    issuingCountry: 'United Kingdom',
    contactNumber: '+44 7700 900123',
    email: 'sarah.williams@example.com',
  },
];

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export default function PassengerManifestsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'departureDate',
    direction: 'asc',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isPassengerDialogOpen, setIsPassengerDialogOpen] = useState(false);

  // Check if user is authorized
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || (userRole !== 'operator' && userRole !== 'admin' && userRole !== 'superAdmin')) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        You are not authorized to access this page. This page is only for operators.
      </Alert>
    );
  }

  // Sort flights
  const sortedFlights = [...mockFlights].sort((a, b) => {
    if (sortConfig.key === 'departureDate') {
      return sortConfig.direction === 'asc'
        ? a.departureDate.getTime() - b.departureDate.getTime()
        : b.departureDate.getTime() - a.departureDate.getTime();
    } else if (sortConfig.key === 'route') {
      return sortConfig.direction === 'asc'
        ? a.route.localeCompare(b.route)
        : b.route.localeCompare(a.route);
    } else if (sortConfig.key === 'passengerCount') {
      return sortConfig.direction === 'asc'
        ? a.passengerCount - b.passengerCount
        : b.passengerCount - a.passengerCount;
    }
    // Default sort by date
    return a.departureDate.getTime() - b.departureDate.getTime();
  });

  // Filter flights
  const filteredFlights = sortedFlights.filter(
    (flight) =>
      flight.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.aircraft.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get passengers for selected flight
  const flightPassengers = selectedFlight
    ? mockPassengers.filter((p) => p.flightId === selectedFlight)
    : [];

  // Get flight details
  const flightDetails = selectedFlight ? mockFlights.find((f) => f.id === selectedFlight) : null;

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setAnchorEl(null);
  };

  const handleSortChange = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
    handleSortClose();
  };

  const handleViewPassengers = (flightId: string) => {
    setSelectedFlight(flightId);
    setIsPassengerDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          Passenger Manifests
        </Typography>
        <Typography variant="h6" color="text.secondary">
          View and manage passenger information for all flights
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search flights..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              size="small"
              sx={{ mr: 1 }}
            >
              Sort
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleSortClose}>
              <MenuItem onClick={() => handleSortChange('departureDate')}>
                <ListItemIcon>
                  {sortConfig.key === 'departureDate' &&
                    (sortConfig.direction === 'asc' ? (
                      <AscIcon fontSize="small" />
                    ) : (
                      <DescIcon fontSize="small" />
                    ))}
                </ListItemIcon>
                <ListItemText>Date</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleSortChange('route')}>
                <ListItemIcon>
                  {sortConfig.key === 'route' &&
                    (sortConfig.direction === 'asc' ? (
                      <AscIcon fontSize="small" />
                    ) : (
                      <DescIcon fontSize="small" />
                    ))}
                </ListItemIcon>
                <ListItemText>Route</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleSortChange('passengerCount')}>
                <ListItemIcon>
                  {sortConfig.key === 'passengerCount' &&
                    (sortConfig.direction === 'asc' ? (
                      <AscIcon fontSize="small" />
                    ) : (
                      <DescIcon fontSize="small" />
                    ))}
                </ListItemIcon>
                <ListItemText>Passenger Count</ListItemText>
              </MenuItem>
            </Menu>
            <Button variant="outlined" startIcon={<FilterIcon />} size="small">
              Filter
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Flight ID</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Aircraft</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Passengers</TableCell>
                <TableCell>Manifest Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFlights.map((flight) => (
                <TableRow
                  key={flight.id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    bgcolor: flight.status === 'completed' ? 'action.hover' : 'inherit',
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FlightIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" fontFamily="monospace">
                        {flight.bookingId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{flight.route}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2">
                          {format(flight.departureDate, 'dd MMM yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(flight.departureDate, 'HH:mm')}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{flight.aircraft}</TableCell>
                  <TableCell>{flight.client}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{flight.passengerCount}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        flight.passengerManifestStatus === 'complete' ? 'Complete' : 'Incomplete'
                      }
                      color={flight.passengerManifestStatus === 'complete' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Passengers">
                      <IconButton
                        size="small"
                        onClick={() => handleViewPassengers(flight.id)}
                        sx={{ mr: 0.5 }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Manifest">
                      <IconButton size="small" sx={{ mr: 0.5 }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print Manifest">
                      <IconButton size="small">
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFlights.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No flights found matching your search criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Passenger Manifest Dialog */}
      <Dialog
        open={isPassengerDialogOpen}
        onClose={() => setIsPassengerDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Passenger Manifest</Typography>
            <IconButton onClick={() => setIsPassengerDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {flightDetails && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Flight
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {flightDetails.bookingId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Route
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {flightDetails.route}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {format(flightDetails.departureDate, 'dd MMM yyyy HH:mm')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Aircraft
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {flightDetails.aircraft}
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          <Typography variant="h6" gutterBottom>
            Passengers
          </Typography>

          {flightPassengers.length > 0 ? (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Passport</TableCell>
                      <TableCell>Nationality</TableCell>
                      <TableCell>Date of Birth</TableCell>
                      <TableCell>Special Requirements</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {flightPassengers.map((passenger) => (
                      <TableRow key={passenger.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {passenger.firstName} {passenger.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {passenger.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{passenger.passport}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Expires: {format(passenger.passportExpiry, 'dd MMM yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>{passenger.nationality}</TableCell>
                        <TableCell>{format(passenger.dob, 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          {passenger.specialRequirements ? (
                            <Chip
                              label={passenger.specialRequirements}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {flightPassengers.length} passengers in total
                </Typography>
                <Box>
                  <Button startIcon={<PdfIcon />} variant="outlined" size="small" sx={{ mr: 1 }}>
                    Export PDF
                  </Button>
                  <Button startIcon={<EmailIcon />} variant="outlined" size="small">
                    Email Manifest
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Alert severity="warning">No passenger information available for this flight.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPassengerDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            component={Link}
            href={`/dashboard/bookings/${selectedFlight}`}
          >
            View Flight Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
