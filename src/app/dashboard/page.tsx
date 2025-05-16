'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useUserData } from '@/hooks/useUserData';
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
  Stack
} from '@mui/material';
import {
  People as UsersIcon,
  Flight as PlaneIcon,
  BusinessCenter as BuildingIcon,
  CalendarMonth as CalendarDaysIcon,
  Settings as SettingsIcon,
  PersonAdd as UserPlusIcon,
  FlightTakeoff as PlaneTakeoffIcon,
} from '@mui/icons-material';
import Link from 'next/link';

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

      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" fontWeight="medium" sx={{ mb: 3 }} color="primary.dark">
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action) => (
            <Grid item xs={12} md={6} lg={4} key={action.name}>
              <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { boxShadow: 6 } }}>
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
      </Box>
    </>
  );
} 