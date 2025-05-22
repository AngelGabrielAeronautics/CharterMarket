'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  AirplanemodeActive as AircraftIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Construction as MaintenanceIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for aircraft
const mockAircraft = [
  {
    id: 'aircraft1',
    registration: 'ZS-ABC',
    type: 'LIGHT_JET',
    status: 'ACTIVE',
    make: 'CESSNA',
    model: 'CITATION XLS',
    maxPassengers: 8,
    baseAirport: 'FAJS',
    year: 2018,
    imageSrc: '/images/aircraft/citation-xls.jpg',
    lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    flightHours: 1250,
    flightsCount: 423,
  },
  {
    id: 'aircraft2',
    registration: 'ZS-XYZ',
    type: 'MIDSIZE_JET',
    status: 'MAINTENANCE',
    make: 'BOMBARDIER',
    model: 'CHALLENGER 350',
    maxPassengers: 10,
    baseAirport: 'FACT',
    year: 2020,
    imageSrc: '/images/aircraft/challenger-350.jpg',
    lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    nextMaintenance: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000), // 85 days from now
    flightHours: 860,
    flightsCount: 212,
  },
  {
    id: 'aircraft3',
    registration: 'ZS-JET',
    type: 'HEAVY_JET',
    status: 'ACTIVE',
    make: 'GULFSTREAM',
    model: 'G650',
    maxPassengers: 18,
    baseAirport: 'FAJS',
    year: 2019,
    imageSrc: '/images/aircraft/g650.jpg',
    lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    flightHours: 2100,
    flightsCount: 380,
  },
];

// Mock data for scheduled maintenance
const mockMaintenanceSchedule = [
  {
    id: 'maint1',
    aircraftId: 'aircraft2',
    registration: 'ZS-XYZ',
    type: 'A-Check',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    facility: 'ExecuJet Maintenance',
    status: 'in-progress',
    notes: 'Regular A-Check maintenance with additional avionics update',
  },
  {
    id: 'maint2',
    aircraftId: 'aircraft1',
    registration: 'ZS-ABC',
    type: 'B-Check',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    facility: 'NAC Maintenance',
    status: 'scheduled',
    notes: 'Scheduled B-Check maintenance',
  },
];

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'MAINTENANCE':
      return 'warning';
    case 'INACTIVE':
      return 'error';
    default:
      return 'default';
  }
};

export default function FleetManagementPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (aircraftId: string) => {
    setSelectedAircraft(aircraftId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedAircraft(null);
      // In a real app, we would remove the aircraft from the list
    }, 1500);
  };

  const filteredAircraft = mockAircraft.filter(
    (aircraft) =>
      aircraft.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aircraft.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aircraft.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAircraft = filteredAircraft.filter((a) => a.status === 'ACTIVE');
  const maintenanceAircraft = filteredAircraft.filter((a) => a.status === 'MAINTENANCE');

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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          Fleet Management
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your aircraft and maintenance schedule
        </Typography>
      </Box>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search aircraft..."
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/operator/aircraft/new"
          >
            Add Aircraft
          </Button>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span">All Aircraft</Box>
                <Chip
                  label={filteredAircraft.length}
                  size="small"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span">Active</Box>
                <Chip
                  label={activeAircraft.length}
                  size="small"
                  color="success"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span">Maintenance</Box>
                <Chip
                  label={maintenanceAircraft.length}
                  size="small"
                  color="warning"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
          <Tab label="Maintenance Schedule" />
        </Tabs>

        {tabValue === 3 ? (
          // Maintenance schedule tab
          (<TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Aircraft</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Facility</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockMaintenanceSchedule.map((maintenance) => (
                  <TableRow
                    key={maintenance.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {maintenance.registration}
                    </TableCell>
                    <TableCell>{maintenance.type}</TableCell>
                    <TableCell>{maintenance.startDate.toLocaleDateString()}</TableCell>
                    <TableCell>{maintenance.endDate.toLocaleDateString()}</TableCell>
                    <TableCell>{maintenance.facility}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          maintenance.status === 'in-progress'
                            ? 'In Progress'
                            : maintenance.status === 'scheduled'
                              ? 'Scheduled'
                              : maintenance.status
                        }
                        color={
                          maintenance.status === 'in-progress'
                            ? 'warning'
                            : maintenance.status === 'scheduled'
                              ? 'info'
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{maintenance.notes}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>)
        ) : (
          // Aircraft grid view for other tabs
          (<Grid container spacing={3}>
            {(tabValue === 0
              ? filteredAircraft
              : tabValue === 1
                ? activeAircraft
                : maintenanceAircraft
            ).map((aircraft) => (
              <Grid
                key={aircraft.id}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4
                }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={aircraft.imageSrc || '/images/aircraft/default.jpg'}
                    alt={`${aircraft.make} ${aircraft.model}`}
                    sx={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      backgroundColor: '#f0f4f9',
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" component="div" fontWeight="bold">
                        {aircraft.registration}
                      </Typography>
                      <Chip
                        label={aircraft.status}
                        color={getStatusColor(aircraft.status) as any}
                        size="small"
                        icon={
                          aircraft.status === 'ACTIVE' ? (
                            <CheckIcon fontSize="small" />
                          ) : aircraft.status === 'MAINTENANCE' ? (
                            <MaintenanceIcon fontSize="small" />
                          ) : (
                            <WarningIcon fontSize="small" />
                          )
                        }
                      />
                    </Box>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      {aircraft.make} {aircraft.model} ({aircraft.year})
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Base: {aircraft.baseAirport}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Capacity: {aircraft.maxPassengers} pax
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Flight hours: {aircraft.flightHours}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Flights: {aircraft.flightsCount}
                      </Typography>
                    </Box>

                    {/* Maintenance alert */}
                    {aircraft.nextMaintenance && (
                      <Alert
                        severity={
                          (aircraft.nextMaintenance.getTime() - Date.now()) /
                            (24 * 60 * 60 * 1000) <
                          14
                            ? 'warning'
                            : 'info'
                        }
                        icon={<InfoIcon fontSize="inherit" />}
                        sx={{ mt: 2, py: 0.5, px: 1 }}
                      >
                        <Typography variant="caption">
                          Next maintenance: {aircraft.nextMaintenance.toLocaleDateString()}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      component={Link}
                      href={`/operator/aircraft/${aircraft.id}`}
                    >
                      Edit
                    </Button>
                    <Box>
                      <Tooltip title="Schedule Maintenance">
                        <IconButton size="small" sx={{ mr: 0.5 }}>
                          <MaintenanceIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Aircraft">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(aircraft.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {/* Empty state */}
            {(tabValue === 0
              ? filteredAircraft
              : tabValue === 1
                ? activeAircraft
                : maintenanceAircraft
            ).length === 0 && (
              <Grid size={12}>
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <AircraftIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Aircraft Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {searchQuery
                      ? `No aircraft matching "${searchQuery}"`
                      : tabValue === 1
                        ? 'No active aircraft in your fleet'
                        : tabValue === 2
                          ? 'No aircraft currently in maintenance'
                          : 'Start by adding your first aircraft'}
                  </Typography>
                  {!searchQuery && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      component={Link}
                      href="/operator/aircraft/new"
                    >
                      Add Aircraft
                    </Button>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>)
        )}
      </Paper>
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this aircraft? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
