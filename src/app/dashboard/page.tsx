'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useOperatorQuoteRequests } from '@/hooks/useFlights';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Grid,
  Stack,
  Badge,
  Chip,
  Link as MuiLink,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  People as UsersIcon,
  Flight as PlaneIcon,
  BusinessCenter as BuildingIcon,
  CalendarMonth as CalendarDaysIcon,
  Settings as SettingsIcon,
  PersonAdd as UserPlusIcon,
  FlightTakeoff as PlaneTakeoffIcon,
  ListAlt as ListAltIcon,
  NotificationsActive as NotificationsActiveIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import UpcomingFlights from '@/components/dashboard/UpcomingFlights';
import PassengerQuickActions from '@/components/dashboard/PassengerQuickActions';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import { Button } from '@/components/ui/Button';
import FlightRequestForm from '@/components/dashboard/FlightRequestForm';
import DashboardCalendar from '@/components/calendar/DashboardCalendar';
import { generateMockFlights } from '@/lib/mockFlightData';
import { CalendarFlight } from '@/components/calendar/FlightCalendar';

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const superAdminQuickActions: QuickAction[] = [
  {
    name: 'Manage Users',
    description: 'View and manage all users in the system',
    href: '/admin/users',
    icon: UsersIcon,
  },
  {
    name: 'Manage Companies',
    description: 'View and manage operator companies',
    href: '/admin/companies',
    icon: BuildingIcon,
  },
  {
    name: 'System Settings',
    description: 'Configure system-wide settings',
    href: '/admin/settings',
    icon: SettingsIcon,
  },
];

const agentQuickActions: QuickAction[] = [
  {
    name: 'Book Flight',
    description: 'Create a new flight booking',
    href: '/bookings/new',
    icon: PlaneTakeoffIcon,
  },
  {
    name: 'View Schedule',
    description: 'Check upcoming flights and bookings',
    href: '/schedule',
    icon: CalendarDaysIcon,
  },
];

const operatorQuickActions: QuickAction[] = [
  {
    name: 'Manage Fleet',
    description: 'View and manage your aircraft fleet',
    href: '/fleet',
    icon: PlaneIcon,
  },
  {
    name: 'Incoming Requests',
    description: 'View and respond to quote requests',
    href: '/dashboard/quotes/incoming',
    icon: ListAltIcon,
  },
  {
    name: 'Invite Staff',
    description: 'Add new staff members to your team',
    href: '/staff/invite',
    icon: UserPlusIcon,
  },
];

const getQuickActions = (role: string | undefined): QuickAction[] => {
  switch (role) {
    case 'superAdmin':
      return superAdminQuickActions;
    case 'agent':
      return agentQuickActions;
    case 'operator':
      return operatorQuickActions;
    default:
      return [];
  }
};

const getDashboardTitle = (role: string | undefined): string => {
  switch (role) {
    case 'superAdmin':
      return 'Super Admin Dashboard';
    case 'admin':
      return 'Admin Dashboard';
    case 'operator':
      return 'Operator Dashboard';
    case 'agent':
      return 'Agent Dashboard';
    case 'passenger':
      return 'Passenger Dashboard';
    default:
      return 'Dashboard';
  }
};

