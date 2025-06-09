'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
  useClientQuoteRequests,
  useOperatorQuoteRequests,
  useOperatorSubmittedQuotes,
} from '@/hooks/useFlights';
import { QuoteRequest, Offer } from '@/types/flight';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlusIcon, Loader2, ArrowRightIcon, RefreshCwIcon } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  TextField as MuiTextField,
  Dialog,
  DialogContent,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
  Paper,
  Alert,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import SearchIconMui from '@mui/icons-material/Search';
import FlightIconMui from '@mui/icons-material/Flight';
import {
  LocalOffer as LocalOfferIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

// Dashboard Stats Card Component
const StatsCard = ({
  title,
  value,
  icon,
  color,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  description?: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={`${color}.main`}>
            {value}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: `${color}.main` }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

// Recent Items Table Component
const RecentItemsTable = ({
  title,
  items,
  type,
  loading,
  viewAllLink,
}: {
  title: string;
  items: any[];
  type: 'requests' | 'quotes';
  loading: boolean;
  viewAllLink: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <Link href={viewAllLink}>
          <Button size="small" variant="outlined" endIcon={<ArrowRightIcon className="h-4 w-4" />}>
            View All
          </Button>
        </Link>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
          No recent {type} found
        </Typography>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {type === 'requests' ? (
                <>
                  <TableHead>Request Code</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 5).map((item) => (
              <TableRow key={item.id || item.offerId}>
                {type === 'requests' ? (
                  <>
                    <TableCell>
                      <Link
                        href={`/dashboard/quotes/incoming/${item.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {item.requestCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.routing.departureAirport} → {item.routing.arrivalAirport}
                    </TableCell>
                    <TableCell>
                      <Chip label={item.status} size="small" color={getStatusColor(item.status)} />
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      <Link
                        href={`/dashboard/my-quotes`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {item.offerId || item.id}
                      </Link>
                    </TableCell>
                    <TableCell>${item.price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.offerStatus || item.status}
                        size="small"
                        color={getQuoteStatusColor(item.offerStatus || item.status)}
                      />
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

// Status color helper functions
const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'submitted':
    case 'pending':
      return 'primary';
    case 'under-operator-review':
      return 'warning';
    case 'under-offer':
    case 'quoted':
      return 'info';
    case 'accepted':
    case 'booked':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getQuoteStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'pending-client-acceptance':
      return 'warning';
    case 'accepted-by-client':
      return 'success';
    case 'rejected-by-client':
      return 'error';
    case 'awaiting-acknowledgement':
      return 'info';
    default:
      return 'default';
  }
};

export default function QuotesDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Handle different user types
  const isOperator = user?.role === 'operator';
  const isClient = user?.role === 'passenger' || user?.role === 'agent';

  // Operator data
  const {
    requests: incomingRequests,
    loading: requestsLoading,
    error: requestsError,
    refreshRequests,
  } = useOperatorQuoteRequests(isOperator ? user?.userCode : undefined);

  const {
    quotes: submittedQuotes,
    loading: quotesLoading,
    error: quotesError,
  } = useOperatorSubmittedQuotes(isOperator ? user?.userCode : undefined);

  // Client data
  const {
    requests: clientRequests,
    loading: clientRequestsLoading,
    error: clientRequestsError,
  } = useClientQuoteRequests(isClient ? user?.userCode : undefined);

  useEffect(() => {
    if (searchParams.get('submitted') === 'true') {
      setShowSearchModal(true);
      router.replace('/dashboard/quotes', { scroll: false });
      const timer = setTimeout(() => {
        setShowSearchModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Calculate stats for operators
  const operatorStats = useMemo(() => {
    if (!isOperator) return null;

    const newRequestsCount = incomingRequests.filter(
      (r) => r.status === 'submitted' || r.status === 'pending'
    ).length;

    const pendingQuotesCount = submittedQuotes.filter(
      (q) => q.offerStatus === 'pending-client-acceptance'
    ).length;

    const acceptedQuotesCount = submittedQuotes.filter(
      (q) => q.offerStatus === 'accepted-by-client'
    ).length;

    return {
      newRequests: newRequestsCount,
      totalRequests: incomingRequests.length,
      pendingQuotes: pendingQuotesCount,
      acceptedQuotes: acceptedQuotesCount,
      totalQuotes: submittedQuotes.length,
    };
  }, [isOperator, incomingRequests, submittedQuotes]);

  // Calculate stats for clients
  const clientStats = useMemo(() => {
    if (!isClient) return null;

    const activeRequestsCount = clientRequests.filter(
      (r) => !['cancelled', 'completed'].includes(r.status)
    ).length;

    const pendingRequestsCount = clientRequests.filter(
      (r) => r.status === 'submitted' || r.status === 'pending'
    ).length;

    const quotedRequestsCount = clientRequests.filter(
      (r) => r.status === 'under-offer' || r.status === 'quoted'
    ).length;

    return {
      totalRequests: clientRequests.length,
      activeRequests: activeRequestsCount,
      pendingRequests: pendingRequestsCount,
      quotedRequests: quotedRequestsCount,
    };
  }, [isClient, clientRequests]);

  const renderSearchModal = () => (
    <Dialog
      open={showSearchModal}
      onClose={() => setShowSearchModal(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogContent sx={{ textAlign: 'center', p: 4 }}>
        <SearchIconMui sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Searching for Quotes...
        </Typography>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography
            variant="body1"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
          >
            <FlightIconMui sx={{ mr: 1, opacity: 0.7 }} /> Searching operators...
          </Typography>
          <LinearProgress variant="indeterminate" sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="body1"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
          >
            <FlightIconMui sx={{ mr: 1, opacity: 0.7 }} /> Searching empty legs...
          </Typography>
          <LinearProgress
            variant="indeterminate"
            color="secondary"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  // Show loading state
  if (isOperator && (requestsLoading || quotesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (isClient && clientRequestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  // Operator Dashboard View
  if (isOperator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quotes Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your incoming requests and submitted quotes</p>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshRequests} color="primary">
                <RefreshCwIcon className="h-5 w-5" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Error Alerts */}
        {requestsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {requestsError}
          </Alert>
        )}
        {quotesError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {quotesError}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="New Requests"
              value={operatorStats?.newRequests || 0}
              icon={<PendingIcon sx={{ fontSize: 40 }} />}
              color="warning"
              description="Awaiting your response"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Total Requests"
              value={operatorStats?.totalRequests || 0}
              icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
              color="primary"
              description="All incoming requests"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Pending Quotes"
              value={operatorStats?.pendingQuotes || 0}
              icon={<LocalOfferIcon sx={{ fontSize: 40 }} />}
              color="info"
              description="Awaiting client response"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Accepted Quotes"
              value={operatorStats?.acceptedQuotes || 0}
              icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
              color="success"
              description="Successfully booked"
            />
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <RecentItemsTable
              title="Recent Incoming Requests"
              items={incomingRequests}
              type="requests"
              loading={requestsLoading}
              viewAllLink="/dashboard/quotes/incoming"
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <RecentItemsTable
              title="Recent Submitted Quotes"
              items={submittedQuotes}
              type="quotes"
              loading={quotesLoading}
              viewAllLink="/dashboard/my-quotes"
            />
          </Grid>
        </Grid>

        {renderSearchModal()}
      </div>
    );
  }

  // Client Dashboard View (passengers/agents)
  if (isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Quote Requests</h1>
          <Link href="/dashboard/quotes/request">
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>New Request</span>
            </Button>
          </Link>
        </div>

        {clientRequestsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {clientRequestsError}
          </Alert>
        )}

        {/* Client Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Total Requests"
              value={clientStats?.totalRequests || 0}
              icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Active Requests"
              value={clientStats?.activeRequests || 0}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="Pending"
              value={clientStats?.pendingRequests || 0}
              icon={<PendingIcon sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard
              title="With Quotes"
              value={clientStats?.quotedRequests || 0}
              icon={<LocalOfferIcon sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
        </Grid>

        {/* Recent Client Requests */}
        <RecentItemsTable
          title="Recent Quote Requests"
          items={clientRequests}
          type="requests"
          loading={clientRequestsLoading}
          viewAllLink="/dashboard/quotes/request"
        />

        {renderSearchModal()}
      </div>
    );
  }

  // Fallback for other user types
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Quotes Dashboard</h1>
        <p className="text-gray-600">Please log in to view your quotes dashboard.</p>
      </div>
    </div>
  );
}
