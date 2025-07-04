import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

interface InvoicePaymentDetailsProps {
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string;
  branchCode?: string;
  reference: string;
  notes?: string;
}

const InvoicePaymentDetails: React.FC<InvoicePaymentDetailsProps> = ({
  bankName,
  accountNumber,
  accountName,
  swiftCode,
  branchCode,
  reference,
  notes
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mt: 3, 
        p: 3, 
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        backgroundColor: '#f9f9f9',
        '@media print': {
          boxShadow: 'none',
          border: '1px solid #e0e0e0'
        }
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1A2B3C' }}>
        Payment Details
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>Bank Name:</Typography>
          <Typography variant="body2">{bankName}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>Account Name:</Typography>
          <Typography variant="body2">{accountName}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>Account Number:</Typography>
          <Typography variant="body2">{accountNumber}</Typography>
        </Box>
        
        {swiftCode && (
          <Box sx={{ display: 'flex' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>SWIFT Code:</Typography>
            <Typography variant="body2">{swiftCode}</Typography>
          </Box>
        )}
        
        {branchCode && (
          <Box sx={{ display: 'flex' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>Branch Code:</Typography>
            <Typography variant="body2">{branchCode}</Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>Payment Reference:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{reference}</Typography>
        </Box>
      </Box>
      
      {notes && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {notes}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default InvoicePaymentDetails; 