export default function DashboardPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { userData, loading: dataLoading, error: dataError } = useUserData();
  const {
    requests: quoteRequests,
    loading: requestsLoading,
    indexError,
    refreshRequests,
    indexUrl,
    useFallback,
  } = useOperatorQuoteRequests(userData?.userCode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flights, setFlights] = useState<CalendarFlight[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);

  const pendingRequests = quoteRequests?.filter((req) => req.status === 'pending') || [];

  // Load calendar flights
  useEffect(() => {
    if (userRole) {
      setCalendarLoading(true);
      // Generate mock flights
      const mockFlights = generateMockFlights(userRole, 30, 15);
      setFlights(mockFlights);
      setCalendarLoading(false);
    }
  }, [userRole]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshRequests();

    // Regenerate mock flights for the calendar
    if (userRole) {
      const mockFlights = generateMockFlights(userRole, 30, 15);
      setFlights(mockFlights);
    }

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleForceReload = () => {
    // Force a full page reload to clear any caching
    window.location.reload();
  };

  if (authLoading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6">Please sign in to access the dashboard.</Typography>
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  const quickActions = getQuickActions(userData.role);
  const dashboardTitle = getDashboardTitle(userData.role);
  const greeting = userData.company
    ? `Welcome back to ${userData.company}, ${userData.firstName}!`
    : `Welcome back, ${userData.firstName}!`;

  // Render different dashboard based on user role
  const renderPassengerDashboard = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert
            severity="info"
            sx={{
              mb: 2,
              '& .MuiAlert-icon': { alignItems: 'center' },
            }}
            action={
              <Button
                component={Link}
                href="/dashboard/quotes/request"
                variant="contained"
                size="small"
                color="primary"
              >
                Request Quote
              </Button>
            }
          >
            <Typography variant="body1">Looking for a private jet? Request a quote now!</Typography>
          </Alert>
        </Grid>

        <Grid item xs={12} md={8}>
          <UpcomingFlights userCode={userData.userCode} />
        </Grid>

        <Grid item xs={12} md={4}>
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
            <DashboardCalendar flights={flights} userRole={userRole} title="Flight Calendar" />
          )}
        </Grid>

        <Grid item xs={12}>
          <PassengerQuickActions />
        </Grid>
      </Grid>
    );
  };

  const renderAgentDashboard = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert
            severity="info"
            sx={{
              mb: 2,
              '& .MuiAlert-icon': { alignItems: 'center' },
            }}
            action={
              <Button
                component={Link}
                href="/dashboard/quotes/request"
                variant="contained"
                size="small"
                color="primary"
              >
                New Booking
              </Button>
            }
          >
            <Typography variant="body1">Create a new booking request for your clients!</Typography>
          </Alert>
        </Grid>

        <Grid item xs={12} md={8}>
          <UpcomingFlights userCode={userData.userCode} />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Client Management
            </Typography>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Button
                component={Link}
                href="/dashboard/clients"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
              >
                View Clients
              </Button>
              <Button component={Link} href="/dashboard/clients/add" variant="outlined" fullWidth>
                Add New Client
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <PassengerQuickActions />
        </Grid>
      </Grid>
    );
  };

  const renderOperatorDashboard = () => {
    return (
      <Grid container spacing={3}>
        {indexError && (
          <Grid item xs={12}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleForceReload}>
                  Reload
                </Button>
              }
            >
              {indexError}
              {useFallback && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Using fallback data.{' '}
                  <Link href={indexUrl || '#'} target="_blank" rel="noopener">
                    Check Algolia index
                  </Link>
                </Typography>
              )}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" fontWeight="medium">
                {pendingRequests.length > 0 ? (
                  <>Pending Quote Requests ({pendingRequests.length})</>
                ) : (
                  <>No Pending Quote Requests</>
                )}
              </Typography>

              <Tooltip title="Refresh data">
                <IconButton onClick={handleRefresh} disabled={isRefreshing || requestsLoading}>
                  <RefreshIcon
                    sx={{
                      animation:
                        isRefreshing || requestsLoading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {requestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingRequests.length > 0 ? (
              <Grid container spacing={2}>
                {pendingRequests.map((request) => (
                  <Grid component="div" item xs={12} sm={6} md={4} key={request.id}>
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 6 },
                        border: '1px solid',
                        borderColor: 'warning.light',
                        position: 'relative',
                        overflow: 'visible',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'warning.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 2,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {request.requestCode}
                          </Typography>
                          <Chip label="Pending" size="small" color="warning" sx={{ height: 24 }} />
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Route:</strong> {request.routing.departureAirport} →{' '}
                          {request.routing.arrivalAirport}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Date:</strong>{' '}
                          {format(request.routing.departureDate.toDate(), 'dd MMM yyyy')}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Passengers:</strong> {request.passengerCount}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          component={Link}
                          href={`/dashboard/quotes/incoming/${request.id}`}
                          variant="contained"
                          color="primary"
                          fullWidth
                          endIcon={<NotificationsActiveIcon />}
                        >
                          Respond to Request
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" paragraph>
                  There are no pending quote requests at the moment.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back later for new requests.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
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
            <DashboardCalendar flights={flights} userRole={userRole} title="Flight Schedule" />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              {quickActions.map((action) => (
                <Grid component="div" item xs={12} md={6} lg={4} key={action.name}>
                  <Card
                    sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            width: (theme) => theme.spacing(6),
                            height: (theme) => theme.spacing(6),
                          }}
                        >
                          <action.icon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {action.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {action.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button component={Link} href={action.href} variant="outlined" fullWidth>
                        Get Started
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      {!user.emailVerified && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please verify your email address. We've sent a link to {user.email}.
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          {dashboardTitle}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {greeting}
        </Typography>
      </Box>

      {/* Render specific dashboard based on user role */}
      {userData.role === 'passenger' && renderPassengerDashboard()}
      {userData.role === 'agent' && renderAgentDashboard()}
      {userData.role === 'operator' && renderOperatorDashboard()}
      {(userData.role === 'admin' || userData.role === 'superAdmin') && renderOperatorDashboard()}
    </>
  );
}
