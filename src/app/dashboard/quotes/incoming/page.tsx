'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorQuoteRequests } from '@/hooks/useFlights';
import { useRouter } from 'next/navigation';

import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Grid,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import QuoteRequestModal from '@/components/quotes/QuoteRequestModal';
import { QuoteRequest } from '@/types/flight';

const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  // Same status color logic as other pages
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

export default function AllOperatorQuoteRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    requests: quoteRequests,
    loading,
    error,
    refreshRequests,
  } = useOperatorQuoteRequests(user?.userCode);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const handleViewDetails = (id: string) => {
    setSelectedRequestId(id);
  };

  const handleCloseModal = () => {
    setSelectedRequestId(null);
  };

  const sortedRequests = useMemo(() => {
    return [...quoteRequests].sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [quoteRequests]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Grid>
          <Typography variant="h4" component="h1">
            All Incoming Quote Requests
          </Typography>
        </Grid>
        <Grid>
          <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshRequests}>
            Refresh
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">Failed to load quote requests: {error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="all operator quote requests table">
              <TableHead>
                <TableRow>
                  <TableCell>Request Code</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Client</TableCell>
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
                        ? new Date(request.createdAt.toMillis()).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip label={request.status} size="small" color={getStatusColor(request.status)} />
                    </TableCell>
                    <TableCell>{request.clientUserCode}</TableCell>
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
    </Box>
  );
}
