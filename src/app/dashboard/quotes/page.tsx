'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useClientQuoteRequests } from '@/hooks/useFlights';
import { QuoteRequest } from '@/types/flight';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Alert,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { PlusIcon, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import QuoteRequestModal from '@/components/quotes/QuoteRequestModal';
import PageLayout from '@/components/ui/PageLayout';

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

export default function QuotesDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    requests: quoteRequests,
    loading,
    error,
    refreshRequests,
  } = useClientQuoteRequests(user?.userCode);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const handleViewDetails = (id: string) => {
    setSelectedRequestId(id);
  };

  const handleCloseModal = () => {
    setSelectedRequestId(null);
  };

  const sortedRequests = useMemo(() => {
    return [...quoteRequests].sort((a, b) => {
      const timeA = a.createdAt?.toDate().getTime() ?? 0;
      const timeB = b.createdAt?.toDate().getTime() ?? 0;
      return timeB - timeA;
    });
  }, [quoteRequests]);

  return (
    <PageLayout
      title="My Quote Requests"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshRequests}>
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={() => router.push('/dashboard/quotes/request')}
          >
            New Request
          </Button>
        </Box>
      }
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">Failed to load quote requests: {error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="my quote requests table">
              <TableHead>
                <TableRow>
                  <TableCell>Request Code</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Offers</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRequests.map((request: QuoteRequest) => (
                  <TableRow
                    hover
                    key={request.id}
                    onClick={() => handleViewDetails(request.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                        {request.requestCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {request.routing.departureAirport} → {request.routing.arrivalAirport}
                    </TableCell>
                    <TableCell>
                      {request.createdAt
                        ? new Date(request.createdAt.toDate()).toLocaleDateString()
                        : 'Invalid Date'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.offers?.length || 0}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <QuoteRequestModal
        open={!!selectedRequestId}
        onClose={handleCloseModal}
        requestId={selectedRequestId}
      />
    </PageLayout>
  );
}
