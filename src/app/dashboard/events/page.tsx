'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEventLogs, searchEventLogs } from '@/utils/eventLogger';
import { EventLog, EventCategory, EventSeverity } from '@/types/event';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const defaultFilters = {
  category: '',
  severity: '',
  startDate: '',
  endDate: '',
  searchTerm: '',
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const loadEvents = async () => {
    if (!user?.userCode) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (filters.searchTerm) {
        const searchResults = await searchEventLogs(filters.searchTerm);
        setEvents(searchResults);
        setTotalEvents(searchResults.length);
        setTotalPages(Math.ceil(searchResults.length / 10));
      } else {
        const { events: fetchedEvents, total } = await getEventLogs({
          userCode: user.userCode,
          category: filters.category ? filters.category as EventCategory : undefined,
          severity: filters.severity ? filters.severity as EventSeverity : undefined,
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
          limit: 10,
          offset: (page - 1) * 10
        });
        
        setEvents(fetchedEvents);
        setTotalEvents(total);
        setTotalPages(Math.ceil(total / 10));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user, filters, page]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    toast.success('Filters reset');
  };

  const handleExport = async () => {
    try {
      const csvContent = [
        ['Timestamp', 'Category', 'Type', 'Severity', 'Description', 'User Code', 'User Role'],
        ...events.map(event => [
          format(event.timestamp.toDate(), 'PPpp'),
          event.category,
          event.type,
          event.severity,
          event.description,
          event.userCode,
          event.userRole
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `events_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast.success('Events exported successfully');
    } catch (err) {
      toast.error('Failed to export events');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Event Logs</Typography>
        <Button onClick={handleExport} variant="outlined">
          Export to CSV
        </Button>
      </Stack>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search events..."
              value={filters.searchTerm}
              onChange={handleSearch}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Select
              fullWidth
              displayEmpty
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              {Object.values(EventCategory).map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Select
              fullWidth
              displayEmpty
              value={filters.severity}
              onChange={e => setFilters({ ...filters, severity: e.target.value })}
              size="small"
            >
              <MenuItem value="">All Severities</MenuItem>
              {Object.values(EventSeverity).map(severity => (
                <MenuItem key={severity} value={severity}>{severity}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          {hasActiveFilters && (
            <Grid item xs={12} sm={3} md={1}>
              <Button 
                onClick={handleResetFilters} 
                variant="outlined" 
                color="error"
                fullWidth
                size="small"
              >
                Reset
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>User Code</TableCell>
                <TableCell>User Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.timestamp?.toDate ? format(event.timestamp.toDate(), 'PPpp') : '-'}</TableCell>
                    <TableCell>{event.category}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          bgcolor:
                            event.severity === EventSeverity.CRITICAL ? 'error.light' :
                            event.severity === EventSeverity.HIGH ? 'warning.light' :
                            event.severity === EventSeverity.MEDIUM ? 'warning.main' :
                            event.severity === EventSeverity.LOW ? 'info.light' :
                            'success.light',
                          color:
                            event.severity === EventSeverity.CRITICAL ? 'error.dark' :
                            event.severity === EventSeverity.HIGH ? 'warning.dark' :
                            event.severity === EventSeverity.MEDIUM ? 'warning.contrastText' :
                            event.severity === EventSeverity.LOW ? 'info.dark' :
                            'success.dark',
                        }}
                      >
                        {event.severity}
                      </Box>
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>{event.userCode}</TableCell>
                    <TableCell>{event.userRole}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mt={4} gap={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {events.length} of {totalEvents} events
        </Typography>
        <Stack direction="row" gap={2} alignItems="center">
          <Button
            variant="outlined"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Typography variant="body2">
            Page {page} of {totalPages}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
} 