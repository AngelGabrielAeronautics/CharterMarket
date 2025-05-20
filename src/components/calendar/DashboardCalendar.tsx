import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Divider,
  Tooltip,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CalendarMonth as CalendarIcon,
  Flight as FlightIcon,
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
} from 'date-fns';
import { useRouter } from 'next/navigation';
import { CalendarFlight } from './FlightCalendar';
import { UserRole } from '@/lib/userCode';

interface DashboardCalendarProps {
  flights: CalendarFlight[];
  userRole: UserRole;
  title?: string;
}

export default function DashboardCalendar({
  flights,
  userRole,
  title = 'Flight Calendar',
}: DashboardCalendarProps) {
  const router = useRouter();
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const navigateToCalendar = () => {
    const route =
      userRole === 'admin' || userRole === 'superAdmin' ? '/admin/calendar' : '/dashboard/calendar';
    router.push(route);
  };

  const getFlightsForDay = (day: Date): CalendarFlight[] => {
    return flights.filter((flight) => {
      const flightDate =
        flight.date instanceof Date ? flight.date : parseISO(flight.date as string);
      return isSameDay(flightDate, day);
    });
  };

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

  // Total flights in the month
  const totalFlightsInMonth = flights.filter((flight) => {
    const flightDate = flight.date instanceof Date ? flight.date : parseISO(flight.date as string);
    return isSameMonth(flightDate, currentMonth);
  }).length;

  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          {title}
        </Typography>

        <Chip
          label={`${totalFlightsInMonth} Flights`}
          size="small"
          color="primary"
          variant="outlined"
          icon={<FlightIcon sx={{ fontSize: '16px !important' }} />}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>

        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 1,
        }}
      >
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Box
            key={index}
            sx={{
              textAlign: 'center',
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 'medium',
              color: 'text.secondary',
            }}
          >
            {day}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        {calendarDays.map((day, i) => {
          if (day === null) {
            return (
              <Box
                key={`blank-${i}`}
                sx={{
                  aspectRatio: '1/1',
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              />
            );
          }

          const dayFlights = getFlightsForDay(day);
          const hasFlights = dayFlights.length > 0;

          return (
            <Tooltip
              title={
                hasFlights
                  ? `${dayFlights.length} flight${dayFlights.length > 1 ? 's' : ''}`
                  : 'No flights'
              }
              arrow
              key={day.toString()}
            >
              <Box
                sx={{
                  aspectRatio: '1/1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  borderRadius: 1,
                  cursor: hasFlights ? 'pointer' : 'default',
                  bgcolor: isToday(day)
                    ? 'primary.lighter'
                    : isSameDay(day, selectedDate)
                      ? 'action.selected'
                      : !isSameMonth(day, currentMonth)
                        ? 'action.disabledBackground'
                        : 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': hasFlights
                    ? {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        transition: 'transform 0.2s ease-in-out',
                        boxShadow: 1,
                      }
                    : {},
                }}
                onClick={() => {
                  setSelectedDate(day);
                  if (hasFlights) {
                    navigateToCalendar();
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday(day) ? 'bold' : 'regular',
                    color: !isSameMonth(day, currentMonth) ? 'text.disabled' : 'text.primary',
                    lineHeight: 1,
                  }}
                >
                  {format(day, 'd')}
                </Typography>

                {hasFlights && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: '2px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      bgcolor: dayFlights.some((f) => f.status === 'pending')
                        ? 'warning.main'
                        : 'primary.main',
                      // Multiple dots for multiple flights
                      boxShadow:
                        dayFlights.length > 1
                          ? `4px 0 0 0 ${theme.palette.primary.main}, -4px 0 0 0 ${theme.palette.primary.main}`
                          : 'none',
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ textAlign: 'center', pt: 2 }}>
        <Button
          variant="text"
          size="small"
          startIcon={<CalendarIcon />}
          onClick={navigateToCalendar}
        >
          View Full Calendar
        </Button>
      </Box>
    </Paper>
  );
}
