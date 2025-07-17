'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoiceDetail } from '@/hooks/useBookings'; // Assuming useInvoiceDetail is in useBookings.ts
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Box, Typography, Paper, CircularProgress, Alert, Divider } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import InvoiceHeader from '@/components/invoice/InvoiceHeader';
import InvoiceTo from '@/components/invoice/InvoiceTo';
import InvoiceItemsTable from '@/components/invoice/InvoiceItemsTable';
import InvoiceSummary from '@/components/invoice/InvoiceSummary';
import InvoicePaymentDetails from '@/components/invoice/InvoicePaymentDetails';
import ShareInvoiceModal from '@/components/invoice/ShareInvoiceModal';
import { Invoice } from '@/types/invoice';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Extended invoice type with optional additional fields we might need
interface ExtendedInvoice extends Invoice {
  // Client and operator details that might be fetched separately
  clientName?: string;
  clientAddress?: string;
  operatorName?: string;
  operatorAddress?: string;
  
  // Additional financial details
  vatExempt?: boolean;
  vatRate?: number;
  vatAmount?: number;
  totalAmount?: number;
  
  // Banking details
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  branchCode?: string;
  terms?: string;
}

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const invoiceId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Cast the invoice to our extended type
  const { invoice: baseInvoice, loading, error } = useInvoiceDetail(invoiceId);
  const invoice = baseInvoice as ExtendedInvoice | undefined;

  // Helper function to convert Firebase timestamp to JS Date
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

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle download functionality - convert to PDF
  const handleDownload = async () => {
    if (!invoiceRef.current || !invoice) return;

    try {
      // Show loading state
      const loadingElement = document.createElement('div');
      loadingElement.style.position = 'fixed';
      loadingElement.style.top = '0';
      loadingElement.style.left = '0';
      loadingElement.style.width = '100%';
      loadingElement.style.height = '100%';
      loadingElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      loadingElement.style.display = 'flex';
      loadingElement.style.justifyContent = 'center';
      loadingElement.style.alignItems = 'center';
      loadingElement.style.zIndex = '9999';
      loadingElement.innerHTML = '<div>Generating PDF...</div>';
      document.body.appendChild(loadingElement);

      // Hide action buttons during capture
      const actionButtons = document.querySelector('.no-print');
      if (actionButtons) {
        actionButtons.classList.add('hidden-temp');
      }

      // Generate canvas from the invoice element
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      // Restore action buttons visibility
      if (actionButtons) {
        actionButtons.classList.remove('hidden-temp');
      }

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${invoice.invoiceId}.pdf`);

      // Remove loading element
      document.body.removeChild(loadingElement);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${invoice?.invoiceId}`,
          text: `Invoice #${invoice?.invoiceId} for ${invoice?.amount} ${invoice?.currency}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // If Web Share API fails, open our custom modal
        setShareModalOpen(true);
      }
    } else {
      // Fallback to our custom share modal
      setShareModalOpen(true);
    }
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

  // Default values for client and operator details
  const clientName = invoice.clientName || 'Client Name';
  const clientAddress = invoice.clientAddress || '123 Client St, Client City, CL 12345';
  const operatorName = invoice.operatorName || 'Charter Aviation Ltd';
  const operatorAddress = invoice.operatorAddress || '456 Operator Rd, Operator City, OP 67890';
  const dueDate = invoice.dueDate ? toJsDate(invoice.dueDate) : toJsDate(invoice.createdAt);

  return (
    <Box className="invoice-container" sx={{ maxWidth: 800, margin: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Action buttons - these will be hidden when printing */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }} className="no-print">
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />} 
          onClick={handleDownload}
        >
          Download PDF
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<ShareIcon />} 
          onClick={handleShare}
        >
          Share
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }} ref={invoiceRef}>
        {/* Invoice header with company & metadata */}
        <InvoiceHeader
          company={{
            name: operatorName,
            addressLines: operatorAddress.split(', '),
            logoUrl: '/branding/logos/dark/charter-logo-light-mode.png',
          }}
          invoice={{
            number: invoice.invoiceId,
            date: format(toJsDate(invoice.createdAt), 'dd MMM yyyy'),
            dueDate: format(dueDate, 'dd MMM yyyy'),
            terms: invoice.terms || 'Due on receipt',
          }}
        />

        {/* Billing & Operator Info */}
        <InvoiceTo
          billedTo={{ 
            label: 'Billed To:', 
            name: clientName, 
            addressLines: clientAddress.split(', ') 
          }}
          from={{ 
            label: 'From:', 
            name: operatorName, 
            addressLines: operatorAddress.split(', ') 
          }}
        />

        <Divider sx={{ my: 3 }} />

        {/* Invoice items table */}
        <InvoiceItemsTable
          items={[
            {
              date: format(toJsDate(invoice.createdAt), 'dd MMM yyyy'),
              description: invoice.description || `Charter Flight: ${invoice.bookingId}`,
              vat: invoice.vatExempt ? 'Exempt' : `${invoice.vatRate || 0}%`,
              amount: invoice.amount,
            },
            // Add any additional line items here if needed
          ]}
        />

        {/* Summary totals */}
        <InvoiceSummary
          subtotal={invoice.amount}
          vatTotal={invoice.vatAmount || 0}
          total={invoice.totalAmount || invoice.amount}
          balanceDue={invoice.amountPending}
          currency={invoice.currency}
        />

        {/* Payment instructions block */}
        <InvoicePaymentDetails
          bankName={invoice.bankName || 'Standard Bank'}
          accountName={invoice.accountName || 'Charter Aviation Ltd'}
          accountNumber={invoice.accountNumber || '123456789'}
          swiftCode={invoice.swiftCode}
          branchCode={invoice.branchCode}
          reference={`Invoice #${invoice.invoiceId}`}
          instructions={[
            'Please email proof of payment to accounts@charter.com',
            'Please use your invoice number as payment reference',
            'Payment due within 7 days of invoice date',
          ]}
        />
      </Paper>

      {/* Navigation buttons - these will be hidden when printing */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        <Button variant="outlined" onClick={() => router.back()}>
          Back
        </Button>
        <Button variant="outlined" onClick={() => router.push('/dashboard/invoices')}>
                          All Invoices & Payments
        </Button>
      </Box>

      {/* Share Invoice Modal */}
      {invoice && (
        <ShareInvoiceModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          invoiceId={invoice.invoiceId}
          invoiceAmount={invoice.amount}
          currency={invoice.currency}
        />
      )}
    </Box>
  );
}
