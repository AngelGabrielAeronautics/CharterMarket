import React from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography,
  useTheme
} from '@mui/material';

export interface InvoiceItem {
  date: string;
  description: string;
  vat: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  currency?: string;
}

export default function InvoiceItemsTable({ items, currency = 'USD' }: InvoiceItemsTableProps) {
  const theme = useTheme();
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5' }}>
            <TableCell width="15%">
              <Typography variant="subtitle2" fontWeight={600}>Date</Typography>
            </TableCell>
            <TableCell width="45%">
              <Typography variant="subtitle2" fontWeight={600}>Description</Typography>
            </TableCell>
            <TableCell width="15%" align="center">
              <Typography variant="subtitle2" fontWeight={600}>VAT</Typography>
            </TableCell>
            <TableCell width="25%" align="right">
              <Typography variant="subtitle2" fontWeight={600}>Amount</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={index}
              sx={{ 
                '&:nth-of-type(odd)': { 
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' 
                },
                '@media print': {
                  '&:nth-of-type(odd)': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.02)' 
                  }
                }
              }}
            >
              <TableCell>
                <Typography variant="body2">{item.date}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{item.description}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">{item.vat}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(item.amount)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
} 