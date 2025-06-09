'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoiceDetail } from '@/hooks/useBookings'; // Assuming useInvoiceDetail is in useBookings.ts
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Box, Typography, Paper, CircularProgress, Alert, Grid, Divider } from '@mui/material';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const invoiceId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { invoice, loading, error } = useInvoiceDetail(invoiceId);

  // helper
  const toJsDate = (value: any): Date => {
    if (!value) return new Date();
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
      return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
    }
    if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
      return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
    }
    return new Date(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4, height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading invoice details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <Typography gutterBottom>Error loading invoice: {error}</Typography>
          <Button variant="outlined" onClick={() => router.back()} sx={{ mr: 1 }}>
            Go Back
          </Button>
          <Button variant="outlined" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          <Typography gutterBottom>Invoice not found.</Typography>
          <Button variant="outlined" onClick={() => router.back()} sx={{ mr: 1 }}>
            Go Back
          </Button>
          <Button variant="outlined" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </Alert>
      </Box>
    );
  }

  // Placeholder for actual client and operator details - these would need to be fetched separately if required
  const clientName = 'Client Name Placeholder';
  const clientAddress = '123 Client St, Client City, CL 12345';
  const operatorName = 'Operator Name Placeholder';
  const operatorAddress = '456 Operator Rd, Operator City, OP 67890';

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: { xs: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Invoice
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography variant="h6">Billed To:</Typography>
            <Typography>{clientName}</Typography>
            <Typography>{clientAddress}</Typography>
            {/* <Typography>Client Email: {invoice.clientEmail} (if available on invoice model)</Typography> */}
          </Grid>
          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid sx={{ textAlign: 'right' }} size={6}>
            <Typography variant="h6">From:</Typography>
            <Typography>{operatorName}</Typography>
            <Typography>{operatorAddress}</Typography>
            {/* <Typography>Operator Contact: {invoice.operatorContact} (if available) </Typography> */}
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{ mb: 3 }}>
          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography>
              <strong>Invoice ID:</strong>
            </Typography>
          </Grid>
          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography sx={{ textAlign: 'right' }}>{invoice.invoiceId}</Typography>
          </Grid>

          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography>
              <strong>Booking ID:</strong>
            </Typography>
          </Grid>
          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography sx={{ textAlign: 'right' }}>{invoice.bookingId}</Typography>
          </Grid>

          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography>
              <strong>Date Issued:</strong>
            </Typography>
          </Grid>
          {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
          <Grid size={6}>
            <Typography sx={{ textAlign: 'right' }}>
              {format(toJsDate(invoice.createdAt), 'dd MMM yyyy')}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Invoice Items - Simple for now, can be expanded */}
        <Typography variant="h6" sx={{ mb: 1 }}>
          Description
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>Private Jet Charter Services (Booking: {invoice.bookingId})</Typography>
          <Typography>${invoice.amount.toFixed(2)}</Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Typography variant="h5" component="p">
            Total Amount: ${invoice.amount.toFixed(2)}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Payment due upon receipt. Thank you for your business!
        </Typography>
      </Paper>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={() => router.back()}>
          Back to Booking
        </Button>
        {/* <Button variant="contained">Download PDF</Button> */}
      </Box>
    </Box>
  );
}
