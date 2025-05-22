import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Flight as FlightIcon,
  FlightTakeoff as FlightTakeoffIcon,
  FlightLand as FlightLandIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { format, addDays } from 'date-fns';

// Mock data
const flightStats = {
  today: 5,
  upcoming: 23,
  completed: 128,
  cancelled: 3,
  pending: 8,
  total: 167,
  alerts: 4,
};

const recentBookings = [
  { route: 'FAJS → FACT', date: addDays(new Date(), 2), status: 'confirmed' },
  { route: 'FACT → FALE', date: addDays(new Date(), 5), status: 'pending' },
  { route: 'FALE → FBSK', date: addDays(new Date(), 7), status: 'confirmed' },
];

const FlightStatCard = ({
  title,
  value,
  icon,
  color,
  secondaryValue,
  secondaryLabel,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  secondaryValue?: number;
  secondaryLabel?: string;
}) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      height: '100%',
    }}
  >
    <CardContent sx={{ p: 2, pb: '16px !important' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}.light`,
            color: `${color}.main`,
            mr: 1.5,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {secondaryValue !== undefined && secondaryLabel && (
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center' }}>
          <Chip
            size="small"
            label={`${secondaryValue} ${secondaryLabel}`}
            color={color as any}
            variant="outlined"
            sx={{ height: 20, fontSize: '0.75rem' }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

export default function FlightOverview() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate completion status
  const completionPercentage = (flightStats.completed / flightStats.total) * 100;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Flight stats */}
        <Grid
          size={{
            xs: 12,
            md: 8
          }}>
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 6,
                sm: 3
              }}>
              <FlightStatCard
                title="Today's Flights"
                value={flightStats.today}
                icon={<TodayIcon />}
                color="primary"
              />
            </Grid>
            <Grid
              size={{
                xs: 6,
                sm: 3
              }}>
              <FlightStatCard
                title="Upcoming Flights"
                value={flightStats.upcoming}
                icon={<EventIcon />}
                color="info"
                secondaryValue={flightStats.alerts}
                secondaryLabel="alerts"
              />
            </Grid>
            <Grid
              size={{
                xs: 6,
                sm: 3
              }}>
              <FlightStatCard
                title="Confirmed"
                value={flightStats.completed}
                icon={<CheckCircleIcon />}
                color="success"
              />
            </Grid>
            <Grid
              size={{
                xs: 6,
                sm: 3
              }}>
              <FlightStatCard
                title="Pending"
                value={flightStats.pending}
                icon={<PendingIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                Flight Completion Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {flightStats.completed} of {flightStats.total} flights completed
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 1,
              }}
            />

            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Completed ({Math.round(completionPercentage)}%)
                  </Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Pending ({Math.round((flightStats.pending / flightStats.total) * 100)}%)
                  </Typography>
                </Box>
              </Grid>
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Cancelled ({Math.round((flightStats.cancelled / flightStats.total) * 100)}%)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Quick Actions */}
        <Grid
          size={{
            xs: 12,
            md: 4
          }}>
          <Card
            sx={{ height: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <CardContent sx={{ p: 2, pb: 1 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Flight Management
              </Typography>

              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
                <Tab label="Tools" />
                <Tab label="Recent" />
              </Tabs>

              {tabValue === 0 ? (
                <Grid container spacing={1}>
                  <Grid size={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ mb: 1, justifyContent: 'flex-start', py: 1 }}
                      component={Link}
                      href="/admin/flights/search"
                      startIcon={<SearchIcon />}
                    >
                      Flight Search
                    </Button>
                  </Grid>
                  <Grid size={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ mb: 1, justifyContent: 'flex-start', py: 1 }}
                      component={Link}
                      href="/admin/calendar"
                      startIcon={<EventIcon />}
                    >
                      Calendar View
                    </Button>
                  </Grid>
                  <Grid size={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      sx={{ mb: 1, justifyContent: 'flex-start', py: 1 }}
                      component={Link}
                      href="/admin/flights/alerts"
                      startIcon={<WarningIcon />}
                    >
                      Flight Alerts ({flightStats.alerts})
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  {recentBookings.map((booking, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <FlightIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {booking.route}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {format(booking.date, 'dd MMM yyyy')}
                        </Typography>
                        <Chip
                          size="small"
                          label={booking.status}
                          color={booking.status === 'confirmed' ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
