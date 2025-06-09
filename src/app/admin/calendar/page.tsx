'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ViewList as ListIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import FlightCalendar, { CalendarFlight } from '@/components/calendar/FlightCalendar';
import { generateMockFlights } from '@/lib/mockFlightData';

export default function AdminCalendarPage() {
  const { user, userRole, loading } = useAuth();
  const [flights, setFlights] = useState<CalendarFlight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<CalendarFlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    operator: 'all',
    dateRange: 'all',
  });

  // Handle change of view type (calendar/list)
  const handleViewTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewType: 'calendar' | 'list' | null
  ) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };

  // Simulate loading flights from an API
  const loadFlights = async () => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (userRole === 'admin' || userRole === 'superAdmin') {
        // Generate mock flights - more for admin view
        const mockFlights = generateMockFlights(userRole, 90, 50);
        setFlights(mockFlights);
        setFilteredFlights(mockFlights);
      }
    } catch (error) {
      console.error('Error loading flights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh flights data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFlights();
    setIsRefreshing(false);
  };

  // Toggle filters panel
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  // Update filters
  const handleFilterChange = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      operator: 'all',
      dateRange: 'all',
    });
    setSearchQuery('');
  };

  // Apply filters to flights
  useEffect(() => {
    if (flights.length === 0) return;

    let result = [...flights];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (flight) =>
          flight.flightCode.toLowerCase().includes(query) ||
          flight.from.toLowerCase().includes(query) ||
          flight.to.toLowerCase().includes(query) ||
          flight.operatorName?.toLowerCase().includes(query) ||
          flight.clientName?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter((flight) => flight.status === filters.status);
    }

    // Apply operator filter
    if (filters.operator !== 'all') {
      result = result.filter((flight) => flight.operatorCode === filters.operator);
    }

    // Apply date range filter (simplified implementation)
    if (filters.dateRange !== 'all') {
      const today = new Date();

      if (filters.dateRange === 'today') {
        result = result.filter((flight) => {
          const flightDate = flight.date instanceof Date ? flight.date : new Date(flight.date);
          return flightDate.toDateString() === today.toDateString();
        });
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);

        result = result.filter((flight) => {
          const flightDate = flight.date instanceof Date ? flight.date : new Date(flight.date);
          return flightDate >= weekAgo && flightDate <= today;
        });
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);

        result = result.filter((flight) => {
          const flightDate = flight.date instanceof Date ? flight.date : new Date(flight.date);
          return flightDate >= monthAgo && flightDate <= today;
        });
      }
    }

    setFilteredFlights(result);
  }, [flights, searchQuery, filters]);

  // Load flights on component mount
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'superAdmin') {
      loadFlights();
    }
  }, [userRole]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
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

  // Get unique operators for the filter dropdown
  const operators = [...new Set(flights.map((flight) => flight.operatorCode))].map((code) => ({
    code,
    name: flights.find((f) => f.operatorCode === code)?.operatorName || code,
  }));

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Flight Calendar
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewTypeChange}
            aria-label="view type"
            size="small"
          >
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              Calendar
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ListIcon fontSize="small" sx={{ mr: 1 }} />
              List
            </ToggleButton>
          </ToggleButtonGroup>

          <Tooltip title="Filters">
            <IconButton onClick={toggleFilters}>
              <FilterIcon color={filtersOpen ? 'primary' : 'inherit'} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh data">
            <span>
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
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
            </span>
          </Tooltip>
        </Box>
      </Box>
      {filtersOpen && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Filter Flights</Typography>

            <Button size="small" startIcon={<ClearIcon />} onClick={clearFilters}>
              Clear All
            </Button>
          </Box>

          <Grid container spacing={2}>
            {/* @ts-ignore - MUI Grid type inference issue */}
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* @ts-ignore - MUI Grid type inference issue */}
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>Operator</InputLabel>
                <Select
                  value={filters.operator}
                  label="Operator"
                  onChange={(e) => handleFilterChange('operator', e.target.value)}
                >
                  <MenuItem value="all">All Operators</MenuItem>
                  {operators.map((operator) => (
                    <MenuItem key={operator.code} value={operator.code}>
                      {operator.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* @ts-ignore - MUI Grid type inference issue */}
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="all">All Dates</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* @ts-ignore - MUI Grid type inference issue */}
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="Search"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
          </Grid>

          {/* Filter chips */}
          {(filters.status !== 'all' ||
            filters.operator !== 'all' ||
            filters.dateRange !== 'all' ||
            searchQuery) && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filters.status !== 'all' && (
                <Chip
                  label={`Status: ${filters.status}`}
                  onDelete={() => handleFilterChange('status', 'all')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}

              {filters.operator !== 'all' && (
                <Chip
                  label={`Operator: ${operators.find((op) => op.code === filters.operator)?.name}`}
                  onDelete={() => handleFilterChange('operator', 'all')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}

              {filters.dateRange !== 'all' && (
                <Chip
                  label={`Date: ${
                    filters.dateRange === 'today'
                      ? 'Today'
                      : filters.dateRange === 'week'
                        ? 'Last 7 Days'
                        : 'Last 30 Days'
                  }`}
                  onDelete={() => handleFilterChange('dateRange', 'all')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}

              {searchQuery && (
                <Chip
                  label={`Search: ${searchQuery}`}
                  onDelete={() => setSearchQuery('')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}

              <Chip label={`${filteredFlights.length} results`} color="default" size="small" />
            </Box>
          )}
        </Paper>
      )}
      {isLoading ? (
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={500} animation="wave" sx={{ borderRadius: 2 }} />
        </Box>
      ) : viewType === 'calendar' ? (
        <FlightCalendar flights={filteredFlights} userRole={userRole} />
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Flight List View
          </Typography>

          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" paragraph>
              List view is coming soon!
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setViewType('calendar')}
              startIcon={<CalendarIcon />}
            >
              Switch to Calendar View
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
