'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Divider,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  Stack,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Flight as FlightIcon,
  FlightTakeoff as FlightTakeoffIcon,
  Notifications as NotificationsIcon,
  Money as MoneyIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  Engineering as EngineeringIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  AirplanemodeActive as AirplaneIcon,
  Business as BusinessIcon,
  AccountCircle as AccountIcon,
  ReceiptLong as ReceiptIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import OperatorOnboardingBanner from '@/components/OperatorOnboardingBanner';
import { formatDistanceToNow } from 'date-fns';
import DashboardCalendar from '@/components/calendar/DashboardCalendar';
import { generateMockFlights } from '@/lib/mockFlightData';
import { CalendarFlight } from '@/components/calendar/FlightCalendar';
import { UserStatus } from '@/types/user';

// Mock data - would be replaced with real data from API
const mockQuoteRequests = [
  {
    id: 'req1',
    route: 'FAJS → FACT',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    passengers: 4,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'req2',
    route: 'FACT → FALE',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    passengers: 6,
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'req3',
    route: 'FALE → FAJS',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    passengers: 2,
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

const mockFlights = [
  {
    id: 'flight1',
    bookingId: 'FLT-OP-JETS-20230601-1234',
    route: 'FAJS → FACT',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    passengers: 4,
    status: 'confirmed',
    isPaid: true,
    client: 'ABC Travel Agency',
  },
  {
    id: 'flight2',
    bookingId: 'FLT-OP-JETS-20230610-5678',
    route: 'FALE → FBSK',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    passengers: 3,
    status: 'pending',
    isPaid: false,
    client: 'John Smith',
  },
];

const mockAircraft = [
  {
    id: 'aircraft1',
    registration: 'ZS-ABC',
    type: 'LIGHT_JET',
    status: 'ACTIVE',
    make: 'CESSNA',
    model: 'CITATION XLS',
  },
  {
    id: 'aircraft2',
    registration: 'ZS-XYZ',
    type: 'MIDSIZE_JET',
    status: 'MAINTENANCE',
    make: 'BOMBARDIER',
    model: 'CHALLENGER 350',
  },
];

export default function OperatorDashboardPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flights, setFlights] = useState<CalendarFlight[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const router = useRouter();

  // Load calendar flights when component mounts
  useEffect(() => {
    if (userRole) {
      setCalendarLoading(true);
      // Generate mock flights
      const mockFlights = generateMockFlights(userRole, 30, 20);
      setFlights(mockFlights);
      setCalendarLoading(false);
    }
  }, [userRole]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
      // Regenerate flight data
      if (userRole) {
        const mockFlights = generateMockFlights(userRole, 30, 20);
        setFlights(mockFlights);
      }
    }, 1000);
  };

  // Check if user is authorized to view this page
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

  // Mock data for operator profile - would come from database
  const operatorProfile = {
    status: (user.emailVerified ? 'active' : 'pending') as UserStatus,
    isProfileComplete: true,
    hasAircraft: mockAircraft.length > 0,
  };

  return (
    <>
      <OperatorOnboardingBanner profile={operatorProfile} isEmailVerified={user.emailVerified} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          Operator Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your flights, aircraft, and quotes
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FlightIcon sx={{ mr: 1 }} />
                    <Typography>Flight Management</Typography>
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AirplaneIcon sx={{ mr: 1 }} />
                    <Typography>Fleet & Equipment</Typography>
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1 }} />
                    <Typography>Financial</Typography>
                  </Box>
                }
              />
            </Tabs>
          </Paper>
        </Grid>

        {/* Tab Content */}
        <Grid size={12}>
          <Box role="tabpanel" hidden={activeTab !== 0}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                {/* Add calendar component */}
                <Grid size={{ xs: 12, md: 4 }}>
                  {calendarLoading ? (
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <CircularProgress />
                    </Paper>
                  ) : (
                    <DashboardCalendar
                      flights={flights}
                      userRole={userRole}
                      title="Flight Schedule"
                    />
                  )}
                </Grid>

                {/* Move flight metrics next to calendar */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" fontWeight="medium">
                        Flight Metrics
                      </Typography>
                      <Tooltip title="Refresh data">
                        <IconButton onClick={handleRefresh} size="small">
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
                      </Tooltip>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                          sx={{
                            height: '100%',
                            borderLeft: '4px solid',
                            borderLeftColor: 'primary.main',
                          }}
                        >
                          <CardContent>
                            <Typography variant="overline" color="text.secondary">
                              Upcoming Flights
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                              {mockFlights.filter((f) => f.status === 'confirmed').length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                          sx={{
                            height: '100%',
                            borderLeft: '4px solid',
                            borderLeftColor: 'warning.main',
                          }}
                        >
                          <CardContent>
                            <Typography variant="overline" color="text.secondary">
                              Pending Quotes
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.dark">
                              {mockQuoteRequests.length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                          sx={{
                            height: '100%',
                            borderLeft: '4px solid',
                            borderLeftColor: 'success.main',
                          }}
                        >
                          <CardContent>
                            <Typography variant="overline" color="text.secondary">
                              Aircraft Available
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.dark">
                              {mockAircraft.length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card
                          sx={{
                            height: '100%',
                            borderLeft: '4px solid',
                            borderLeftColor: 'info.main',
                          }}
                        >
                          <CardContent>
                            <Typography variant="overline" color="text.secondary">
                              Flight Requests
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="info.dark">
                              {mockQuoteRequests.length + 2}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Rest of the flight management tab */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Quote Requests
                    </Typography>

                    {mockQuoteRequests.length > 0 ? (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {mockQuoteRequests.map((request) => (
                          <Box
                            key={request.id}
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                            onClick={() => router.push(`/dashboard/quotes/incoming/${request.id}`)}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {request.route}
                              </Typography>
                              <Chip
                                label={request.status}
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {request.date.toLocaleDateString()} | {request.passengers} passengers
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Received {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Typography color="text.secondary">No pending quote requests</Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 3 }}>
                      <Button
                        component={Link}
                        href="/dashboard/quotes/incoming"
                        variant="outlined"
                        fullWidth
                      >
                        View All Requests
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Upcoming Flights
                    </Typography>

                    {mockFlights.length > 0 ? (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {mockFlights.map((flight) => (
                          <Box
                            key={flight.id}
                            sx={{
                              p: 1.5,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                            onClick={() => router.push(`/dashboard/bookings/${flight.id}`)}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {flight.route}
                              </Typography>
                              <Chip
                                label={flight.status}
                                color={flight.status === 'confirmed' ? 'success' : 'warning'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {flight.date.toLocaleDateString()} | {flight.passengers} passengers
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Client: {flight.client}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontFamily="monospace"
                              color="text.secondary"
                              sx={{ mt: 1, display: 'block' }}
                            >
                              {flight.bookingId}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Typography color="text.secondary">No upcoming flights</Typography>
                      </Box>
                    )}

                    <Box sx={{ mt: 3 }}>
                      <Button
                        component={Link}
                        href="/dashboard/bookings/operator"
                        variant="contained"
                        color="primary"
                        fullWidth
                      >
                        View All Flights
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 1}>
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" fontWeight="medium">
                        Fleet & Equipment
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" fontWeight="medium" gutterBottom>
                            Aircraft
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {mockAircraft.length} aircraft
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" fontWeight="medium" gutterBottom>
                            Aircraft Types
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Array.from(new Set(mockAircraft.map((a) => a.type))).join(', ')}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 2}>
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Financial
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total revenue: $100,000
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Expenses
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total expenses: $50,000
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
