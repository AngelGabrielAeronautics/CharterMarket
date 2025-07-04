import { Box, Typography, useTheme } from '@mui/material';

export interface PartyInfo {
  label: string;
  name: string;
  addressLines: string[];
}

export interface InvoiceToProps {
  billedTo: PartyInfo;
  from: PartyInfo;
}

export default function InvoiceTo({ billedTo, from }: InvoiceToProps) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Typography variant="h6" gutterBottom>{billedTo.label}</Typography>
        <Typography variant="body2" fontWeight="bold">{billedTo.name}</Typography>
        {billedTo.addressLines.map((line, i) => (
          <Typography key={i} variant="body2">{line}</Typography>
        ))}
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="h6" gutterBottom>{from.label}</Typography>
        <Typography variant="body2" fontWeight="bold">{from.name}</Typography>
        {from.addressLines.map((line, i) => (
          <Typography key={i} variant="body2">{line}</Typography>
        ))}
      </Box>
    </Box>
  );
} 