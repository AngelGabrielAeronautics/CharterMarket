import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: any; // Can be Timestamp or Date
  [key: string]: any;
}

interface UserStats {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byRole: {
    passenger: number;
    operator: number;
    agent: number;
    admin: number;
  };
  byStatus: {
    active: number;
    incomplete: number;
    dormant: number;
  };
  previousMonth: number;
  monthlyGrowth: number;
}

const defaultStats: UserStats = {
  totalUsers: 0,
  newToday: 0,
  newThisWeek: 0,
  newThisMonth: 0,
  byRole: {
    passenger: 0,
    operator: 0,
    agent: 0,
    admin: 0,
  },
  byStatus: {
    active: 0,
    incomplete: 0,
    dormant: 0,
  },
  previousMonth: 0,
  monthlyGrowth: 0,
};

export default function UserKPIs() {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUserStats = async () => {
    try {
      console.log('🔍 Fetching user statistics...');
      
      // Get all users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const users: UserData[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserData));

      console.log(`📊 Found ${users.length} total users`);

      const now = new Date();
      const todayStart = startOfDay(now);
      const thisWeekStart = startOfWeek(now);
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = startOfMonth(now);

      // Calculate metrics
      const totalUsers = users.length;
      
      const newToday = users.filter(user => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= todayStart;
      }).length;

      const newThisWeek = users.filter(user => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= thisWeekStart;
      }).length;

      const newThisMonth = users.filter(user => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= thisMonthStart;
      }).length;

      const previousMonth = users.filter(user => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return createdAt >= lastMonthStart && createdAt < lastMonthEnd;
      }).length;

      const monthlyGrowth = previousMonth > 0 ? ((newThisMonth - previousMonth) / previousMonth) * 100 : 100;

      // Count by role
      const byRole = {
        passenger: users.filter(user => user.role === 'passenger').length,
        operator: users.filter(user => user.role === 'operator').length,
        agent: users.filter(user => user.role === 'agent').length,
        admin: users.filter(user => user.role === 'admin' || user.role === 'superAdmin').length,
      };

      // Count by status
      const byStatus = {
        active: users.filter(user => user.status === 'active').length,
        incomplete: users.filter(user => user.status === 'incomplete').length,
        dormant: users.filter(user => user.status === 'dormant').length,
      };

      const newStats: UserStats = {
        totalUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        byRole,
        byStatus,
        previousMonth,
        monthlyGrowth,
      };

      console.log('📊 User statistics:', newStats);
      setStats(newStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load user statistics');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      await fetchUserStats();
      setLoading(false);
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          User Registration Analytics
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

      <Grid container spacing={3}>
        {/* Main Stats Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  mr: 1,
                }}
              >
                <PersonIcon />
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {stats.totalUsers}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'success.light',
                  color: 'success.main',
                  mr: 1,
                }}
              >
                <PersonAddIcon />
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.newToday}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              New Today
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.newThisWeek}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              New This Week
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="secondary.main">
                {stats.newThisMonth}
              </Typography>
              <Chip
                icon={
                  stats.monthlyGrowth >= 0 ? (
                    <TrendingUpIcon fontSize="small" />
                  ) : (
                    <TrendingDownIcon fontSize="small" />
                  )
                }
                label={`${stats.monthlyGrowth.toFixed(1)}%`}
                color={stats.monthlyGrowth >= 0 ? 'success' : 'error'}
                size="small"
                sx={{ ml: 1, height: 20 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              New This Month
            </Typography>
          </Paper>
        </Grid>

        {/* Role Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Users by Role
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {stats.byRole.passenger}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Passengers
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FlightIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {stats.byRole.operator}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Operators
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {stats.byRole.agent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Agents
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonAddIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {stats.byRole.admin}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admins
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Status Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Users by Status
            </Typography>
            <Grid container spacing={2}>
              <Grid size={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {stats.byStatus.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {stats.byStatus.incomplete}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incomplete
                  </Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {stats.byStatus.dormant}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dormant
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Previous month: {stats.previousMonth} new users
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 