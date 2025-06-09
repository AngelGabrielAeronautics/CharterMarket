import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Charter',
  description: 'The page you are looking for does not exist on Charter.',
};

export default function NotFound() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" gutterBottom>
        The page you are looking for does not exist.
      </Typography>
      <Button component={Link} href="/" variant="contained">
        Go Home
      </Button>
    </Box>
  );
}
