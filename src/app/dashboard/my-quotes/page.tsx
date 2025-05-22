'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorSubmittedQuotes } from '@/hooks/useFlights';
import { Offer, OfferStatus } from '@/types/flight';
import { format } from 'date-fns';
import {
  Chip,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import { EyeIcon } from 'lucide-react'; // Or a suitable MUI icon
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MySubmittedOffersPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.userCode) {
      setLoading(false);
      setQuotes([]);
      return;
    }

    setLoading(true);
    setError(null);
    let unsubscribe: () => void;
    let q;

    switch (user.role) {
      case 'passenger':
      case 'agent': {
        q = query(
          collection(db, 'quotes'),
          where('clientUserCode', '==', user.userCode),
          orderBy('createdAt', 'desc')
        );
        break;
      }
      case 'operator': {
        q = query(
          collection(db, 'offers'),
          where('operatorUserCode', '==', user.userCode),
          orderBy('createdAt', 'desc')
        );
        break;
      }
      case 'admin':
      case 'superAdmin': {
        q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
        break;
      }
      default: {
        console.warn('Unexpected user role for quotes:', user.role);
        setLoading(false);
        setQuotes([]);
        return;
      }
    }

    if (q) {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Map Firestore snapshots to Offer objects
          const fetchedQuotes: Offer[] = snapshot.docs.map((doc) => {
            const data = doc.data() as any;
            return {
              offerId: doc.id,
              operatorId: data.operatorUserCode || data.operatorId,
              price: data.price,
              commission: data.commission,
              totalPrice: data.totalPrice,
              offerStatus: data.offerStatus,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            };
          });
          setQuotes(fetchedQuotes);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching quotes:', err);
          setError(err.message || 'Failed to fetch quotes');
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
      setQuotes([]);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const getStatusChip = (status: OfferStatus) => {
    switch (status) {
      case 'pending-client-acceptance':
        return <Chip label="Pending Client Acceptance" color="warning" size="small" />;
      case 'accepted-by-client':
        return <Chip label="Accepted by Client" color="success" size="small" />;
      case 'rejected-by-client':
        return <Chip label="Rejected by Client" color="error" size="small" />;
      case 'expired':
        return <Chip label="Expired" color="default" size="small" />;
      case 'awaiting-acknowledgement':
        return <Chip label="Awaiting Acknowledgement" color="info" size="small" />;
      default: {
        // Fallback label by converting status to string
        const label = status
          ? String(status)
              .replace(/-/g, ' ')
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          : 'Unknown';
        return <Chip label={label} size="small" />;
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading your quotes...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, color: 'red' }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="container mx-auto px-4 py-8" sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        {user?.role === 'operator' ? 'My Submitted Offers' : 'My Quotes'}
      </Typography>

      {quotes.length === 0 ? (
        <Typography>
          You do not have any {user?.role === 'operator' ? 'submitted offers' : 'quotes'} yet.
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {quotes.map((q) => {
            const requestId =
              (q as any).requestId || (q as any).quoteRequestId || 'unknown-request';
            const displayPrice = user?.role === 'operator' ? q.price : q.totalPrice;
            return (
              <Paper
                key={q.offerId || (q as any).id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Link
                  href={`/dashboard/quotes/${requestId}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {user?.role === 'operator' ? 'Offer ' : 'Quote '}{' '}
                        {q.offerId || (q as any).id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(
                          (q.createdAt as any).toDate
                            ? (q.createdAt as any).toDate()
                            : new Date((q.createdAt as any).seconds * 1000),
                          'dd MMM yyyy'
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Request:</strong> {requestId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Price:</strong> ${displayPrice?.toFixed(2)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>{getStatusChip(q.offerStatus)}</Box>
                    </Box>
                  </Box>
                </Link>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
