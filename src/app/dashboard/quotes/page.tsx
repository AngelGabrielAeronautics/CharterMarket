'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Offer } from '@/types/flight';
import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Quotes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          View quotes from operators for your flight requests
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="outlined" startIcon={<RefreshCw />} onClick={fetchQuotes}>
          Refresh
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load quotes: {error}</Alert>}

      {!loading && !error && sortedQuotes.length === 0 ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 1,
            mb: 2
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No quotes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit a quote request to start receiving quotes from operators
          </Typography>
        </Paper>
      ) : (
        <Paper 
          elevation={1} 
          sx={{ 
            overflow: 'hidden',
            borderRadius: 1,
            mb: 2
          }}
        >
          <TableContainer>
            <MuiTable>
              <MuiTableHead>
                <MuiTableRow>
                  <MuiTableCell sx={{ fontWeight: 'medium' }}>Quote ID</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'medium' }}>Request ID</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'medium' }}>Price</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'medium' }}>Status</MuiTableCell>
                  <MuiTableCell sx={{ fontWeight: 'medium' }}>Date</MuiTableCell>
                </MuiTableRow>
              </MuiTableHead>
              <MuiTableBody>
                {sortedQuotes.map((quote) => (
                  <MuiTableRow
                    key={quote.id}
                    onClick={() => handleViewDetails(quote.requestId)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <MuiTableCell>{quote.id.slice(0, 8)}</MuiTableCell>
                    <MuiTableCell>{quote.requestId.slice(0, 8)}</MuiTableCell>
                    <MuiTableCell>
                      {quote.price
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: quote.currency || 'USD',
                          }).format(quote.price)
                        : 'N/A'}
                    </MuiTableCell>
                    <MuiTableCell>
                      <Chip
                        label={quote.status || 'pending'}
                        size="small"
                        color={
                          quote.status === 'accepted'
                            ? 'success'
                            : quote.status === 'rejected'
                            ? 'error'
                            : 'primary'
                        }
                        variant="outlined"
                      />
                    </MuiTableCell>
                    <MuiTableCell>
                      {quote.createdAt?.toDate
                        ? new Date(quote.createdAt.toDate()).toLocaleDateString()
                        : 'N/A'}
                    </MuiTableCell>
                  </MuiTableRow>
                ))}
              </MuiTableBody>
            </MuiTable>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
}
