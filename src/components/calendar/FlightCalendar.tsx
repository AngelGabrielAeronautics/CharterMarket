import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Badge,
  Button,
  Chip,
  Popper,
  Grow,
  ClickAwayListener,
  Card,
  CardContent,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Flight as FlightIcon,
  FlightTakeoff as FlightTakeoffIcon,
  FlightLand as FlightLandIcon,
  Event as EventIcon,
  EventBusy as EventBusyIcon,
} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/userCode';

// Types for flights
export interface CalendarFlight {
  id: string;
  flightCode: string;
  from: string;
  to: string;
  date: Date | string;
  status: 'confirmed' | 'pending' | 'cancelled';
  role?: 'departure' | 'arrival' | 'both';
  passengers?: number;
  operatorCode?: string;
  operatorName?: string;
  clientName?: string;
}

interface FlightCalendarProps {
  flights: CalendarFlight[];
  userRole: UserRole;
  onFlightClick?: (flight: CalendarFlight) => void;
  dashboardView?: boolean;
}

export default function FlightCalendar({
  flights,
  userRole,
  onFlightClick,
  dashboardView = false,
}: FlightCalendarProps) {
  const theme = useTheme();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dayFlights, setDayFlights] = useState<CalendarFlight[]>([]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const getFlightsForDay = (day: Date): CalendarFlight[] => {
    return flights.filter((flight) => {
      const flightDate =
        flight.date instanceof Date ? flight.date : parseISO(flight.date as string);
      return isSameDay(flightDate, day);
    });
  };

  const handleDateClick = (
    day: Date,
    flightsOnDay: CalendarFlight[],
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    setSelectedDate(day);
    if (flightsOnDay.length > 0) {
      setDayFlights(flightsOnDay);
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };

  const handleFlightClick = (flight: CalendarFlight) => {
    if (onFlightClick) {
      onFlightClick(flight);
    } else {
      // Default behavior - navigate to flight details
      let url = '';
      if (userRole === 'admin' || userRole === 'superAdmin') {
        url = `/admin/flights/${flight.id}`;
      } else if (userRole === 'operator') {
        url = `/dashboard/bookings/operator/${flight.id}`;
      } else {
        url = `/dashboard/bookings/${flight.id}`;
      }
      router.push(url);
    }
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const popperId = open ? 'flight-popper' : undefined;

  // Generate the days to display in the calendar
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get start day of month (0 = Sunday, 1 = Monday, etc.)
  const startDay = startOfMonth(currentMonth).getDay();

  // Create blank cells for days before the first of the month
  const blankDays = Array(startDay).fill(null);

  // Combine blank days and actual days for the full calendar grid
  const calendarDays = [...blankDays, ...daysInMonth];

  // Get total flights count for the month
  const totalFlightsInMonth = flights.filter((flight) => {
    const flightDate = flight.date instanceof Date ? flight.date : parseISO(flight.date as string);
    return isSameMonth(flightDate, currentMonth);
  }).length;

  // Limit the display for dashboard view
  const calendarHeight = dashboardView ? '400px' : '600px';

  return (
    <Box>
      {/* Calendar Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant={dashboardView ? 'h6' : 'h5'} fontWeight="bold">
          Flight Calendar
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>

            <Button variant="text" onClick={handleToday} startIcon={<TodayIcon />} sx={{ mx: 1 }}>
              Today
            </Button>

            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <Chip
          label={`${totalFlightsInMonth} Flights`}
          color="primary"
          variant="outlined"
          icon={<FlightIcon />}
        />
      </Box>

      {/* Calendar Grid */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          height: calendarHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Weekday Headers */}
        <Grid container sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Grid
              item
              xs={12 / 7}
              key={index}
              sx={{
                p: 1,
                textAlign: 'center',
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Grid container sx={{ height: '100%' }}>
            {calendarDays.map((day, i) => {
              if (day === null) {
                return (
                  <Grid
                    item
                    xs={12 / 7}
                    key={`blank-${i}`}
                    sx={{
                      height: dashboardView ? '65px' : '85px',
                      bgcolor: 'background.default',
                      p: 0.5,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                );
              }

              const dayFlights = getFlightsForDay(day);
              const hasDepartures = dayFlights.some(
                (f) => f.role === 'departure' || f.role === 'both'
              );
              const hasArrivals = dayFlights.some((f) => f.role === 'arrival' || f.role === 'both');

              return (
                <Grid
                  item
                  xs={12 / 7}
                  key={day.toString()}
                  sx={{
                    height: dashboardView ? '65px' : '85px',
                    p: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isToday(day)
                      ? 'primary.lighter'
                      : isSameDay(day, selectedDate)
                        ? 'action.selected'
                        : !isSameMonth(day, currentMonth)
                          ? 'action.disabledBackground'
                          : 'background.paper',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={(e) => handleDateClick(day, dayFlights, e)}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      height: '100%',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isToday(day) ? 'bold' : 'regular',
                        color: !isSameMonth(day, currentMonth) ? 'text.disabled' : 'text.primary',
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>

                    {dayFlights.length > 0 && (
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {hasDepartures && (
                          <Tooltip title="Departures">
                            <Chip
                              icon={<FlightTakeoffIcon fontSize="small" />}
                              label={
                                dayFlights.filter(
                                  (f) => f.role === 'departure' || f.role === 'both'
                                ).length
                              }
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontWeight: 'bold' }}
                            />
                          </Tooltip>
                        )}

                        {hasArrivals && (
                          <Tooltip title="Arrivals">
                            <Chip
                              icon={<FlightLandIcon fontSize="small" />}
                              label={
                                dayFlights.filter((f) => f.role === 'arrival' || f.role === 'both')
                                  .length
                              }
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontWeight: 'bold' }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>

      {/* Flight details popper */}
      <Popper
        id={popperId}
        open={open}
        anchorEl={anchorEl}
        placement="top"
        transition
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 10],
            },
          },
        ]}
        style={{ zIndex: 1000 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'center bottom' }}>
            <Paper
              sx={{
                p: 2,
                maxWidth: 350,
                width: 300,
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                    <Badge badgeContent={dayFlights.length} color="primary">
                      <EventIcon />
                    </Badge>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {dayFlights.length > 0 ? (
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {dayFlights.map((flight) => (
                        <Card
                          key={flight.id}
                          sx={{
                            mb: 1.5,
                            cursor: 'pointer',
                            borderLeft: '4px solid',
                            borderLeftColor:
                              flight.status === 'confirmed'
                                ? 'success.main'
                                : flight.status === 'pending'
                                  ? 'warning.main'
                                  : 'error.main',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 2,
                            },
                            '&:last-child': {
                              mb: 0,
                            },
                          }}
                          onClick={() => handleFlightClick(flight)}
                          variant="outlined"
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {flight.from} → {flight.to}
                              </Typography>
                              <Chip
                                size="small"
                                label={flight.status}
                                color={
                                  flight.status === 'confirmed'
                                    ? 'success'
                                    : flight.status === 'pending'
                                      ? 'warning'
                                      : 'error'
                                }
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block">
                              {flight.flightCode}
                            </Typography>

                            {userRole === 'admin' || userRole === 'superAdmin' ? (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {flight.operatorName} • {flight.clientName}
                              </Typography>
                            ) : userRole === 'operator' ? (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Client: {flight.clientName}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Operator: {flight.operatorName}
                              </Typography>
                            )}

                            {flight.passengers && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Passengers: {flight.passengers}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <EventBusyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">
                        No flights scheduled for this day
                      </Typography>
                    </Box>
                  )}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}
