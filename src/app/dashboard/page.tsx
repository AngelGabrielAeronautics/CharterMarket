'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useOperatorQuoteRequests, useClientQuoteRequests } from '@/hooks/useFlights';
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
  Tabs,
  Tab,
  Container,
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
  Assignment as AssignmentIcon,
  Business as BusinessAdminIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useEffect, ReactNode } from 'react';
import UpcomingFlights from '@/components/dashboard/UpcomingFlights';
import PassengerQuickActions from '@/components/dashboard/PassengerQuickActions';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import { Button } from '@/components/ui/Button';
import BookingForm from '@/components/BookingForm';
import DashboardCalendar from '@/components/calendar/DashboardCalendar';
import { generateMockFlights } from '@/lib/mockFlightData';
import { CalendarFlight } from '@/components/calendar/FlightCalendar';

// Admin specific components (assuming they are in these paths)
import FlightOverview from '@/components/admin/FlightOverview';
import SalesKPI from '@/components/admin/SalesKPI';
// Panel can be replaced with Paper or Box for now if not crucial
// import { Panel } from '@/components/admin/Panel';

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
    href: '/dashboard/users',
    icon: UsersIcon,
  },
  {
    name: 'Manage Aircraft',
    description: 'View and manage operator aircraft',
    href: '/dashboard/aircraft',
    icon: PlaneIcon,
  },
  {
    name: 'System Settings',
    description: 'Configure system-wide settings',
    href: '/dashboard/settings',
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-dashboard-tabpanel-${index}`}
      aria-labelledby={`admin-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-dashboard-tab-${index}`,
    'aria-controls': `admin-dashboard-tabpanel-${index}`,
  };
}

// Convert renderAdminSpecificContent to a proper React component
interface AdminSpecificContentProps {
  userData: any; // Consider defining a more specific type for userData
}

const AdminSpecificContent: React.FC<AdminSpecificContentProps> = ({ userData }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, borderRadius: 1 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="Admin dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="User Management" {...a11yProps(1)} />
          <Tab label="Operator Management" {...a11yProps(2)} />
          <Tab label="Flight Operations" {...a11yProps(3)} />
          <Tab label="Financials" {...a11yProps(4)} />
          <Tab label="System Health" {...a11yProps(5)} />
          <Tab label="Reports" {...a11yProps(6)} />
        </Tabs>
      </Paper>
      <TabPanel value={currentTab} index={0}>
        <div className="flex flex-wrap -mx-3">
          <div className="w-full px-3 mb-4">
            <Typography variant="h5" gutterBottom>
              Key Metrics Overview
            </Typography>
          </div>
          <div className="w-full px-3 mb-4">
            <FlightOverview />
          </div>
          <div className="w-full px-3 mb-4">
            <SalesKPI />
          </div>
        </div>
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <Typography variant="h6">User Management</Typography>
        <Typography paragraph>
          Manage users, roles, and permissions. View user activity and profiles.
        </Typography>
        <Button
          component={Link}
          href="/dashboard/users"
          variant="contained"
          startIcon={<UsersIcon />}
        >
          Go to User Management
        </Button>
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        <Typography variant="h6">Operator Management</Typography>
        <Typography paragraph>
          Oversee operator accounts, aircraft, compliance, and performance.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            href="/dashboard/aircraft"
            variant="contained"
            startIcon={<PlaneIcon />}
          >
            Manage Aircraft
          </Button>
        </Stack>
      </TabPanel>
      <TabPanel value={currentTab} index={3}>
        <Typography variant="h6">Flight Operations</Typography>
        <Typography paragraph>
          Monitor all ongoing and upcoming flights. Manage bookings, manifests, and schedules.
        </Typography>
        <Button
          component={Link}
          href="/dashboard/bookings"
          variant="contained"
          startIcon={<ListAltIcon />}
        >
          View All Bookings
        </Button>
      </TabPanel>
      <TabPanel value={currentTab} index={4}>
        <Typography variant="h6">Financials</Typography>
        <Typography paragraph>
          Track payments, invoices, commissions, and overall financial performance.
        </Typography>
        <Button
          component={Link}
          href="/admin/payments"
          variant="contained"
          startIcon={<AssignmentIcon />}
        >
          Manage Payments
        </Button>
      </TabPanel>
      <TabPanel value={currentTab} index={5}>
        <Typography variant="h6">System Health</Typography>
        <Typography paragraph>
          Monitor system performance, error logs, and security alerts.
        </Typography>
      </TabPanel>
      <TabPanel value={currentTab} index={6}>
        <Typography variant="h6">Reports</Typography>
        <Typography paragraph>
          Generate and view various reports on sales, user activity, flight operations, etc.
        </Typography>
      </TabPanel>
    </Box>
  );
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
  const {
    requests: clientQuoteRequests,
    loading: clientRequestsLoading,
    error: clientRequestsError,
  } = useClientQuoteRequests(userData?.userCode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flights, setFlights] = useState<CalendarFlight[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const pendingRequests = quoteRequests?.filter((req) => req.status === 'pending') || [];

  // Load calendar flights
  useEffect(() => {
    if (userRole) {
      setCalendarLoading(true);
      // Generate mock flights for now, for all roles including admin for calendar consistency
      const mockFlights = generateMockFlights(userRole, 30, 15);
      setFlights(mockFlights);
      setCalendarLoading(false);
    }
  }, [userRole]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (userRole === 'operator') {
      refreshRequests();
    }

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 5 }}>
        <CircularProgress />
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
    // This case might be hit if useUserData hook is still loading or failed post-auth.
    // It's good to have a fallback or a more specific error message if dataError is present.
    if (dataError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 3,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load user data:{' '}
            {typeof dataError === 'string'
              ? dataError
              : (dataError as Error)?.message || 'Unknown error'}
          </Alert>
          <Typography variant="body1">
            Please try refreshing the page. If the problem persists, contact support.
          </Typography>
          <Button onClick={() => window.location.reload()} variant="outlined" sx={{ mt: 2 }}>
            Refresh
          </Button>
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
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
      <Grid container component="div" spacing={3}>
        {/* Welcome banner */}
        <Grid component="div" size={12}>
          <Alert 
            severity="info" 
            icon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>ℹ️</Box>}
            sx={{ borderRadius: 1, mb: 3 }}
          >
            Welcome back, {userData?.firstName || 'Traveler'}! Here's your flight overview.
          </Alert>
        </Grid>

        {/* Flights section */}
        <Grid component="div" size={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              borderRadius: 1, 
              mb: 3,
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0'
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                My Flights
              </Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={0}>
                  <Tab label="Upcoming (0)" />
                  <Tab label="Past (1)" />
                </Tabs>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 6
            }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                You don't have any upcoming flights
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ 
                  backgroundColor: '#607d8b',
                  '&:hover': {
                    backgroundColor: '#4b636e'
                  }
                }}
              >
                Book a Flight
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quote requests section */}
        <Grid component="div" size={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              borderRadius: 1,
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              My Quote Requests
            </Typography>

            {clientRequestsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : clientRequestsError ? (
              <Alert severity="error">{clientRequestsError}</Alert>
            ) : clientQuoteRequests.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No quote requests found
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {clientQuoteRequests.map((req) => (
                  <Card 
                    key={req.id} 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer', 
                      borderRadius: 1,
                      backgroundColor: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Request #{req.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {req.status}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        component={Link}
                        href={`/dashboard/quotes/${req.id}`}
                        size="small"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderAgentDashboard = () => {
    return (
      <div className="flex flex-wrap -mx-3">
        <div className="w-full px-3 mb-4">
          <Typography variant="h5" gutterBottom>
            Agent Dashboard
          </Typography>
        </div>
        <div className="w-full px-3 mb-4">
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
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
        </div>

        <div className="w-full md:w-2/3 px-3 mb-4">
          <Paper elevation={1} sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Client Requests
            </Typography>
            {clientRequestsLoading ? (
              <CircularProgress size={24} />
            ) : clientRequestsError ? (
              <Alert severity="error">{clientRequestsError}</Alert>
            ) : clientQuoteRequests.length === 0 ? (
              <Typography>No quote requests found.</Typography>
            ) : (
              <Stack spacing={2}>
                {clientQuoteRequests.map((req) => (
                  <Card key={req.id} elevation={0} variant="outlined" sx={{ borderRadius: 1 }}>
                    <CardContent>
                      <Typography variant="subtitle1">Request #{req.id}</Typography>
                      <Typography variant="body2">Status: {req.status}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button component={Link} href={`/dashboard/quotes/${req.id}`}>
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            )}
            <Box sx={{ mt: 2 }}>
              <Button component={Link} href="/dashboard/quotes" variant="outlined">
                View All Quote Requests
              </Button>
            </Box>
          </Paper>
        </div>

        <div className="w-full md:w-1/3 px-3 mb-4">
          <PassengerQuickActions />
        </div>
      </div>
    );
  };

  const renderOperatorDashboard = () => {
    return (
      <div className="flex flex-wrap -mx-3">
        <div className="w-full px-3 mb-4">
          <Typography variant="h5" gutterBottom>
            Operator Dashboard
          </Typography>
        </div>

        <div className="w-full px-3 mb-4">
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
                href="/dashboard/quotes/incoming"
                variant="contained"
                size="small"
                color="primary"
              >
                View Quote Requests
              </Button>
            }
          >
            <Typography variant="body1">
              You have new quote requests waiting for your response.
            </Typography>
          </Alert>
        </div>

        <div className="w-full md:w-1/2 px-3 mb-4">
          <Paper elevation={1} sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Upcoming Flights
            </Typography>
            {/* Operator upcoming flights */}
          </Paper>
        </div>

        <div className="w-full md:w-1/2 px-3 mb-4">
          <Paper elevation={1} sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Fleet Status
            </Typography>
            {/* Fleet status content */}
          </Paper>
        </div>
      </div>
    );
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#f5f7fa' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {dashboardTitle}
        </Typography>
        {userData && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Welcome back, {userData.firstName} {userData.lastName}!
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Refresh Data
        </Button>
      </Box>

      {indexError && (
        <Alert
          severity="warning"
          action={
            indexUrl ? (
              <Link href={indexUrl} target="_blank" rel="noopener noreferrer" passHref>
                <Button component="a" color="inherit" size="small" startIcon={<OpenInNewIcon />}>
                  Create Index
                </Button>
              </Link>
            ) : null
          }
          sx={{ mb: 3, borderRadius: 1 }}
        >
          {indexError}
          {useFallback && ' Displaying fallback data for quote requests.'}
        </Alert>
      )}

      {/* Render Quick Actions if they exist for the role and it's not admin/superAdmin (as they have tabs) */}
      {quickActions.length > 0 && userData.role !== 'admin' && userData.role !== 'superAdmin' && (
        <Box sx={{ mb: 4 }}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              borderRadius: 1, 
              height: '100%',
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Quick Actions
            </Typography>
            <div className="flex flex-wrap -mx-2">
              {quickActions.map((action) => (
                <div className="w-full sm:w-1/2 md:w-1/3 px-2 mb-4" key={action.name}>
                  <Card
                    component={Paper}
                    elevation={1}
                    sx={{ 
                      height: '100%', 
                      transition: 'all 0.3s', 
                      '&:hover': { boxShadow: 6 }, 
                      borderRadius: 1,
                      backgroundColor: '#ffffff'
                    }}
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
                      <Button href={action.href} variant="outlined" fullWidth>
                        Get Started
                      </Button>
                    </CardActions>
                  </Card>
                </div>
              ))}
            </div>
          </Paper>
        </Box>
      )}

      {/* Role-specific content */}
      {userData.role === 'admin' || userData.role === 'superAdmin' ? (
        <AdminSpecificContent userData={userData} />
      ) : userData.role === 'passenger' ? (
        renderPassengerDashboard()
      ) : userData.role === 'agent' ? (
        renderAgentDashboard()
      ) : userData.role === 'operator' ? (
        renderOperatorDashboard()
      ) : (
        <Alert severity="info">Dashboard content for your role is under construction.</Alert>
      )}

      {/* Common sections like Calendar - could be conditional too */}
      {(userData.role === 'passenger' ||
        userData.role === 'agent' ||
        userData.role === 'operator') &&
        !calendarLoading &&
        flights.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              My Flight Calendar
            </Typography>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                borderRadius: 1,
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ height: calendarExpanded ? 'auto' : 200, overflow: 'hidden' }}>
                <DashboardCalendar flights={flights} userRole={userRole!} />
              </Box>
              <Button
                variant="text"
                size="small"
                onClick={() => setCalendarExpanded((prev) => !prev)}
                sx={{ mt: 1 }}
              >
                {calendarExpanded ? 'Show Condensed Calendar' : 'Show Full Calendar'}
              </Button>
            </Paper>
          </Box>
        )}
      {calendarLoading &&
        (userData.role === 'passenger' ||
          userData.role === 'agent' ||
          userData.role === 'operator') && <CircularProgress sx={{ mt: 2 }} />}

      {/* Example of WeatherWidget for passengers/agents, can be expanded */}
      {(userData.role === 'passenger' || userData.role === 'agent') && (
        <Box sx={{ mt: 4 }}>
          <WeatherWidget departureAirport="" arrivalAirport="" />
        </Box>
      )}
    </Box>
  );
}
