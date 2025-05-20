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
  Divider,
  Alert,
  Chip,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Flight as FlightIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  Message as MessageIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  CalendarMonth as CalendarIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { format, addDays, isBefore } from 'date-fns';
import FlightOverview from '@/components/admin/FlightOverview';
import { Panel, PanelGroup } from '@/components/admin/Panel';
import SalesKPI from '@/components/admin/SalesKPI';
import DashboardCalendar from '@/components/calendar/DashboardCalendar';
import { generateMockFlights } from '@/lib/mockFlightData';
import { CalendarFlight } from '@/components/calendar/FlightCalendar';

// Mock data for upcoming flights
const mockUpcomingFlights = [
  {
    id: 'flight1',
    flightCode: 'FLT-OP-JETS-20230601-1234',
    route: 'FAJS → FACT',
    date: addDays(new Date(), 1),
    operator: 'Luxury Jets',
    passengerCount: 6,
    status: 'confirmed',
    hasAlerts: false,
  },
  {
    id: 'flight2',
    flightCode: 'FLT-OP-AIRS-20230603-5678',
    route: 'FACT → FALE',
    date: addDays(new Date(), 3),
    operator: 'AirStar Executive',
    passengerCount: 4,
    status: 'pending',
    hasAlerts: true,
    alertType: 'payment',
  },
  {
    id: 'flight3',
    flightCode: 'FLT-OP-ELIT-20230605-9012',
    route: 'FALE → FAJS',
    date: addDays(new Date(), 5),
    operator: 'Elite Air',
    passengerCount: 8,
    status: 'confirmed',
    hasAlerts: true,
    alertType: 'documents',
  },
];

// Mock data for operator paperwork deadlines
const mockOperatorPaperwork = [
  {
    id: 'op1',
    operator: 'Luxury Jets',
    operatorCode: 'OP-JETS-ABCD',
    documentType: 'Air Operator Certificate',
    expiryDate: addDays(new Date(), 30),
    status: 'valid',
    reminderSent: true,
  },
  {
    id: 'op2',
    operator: 'AirStar Executive',
    operatorCode: 'OP-AIRS-EFGH',
    documentType: 'Insurance Certificate',
    expiryDate: addDays(new Date(), 15),
    status: 'expiring',
    reminderSent: true,
  },
  {
    id: 'op3',
    operator: 'Elite Air',
    operatorCode: 'OP-ELIT-IJKL',
    documentType: 'Safety Management System',
    expiryDate: addDays(new Date(), 7),
    status: 'urgent',
    reminderSent: false,
  },
];

// Mock data for recent activity
const mockRecentActivity = [
  {
    id: 'act1',
    activityType: 'flight_booked',
    flightCode: 'FLT-OP-JETS-20230601-1234',
    user: 'John Smith',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: 'Flight booked from FAJS to FACT',
  },
  {
    id: 'act2',
    activityType: 'payment_verified',
    flightCode: 'FLT-OP-AIRS-20230528-5678',
    user: 'Admin',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    details: 'Payment of R75,000 verified',
  },
  {
    id: 'act3',
    activityType: 'operator_approved',
    operatorCode: 'OP-ELIT-IJKL',
    user: 'Admin',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    details: 'New operator "Elite Air" approved',
  },
  {
    id: 'act4',
    activityType: 'document_expired',
    operatorCode: 'OP-SKYH-MNOP',
    user: 'System',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    details: 'Air Operator Certificate expired for Sky High Jets',
  },
];

