import React from 'react';
import { Box, Typography, Paper, Divider, useTheme } from '@mui/material';

export interface InvoicePaymentDetailsProps {
  instructions?: string[];
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  swiftCode?: string;
  branchCode?: string;
  reference?: string;
  notes?: string;
}

export default function InvoicePaymentDetails({
  instructions = [],
  bankName = 'Standard Bank',
  accountNumber = '123456789',
  accountName = 'Charter Aviation Ltd',
  swiftCode,
  branchCode,
  reference = 'Invoice Number',
  notes
}: InvoicePaymentDetailsProps) {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mt: 3, 
        p: 3, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9f9f9',
        '@media print': {
          boxShadow: 'none',
          border: '1px solid #e0e0e0'
        }
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
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
        
        {reference && (
          <Box sx={{ display: 'flex' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, width: 140 }}>Payment Reference:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{reference}</Typography>
          </Box>
        )}
      </Box>
      
      {instructions && instructions.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Instructions:</Typography>
          {instructions.map((line, idx) => (
            <Typography key={idx} variant="body2" sx={{ mb: idx < instructions.length - 1 ? 0.5 : 0 }}>
              • {line}
            </Typography>
          ))}
        </Box>
      )}
      
      {notes && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {notes}
          </Typography>
        </Box>
      )}
    </Paper>
  );
} 