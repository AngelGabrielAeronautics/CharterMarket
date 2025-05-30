'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorQuoteRequests } from '@/hooks/useFlights';
import { QuoteRequest, FlightStatus } from '@/types/flight';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Box,
  Typography,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FlightTakeoff as FlightTakeoffIcon,
  ArrowForward as ArrowForwardIcon,
  LocalOffer as LocalOfferIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export default function IncomingRequestsPage() {
  const { user } = useAuth();
  const {
    requests,
    loading,
    error,
    refreshRequests,
    indexError,
    indexUrl,
    retryCount,
    useFallback,
  } = useOperatorQuoteRequests(user?.userCode);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FlightStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set up auto-refresh for the quotes page
  useEffect(() => {
    // Refresh on page load/mount
    refreshRequests();

    // Check for new quotes every minute
    const intervalId = setInterval(() => {
      refreshRequests();
    }, 60000); // 1 minute

    return () => clearInterval(intervalId);
  }, [refreshRequests]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshRequests();

    // Visual feedback for refresh button
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleForceReload = () => {
    // Force a full page reload to clear any caching
    window.location.reload();
  };

  const filteredRequests =
    requests?.filter((req) => {
      // Apply search term filter
      const matchesSearch =
        req.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.routing.departureAirport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.routing.arrivalAirport.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const pendingCount = requests?.filter((req) => req.status === 'pending').length || 0;
  const quotedCount = requests?.filter((req) => req.status === 'quoted').length || 0;
  const completedCount =
    requests?.filter((req) => ['accepted', 'confirmed', 'completed'].includes(req.status)).length ||
    0;

  const getStatusChip = (status: FlightStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Chip
            label="Pending"
            color="warning"
            size="small"
            icon={<FilterListIcon style={{ fontSize: 16 }} />}
          />
        );
      case 'quoted':
        return (
          <Chip
            label="Quoted"
            color="info"
            size="small"
            icon={<LocalOfferIcon style={{ fontSize: 16 }} />}
          />
        );
      case 'accepted':
        return (
          <Chip
            label="Accepted"
            color="success"
            size="small"
            icon={<CheckCircleIcon style={{ fontSize: 16 }} />}
          />
        );
      case 'confirmed':
        return (
          <Chip
            label="Confirmed"
            color="success"
            size="small"
            icon={<CheckCircleIcon style={{ fontSize: 16 }} />}
          />
        );
      case 'completed':
        return <Chip label="Completed" color="default" size="small" />;
      case 'cancelled':
        return (
          <Chip
            label="Cancelled"
            color="error"
            size="small"
            icon={<CancelIcon style={{ fontSize: 16 }} />}
          />
        );
      default:
        return (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color="default"
            size="small"
          />
        );
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Incoming Quote Requests
          </Typography>
          <Tooltip title="Refresh requests">
            <IconButton
              onClick={handleManualRefresh}
              sx={{ ml: 2 }}
              color="primary"
              disabled={isRefreshing || loading}
            >
              <RefreshIcon
                sx={{
                  animation: isRefreshing || loading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Refreshing...
            </Typography>
          )}
          {useFallback && !error && (
            <Chip
              label="Using fallback mode"
              color="info"
              size="small"
              icon={<InfoIcon />}
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <TextField
          placeholder="Search requests..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />
      </Box>

      {error && (
        <Alert
          severity={indexError ? 'info' : 'error'}
          sx={{ mb: 3 }}
          action={
            <>
              {indexError && indexUrl && (
                <Tooltip title="Open Firebase Console">
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => window.open(indexUrl, '_blank')}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                onClick={refreshRequests}
                sx={{ ml: 1 }}
              >
                Retry
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                onClick={handleForceReload}
                sx={{ ml: 1 }}
              >
                Force Reload
              </Button>
            </>
          }
        >
          {error}
          {indexError && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Firebase is setting up the required database indexes. This typically takes 1-2
              minutes.
              {useFallback ? ' Showing results using fallback mode in the meantime.' : ''}
              {indexUrl && (
                <MuiLink
                  href={indexUrl}
                  target="_blank"
                  rel="noopener"
                  sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}
                >
                  View in Firebase Console <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
                </MuiLink>
              )}
            </Typography>
          )}
        </Alert>
      )}

      {useFallback && !error && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button variant="outlined" size="small" color="inherit" onClick={refreshRequests}>
              Try Main Method
            </Button>
          }
        >
          Database indexes are being created. Showing results in fallback mode, which may not
          include the latest sorting.
          {indexUrl && (
            <MuiLink
              href={indexUrl}
              target="_blank"
              rel="noopener"
              sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}
            >
              View in Firebase Console <OpenInNewIcon fontSize="small" sx={{ ml: 0.5 }} />
            </MuiLink>
          )}
        </Alert>
      )}

      {loading && !requests.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <Chip
              label={`All (${requests.length})`}
              color={statusFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setStatusFilter('all')}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            />
            <Chip
              label={`Pending (${pendingCount})`}
              color={statusFilter === 'pending' ? 'warning' : 'default'}
              onClick={() => setStatusFilter('pending')}
              variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
              icon={<FilterListIcon />}
            />
            <Chip
              label={`Quoted (${quotedCount})`}
              color={statusFilter === 'quoted' ? 'info' : 'default'}
              onClick={() => setStatusFilter('quoted')}
              variant={statusFilter === 'quoted' ? 'filled' : 'outlined'}
              icon={<LocalOfferIcon />}
            />
            <Chip
              label={`Completed (${completedCount})`}
              color={
                statusFilter === 'accepted' ||
                statusFilter === 'confirmed' ||
                statusFilter === 'completed'
                  ? 'success'
                  : 'default'
              }
              onClick={() => setStatusFilter('accepted')}
              variant={
                statusFilter === 'accepted' ||
                statusFilter === 'confirmed' ||
                statusFilter === 'completed'
                  ? 'filled'
                  : 'outlined'
              }
              icon={<CheckCircleIcon />}
            />
          </Box>

          <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2 }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Code</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    sx={
                      req.status === 'pending'
                        ? {
                            backgroundColor: 'rgba(255, 152, 0, 0.08)', // Light warning color for pending requests
                          }
                        : {}
                    }
                  >
                    <TableCell>{req.requestCode}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{req.routing.departureAirport}</Typography>
                        <ArrowForwardIcon fontSize="small" sx={{ mx: 1 }} />
                        <Typography variant="body2">{req.routing.arrivalAirport}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(req.routing.departureDate.toDate(), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{req.passengerCount}</TableCell>
                    <TableCell>{getStatusChip(req.status)}</TableCell>
                    <TableCell>
                      {req.status === 'pending' ? (
                        <Link href={`/dashboard/quotes/incoming/${req.id}`}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<LocalOfferIcon />}
                            sx={{ mr: 1 }}
                          >
                            Offer Quote
                          </Button>
                        </Link>
                      ) : req.status === 'quoted' ? (
                        <Link href={`/dashboard/quotes/incoming/${req.id}`}>
                          <Button size="small" variant="outlined" color="primary">
                            View Quote
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/quotes/incoming/${req.id}`}>
                          <Button size="small" variant="text" color="primary">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      {searchTerm || statusFilter !== 'all' ? (
                        <Typography variant="body1">
                          No matching requests found. Try adjusting your filters.
                        </Typography>
                      ) : (
                        <Box>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            No incoming quote requests available.
                          </Typography>
                          {useFallback && (
                            <Typography variant="body2" color="text.secondary">
                              Using fallback mode while database indexes are being created.{' '}
                              <Button size="small" onClick={refreshRequests}>
                                Retry with main method
                              </Button>
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
}