export default function AdminDashboardPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flights, setFlights] = useState<CalendarFlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load calendar flights
  useEffect(() => {
    if (userRole) {
      setIsLoading(true);
      // Generate mock flights
      const mockFlights = generateMockFlights(userRole, 30, 15);
      setFlights(mockFlights);
      setIsLoading(false);
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
      // Regenerate mock flights for the calendar
      if (userRole) {
        const mockFlights = generateMockFlights(userRole, 30, 15);
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

  if (!user || (userRole !== 'admin' && userRole !== 'superAdmin')) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        You are not authorized to access this page. This page is only for administrators.
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage flights, operators, and system operations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Flight overview section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h5" fontWeight="bold">
                Flight Overview
              </Typography>
              <Tooltip title="Refresh flight data">
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

            <FlightOverview />
          </Paper>
        </Grid>

        {/* Sales KPI Section - only visible to superAdmin */}
        {userRole === 'superAdmin' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <SalesKPI />
            </Paper>
          </Grid>
        )}

        {/* Flight Calendar - Add new component */}
        <Grid item xs={12} md={4}>
          {isLoading ? (
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

        {/* Upcoming flights and alerts - Update to md={8} */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="h6" fontWeight="medium">
                <Badge
                  badgeContent={mockUpcomingFlights.filter((f) => f.hasAlerts).length}
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: 14, height: 22, minWidth: 22 } }}
                >
                  <Box component="span" sx={{ mr: 1 }}>
                    Upcoming Flights & Alerts
                  </Box>
                </Badge>
              </Typography>
              <Box>
                <Tooltip title="Calendar View">
                  <IconButton
                    color="inherit"
                    size="small"
                    sx={{ mr: 1 }}
                    component={Link}
                    href="/admin/calendar"
                  >
                    <CalendarIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton color="inherit" size="small">
                    <TimelineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Divider />

            <List disablePadding>
              {mockUpcomingFlights.map((flight) => (
                <React.Fragment key={flight.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'action.hover' },
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/admin/flights/${flight.id}`)}
                    secondaryAction={
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        component={Link}
                        href={`/admin/flights/${flight.id}`}
                      >
                        Manage
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor:
                            flight.status === 'confirmed' ? 'success.light' : 'warning.light',
                        }}
                      >
                        <FlightIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {flight.route}
                          </Typography>
                          {flight.hasAlerts && (
                            <Tooltip
                              title={`${flight.alertType === 'payment' ? 'Payment pending' : 'Documents incomplete'}`}
                            >
                              <Chip
                                size="small"
                                icon={<WarningIcon fontSize="small" />}
                                label={flight.alertType === 'payment' ? 'Payment' : 'Docs'}
                                color="error"
                                sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span">
                            {format(flight.date, 'dd MMM yyyy')} | {flight.passengerCount}{' '}
                            passengers | {flight.operator}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            {flight.flightCode}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {mockUpcomingFlights.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No upcoming flights</Typography>
                </Box>
              )}
            </List>

            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
              <Button
                component={Link}
                href="/admin/flights"
                variant="outlined"
                fullWidth
                startIcon={<FlightIcon />}
              >
                View All Flights
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Operator paperwork alerts - Move below and make full width */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'warning.main', color: 'warning.contrastText' }}>
              <Typography variant="h6" fontWeight="medium">
                Operator Paperwork Alerts
              </Typography>
            </Box>

            <Divider />

            <List disablePadding sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {mockOperatorPaperwork.map((paperwork) => (
                <React.Fragment key={paperwork.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor:
                            paperwork.status === 'urgent'
                              ? 'error.light'
                              : paperwork.status === 'expiring'
                                ? 'warning.light'
                                : 'success.light',
                        }}
                      >
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {paperwork.documentType}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              paperwork.status === 'urgent'
                                ? 'Urgent'
                                : paperwork.status === 'expiring'
                                  ? 'Expiring Soon'
                                  : 'Valid'
                            }
                            color={
                              paperwork.status === 'urgent'
                                ? 'error'
                                : paperwork.status === 'expiring'
                                  ? 'warning'
                                  : 'success'
                            }
                            sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {paperwork.operator}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Expires: {format(paperwork.expiryDate, 'dd MMM yyyy')}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={paperwork.reminderSent ? 'success.main' : 'text.secondary'}
                            display="block"
                          >
                            {paperwork.reminderSent ? 'Reminder sent' : 'No reminder sent yet'}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {mockOperatorPaperwork.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No paperwork alerts</Typography>
                </Box>
              )}
            </List>

            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
              <Button
                component={Link}
                href="/admin/operators"
                variant="outlined"
                fullWidth
                color="warning"
                startIcon={<BusinessIcon />}
              >
                Manage Operators
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent activity */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              variant="h6"
              fontWeight="medium"
              gutterBottom
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              Recent Activity
              <Tooltip title="View full activity log">
                <IconButton size="small" component={Link} href="/admin/activity">
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {mockRecentActivity.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor:
                          activity.activityType === 'flight_booked'
                            ? 'primary.light'
                            : activity.activityType === 'payment_verified'
                              ? 'success.light'
                              : activity.activityType === 'operator_approved'
                                ? 'info.light'
                                : 'error.light',
                      }}
                    >
                      {activity.activityType === 'flight_booked' ? (
                        <FlightIcon fontSize="small" />
                      ) : activity.activityType === 'payment_verified' ? (
                        <MoneyIcon fontSize="small" />
                      ) : activity.activityType === 'operator_approved' ? (
                        <BusinessIcon fontSize="small" />
                      ) : (
                        <WarningIcon fontSize="small" />
                      )}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.details}
                    secondary={
                      <>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {format(activity.timestamp, 'dd MMM yyyy HH:mm')} by {activity.user}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontFamily="monospace"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          {activity.flightCode || activity.operatorCode || ''}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Quick Actions
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {[
                {
                  title: 'Operator Management',
                  icon: <BusinessIcon sx={{ color: 'primary.main' }} />,
                  href: '/admin/operators',
                  description: 'Approve, suspend, or manage operators',
                },
                {
                  title: 'Flight Calendar',
                  icon: <CalendarIcon sx={{ color: 'success.main' }} />,
                  href: '/admin/calendar',
                  description: 'View and manage flight schedule',
                },
                {
                  title: 'User Management',
                  icon: <PeopleIcon sx={{ color: 'info.main' }} />,
                  href: '/admin/users',
                  description: 'Manage passengers, agents and operators',
                },
                {
                  title: 'Payments',
                  icon: <MoneyIcon sx={{ color: 'warning.main' }} />,
                  href: '/admin/payments',
                  description: 'Verify payments and manage invoices',
                },
                {
                  title: 'System Messages',
                  icon: <MessageIcon sx={{ color: 'secondary.main' }} />,
                  href: '/admin/messages',
                  description: 'Communicate with users and operators',
                },
                {
                  title: 'Reports & KPIs',
                  icon: <AssignmentIcon sx={{ color: 'error.main' }} />,
                  href: '/admin/reports',
                  description: 'View system analytics and reports',
                },
              ].map((action, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={action.icon}
                    component={Link}
                    href={action.href}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      px: 2,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
