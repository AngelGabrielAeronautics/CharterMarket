'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useClientInvoices } from '@/hooks/useBookings';
import { Invoice } from '@/types/invoice';
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
  Alert,
  Button as MuiButton,
  Tooltip,
  IconButton,
  Paper,
  Container,
} from '@mui/material';
import { EyeIcon, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

// Helper to parse Firestore Timestamp, raw JSON object, or ISO string into JS Date
const toJsDate = (value: any): Date => {
  if (!value) return new Date(); // Or handle as an error/invalid date
  // Firestore Timestamp instance
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  // Raw Firestore JSON format: { seconds: number, nanoseconds: number }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  // Fallback for SDK v8 legacy JSON: { _seconds, _nanoseconds }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  // ISO string or timestamp number
  return new Date(value);
};

export default function ClientInvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  // Use user.userCode as clientId, assuming userCode is the correct identifier for clients
  const { invoices, loading, error } = useClientInvoices(user?.userCode);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Invoices
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage and track your flight invoices
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="outlined" startIcon={<RefreshCw />} onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && invoices.length === 0 ? (
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
            No invoices found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your invoices will appear here when generated
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={1} sx={{ overflow: 'hidden', borderRadius: 1 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link href={`/dashboard/invoices/${invoice.id}`} passHref>
                      <Typography
                        color="primary"
                        sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {invoice.invoiceId}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.bookingId}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(toJsDate(invoice.createdAt), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell>
                    <Tooltip title="View Invoice Details">
                      <Link href={`/dashboard/invoices/${invoice.id}`} passHref>
                        <IconButton size="small" color="primary">
                          <EyeIcon className="h-5 w-5" />
                        </IconButton>
                      </Link>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
