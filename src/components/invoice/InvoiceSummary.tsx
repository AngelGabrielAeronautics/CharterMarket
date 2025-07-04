import { Box, Typography, useTheme } from '@mui/material';

export interface InvoiceSummaryProps {
  subtotal: number;
  vatTotal: number;
  total: number;
  balanceDue: number;
  currency: string;
}

export default function InvoiceSummary({ subtotal, vatTotal, total, balanceDue, currency }: InvoiceSummaryProps) {
  const theme = useTheme();
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        maxWidth: 400,
        ml: 'auto',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          rowGap: theme.spacing(1),
          columnGap: theme.spacing(2),
        }}
      >
        <Typography component="dt" variant="body2">Subtotal</Typography>
        <Typography component="dd" variant="body2" fontWeight="bold">
          {formatter.format(subtotal)}
        </Typography>
        <Typography component="dt" variant="body2">VAT Total</Typography>
        <Typography component="dd" variant="body2" fontWeight="bold">
          {formatter.format(vatTotal)}
        </Typography>
        <Typography component="dt" variant="body2">Total</Typography>
        <Typography component="dd" variant="body2" fontWeight="bold">
          {formatter.format(total)}
        </Typography>
        <Typography component="dt" variant="body2">Balance Due</Typography>
        <Typography component="dd" variant="body2" fontWeight="bold">
          {formatter.format(balanceDue)}
        </Typography>
      </Box>
    </Box>
  );
} 