// Create new InvoiceHeader component
export interface CompanyInfo {
  name: string;
  addressLines: string[];
  vat?: string;
  logoUrl: string;
}

export interface InvoiceInfo {
  number: string;
  date: string;
  dueDate?: string;
  terms?: string;
}

export interface InvoiceHeaderProps {
  company: CompanyInfo;
  invoice: InvoiceInfo;
}

import Image from 'next/image';
import { Box, Typography, useTheme } from '@mui/material';

export default function InvoiceHeader({ company, invoice }: InvoiceHeaderProps) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '50px' }}>
          <Image 
            src={company.logoUrl} 
            alt={`${company.name} logo`} 
            width={150} 
            height={0} 
            sizes="150px"
            style={{
              width: 'auto',
              height: '100%',
              maxHeight: '50px',
              objectFit: 'contain'
            }} 
          />
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">{company.name}</Typography>
          {company.addressLines.map((line, i) => (
            <Typography key={i} variant="body2">{line}</Typography>
          ))}
          {company.vat && (
            <Typography variant="body2">VAT Reg No.: {company.vat}</Typography>
          )}
        </Box>
      </Box>
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'max-content auto',
          justifyContent: 'end',
          rowGap: theme.spacing(1),
        }}
      >
        <Typography component="dt" variant="body2" fontWeight="medium">Invoice No.:</Typography>
        <Typography component="dd" variant="body2" fontWeight="bold">{invoice.number}</Typography>
        <Typography component="dt" variant="body2" fontWeight="medium">Date:</Typography>
        <Typography component="dd" variant="body2" fontWeight="bold">{invoice.date}</Typography>
        {invoice.dueDate && (
          <>
            <Typography component="dt" variant="body2" fontWeight="medium">Due Date:</Typography>
            <Typography component="dd" variant="body2" fontWeight="bold">{invoice.dueDate}</Typography>
          </>
        )}
        {invoice.terms && (
          <>
            <Typography component="dt" variant="body2" fontWeight="medium">Terms:</Typography>
            <Typography component="dd" variant="body2" fontWeight="bold">{invoice.terms}</Typography>
          </>
        )}
      </Box>
    </Box>
  );
} 