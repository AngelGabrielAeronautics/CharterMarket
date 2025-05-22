import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  Flight as FlightIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { format, subDays, subMonths } from 'date-fns';

// Mock data for sales metrics
const mockSalesData = {
  totalRevenue: 1250000,
  revenueGrowth: 18.5,
  monthlyRevenue: 245000,
  monthlyGrowth: 12.3,
  commissionEarned: 37500,
  commissionGrowth: 15.7,
  bookingsCount: 32,
  bookingsGrowth: 8.4,
  newCustomers: 14,
  newCustomersGrowth: 10.2,
  operatorPayments: 220000,
  outstandingPayments: 25000,
  averageBookingValue: 39062.5,
  conversionRate: 64,
};

// Mock data for monthly revenue
const mockMonthlyData = [
  { month: 'Jan', value: 105000 },
  { month: 'Feb', value: 125000 },
  { month: 'Mar', value: 142000 },
  { month: 'Apr', value: 132000 },
  { month: 'May', value: 158000 },
  { month: 'Jun', value: 178000 },
  { month: 'Jul', value: 165000 },
  { month: 'Aug', value: 182000 },
  { month: 'Sep', value: 195000 },
  { month: 'Oct', value: 215000 },
  { month: 'Nov', value: 230000 },
  { month: 'Dec', value: 245000 },
];

const SimpleBarChart = () => {
  const maxValue = Math.max(...mockMonthlyData.map((item) => item.value));

  return (
    <Box sx={{ mt: 1, height: 120 }}>
      <Box sx={{ display: 'flex', height: '100%', alignItems: 'flex-end' }}>
        {mockMonthlyData.map((item, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              mx: 0.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: 'primary.main',
                height: `${(item.value / maxValue) * 100}%`,
                borderRadius: '4px 4px 0 0',
                minHeight: 4,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {item.month}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default function SalesKPI() {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTimeRangeChange = (
    event: React.SyntheticEvent,
    newValue: 'weekly' | 'monthly' | 'yearly'
  ) => {
    setTimeRange(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Sales Performance
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tabs
            value={timeRange}
            onChange={handleTimeRangeChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ mr: 2 }}
          >
            <Tab value="weekly" label="Weekly" />
            <Tab value="monthly" label="Monthly" />
            <Tab value="yearly" label="Yearly" />
          </Tabs>
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
      </Box>
      {/* Main KPI Cards */}
      <Grid container spacing={3}>
        {/* Revenue Summary */}
        <Grid
          size={{
            xs: 12,
            md: 8
          }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6" fontWeight="medium">
                Revenue Summary
              </Typography>
              <Tooltip title="View detailed report">
                <IconButton size="small">
                  <ShowChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue (Year to Date)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                      R{mockSalesData.totalRevenue.toLocaleString()}
                    </Typography>
                    <Chip
                      icon={
                        mockSalesData.revenueGrowth >= 0 ? (
                          <TrendingUpIcon fontSize="small" />
                        ) : (
                          <TrendingDownIcon fontSize="small" />
                        )
                      }
                      label={`${mockSalesData.revenueGrowth}%`}
                      color={mockSalesData.revenueGrowth >= 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ ml: 2, height: 20 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Commission Earned (3%)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: 'success.main' }}>
                      R{mockSalesData.commissionEarned.toLocaleString()}
                    </Typography>
                    <Chip
                      icon={
                        mockSalesData.commissionGrowth >= 0 ? (
                          <TrendingUpIcon fontSize="small" />
                        ) : (
                          <TrendingDownIcon fontSize="small" />
                        )
                      }
                      label={`${mockSalesData.commissionGrowth}%`}
                      color={mockSalesData.commissionGrowth >= 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ ml: 2, height: 20 }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Monthly Revenue Trend
                  </Typography>
                  <SimpleBarChart />
                  <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {timeRange === 'monthly'
                        ? 'Current Month'
                        : timeRange === 'weekly'
                          ? 'Current Week'
                          : 'Current Year'}
                      :&nbsp;
                      <span style={{ color: '#1976d2' }}>
                        R{mockSalesData.monthlyRevenue.toLocaleString()}
                      </span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mockSalesData.monthlyGrowth >= 0 ? '+' : ''}
                      {mockSalesData.monthlyGrowth}% vs previous{' '}
                      {timeRange === 'monthly' ? 'month' : timeRange === 'weekly' ? 'week' : 'year'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Key Metrics */}
        <Grid
          size={{
            xs: 12,
            md: 4
          }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Key Metrics
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Bookings
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                      <Typography variant="h6" fontWeight="bold">
                        {mockSalesData.bookingsCount}
                      </Typography>
                      <Chip
                        label={`${mockSalesData.bookingsGrowth}%`}
                        color={mockSalesData.bookingsGrowth >= 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      New Customers
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                      <Typography variant="h6" fontWeight="bold">
                        {mockSalesData.newCustomers}
                      </Typography>
                      <Chip
                        label={`${mockSalesData.newCustomersGrowth}%`}
                        color={mockSalesData.newCustomersGrowth >= 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Booking Value
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      R{mockSalesData.averageBookingValue.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Conversion Rate
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {mockSalesData.conversionRate}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Operator Payments
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Paid to Operators</Typography>
                <Typography variant="body2" fontWeight="medium">
                  R{mockSalesData.operatorPayments.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Outstanding</Typography>
                <Typography variant="body2" fontWeight="medium" color="warning.main">
                  R{mockSalesData.outstandingPayments.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<BarChartIcon />}
                  href="/admin/reports/sales"
                >
                  Detailed Reports
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
