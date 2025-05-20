'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorSubmittedQuotes } from '@/hooks/useFlights';
import { Offer, OfferStatus } from '@/types/flight';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Chip,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import { EyeIcon } from 'lucide-react'; // Or a suitable MUI icon
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

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
    let unsubscribe;
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
          const fetchedQuotes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Offer[];
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
        const label = status
          ? status
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
    <div className="container mx-auto px-4 py-8">
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        {user?.role === 'operator' ? 'My Submitted Offers' : 'My Quotes'}
      </Typography>

      {quotes.length === 0 ? (
        <Typography>
          You do not have any {user?.role === 'operator' ? 'submitted offers' : 'quotes'} yet.
        </Typography>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{user?.role === 'operator' ? 'Offer ID' : 'Quote ID'}</TableHead>
                <TableHead>Original Request ID</TableHead>
                <TableHead>
                  {user?.role === 'operator' ? 'Offered Price' : 'Quoted Price'}
                </TableHead>
                {user?.role === 'operator' && <TableHead>Total Price (incl. comm.)</TableHead>}
                <TableHead>Date {user?.role === 'operator' ? 'Submitted' : 'Received'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => {
                const requestIdForLink =
                  (quote as any).requestId || (quote as any).quoteRequestId || 'unknown-request';
                const displayPrice = user?.role === 'operator' ? quote.price : quote.totalPrice;
                return (
                  <TableRow key={quote.offerId || (quote as any).id}>
                    <TableCell>{quote.offerId || (quote as any).id}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/quotes/${requestIdForLink}`} passHref>
                        <Typography
                          component="a"
                          color="primary"
                          sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          {requestIdForLink !== 'unknown-request' ? requestIdForLink : 'N/A'}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>${displayPrice?.toFixed(2)}</TableCell>
                    {user?.role === 'operator' && (
                      <TableCell>${quote.totalPrice.toFixed(2)}</TableCell>
                    )}
                    <TableCell>{format(quote.createdAt.toDate(), 'dd MMM yyyy, HH:mm')}</TableCell>
                    <TableCell>{getStatusChip(quote.offerStatus)}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <Link href={`/dashboard/quotes/${requestIdForLink}`} passHref>
                          <IconButton component="a" size="small">
                            <EyeIcon className="h-5 w-5" />
                          </IconButton>
                        </Link>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
