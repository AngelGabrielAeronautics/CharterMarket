'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Offer } from '@/types/flight';
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
  Alert,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/ui/PageLayout';
import { getAllQuotes } from '@/lib/quote';

const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'pending-client-acceptance':
      return 'primary';
    case 'awaiting-acknowledgement':
      return 'warning';
    case 'accepted-by-client':
      return 'success';
    case 'rejected-by-client':
      return 'error';
    case 'expired':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function QuotesDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    if (!user?.userCode) return;
    
    setLoading(true);
    try {
      // For clients, fetch quotes where they are the clientUserCode
      // For operators, fetch quotes they have submitted
      const filters = user?.role === 'operator' 
        ? { operatorUserCode: user.userCode }
        : { clientUserCode: user.userCode };
      
      const fetchedQuotes = await getAllQuotes(filters);
      setQuotes(fetchedQuotes);
      setError(null);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userCode) {
      fetchQuotes();
    } else {
      setLoading(false);
    }
  }, [user?.userCode]);

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      const timeA = a.createdAt?.toDate().getTime() ?? 0;
      const timeB = b.createdAt?.toDate().getTime() ?? 0;
      return timeB - timeA;
    });
  }, [quotes]);

  const handleViewDetails = (requestId: string) => {
    router.push(`/dashboard/quotes/request?id=${requestId}`);
  };

  return (
    <PageLayout
      title="My Quotes"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RefreshCw />} onClick={fetchQuotes}>
            Refresh
          </Button>
        </Box>
      }
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">Failed to load quotes: {error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="my quotes table">
              <TableHead>
                <TableRow>
                  <TableCell>Quote ID</TableCell>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" sx={{ py: 3 }}>
                        No quotes found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedQuotes.map((quote) => (
                    <TableRow
                      hover
                      key={quote.offerId}
                      onClick={() => handleViewDetails(quote.requestId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                          {quote.offerId}
                        </Typography>
                      </TableCell>
                      <TableCell>{quote.requestId}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: quote.currency || 'USD',
                        }).format(quote.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={quote.offerStatus}
                          size="small"
                          color={getStatusColor(quote.offerStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        {quote.createdAt
                          ? new Date(quote.createdAt.toDate()).toLocaleDateString()
                          : 'Invalid Date'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </PageLayout>
  );
}
