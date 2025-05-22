import Link from 'next/link';
import { Box, Typography, Button, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Charter',
  description: 'The page you are looking for does not exist on Charter.',
};

export default function NotFoundPage() {
  return (
    <Container
      maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        gutterBottom
        sx={{ fontSize: '6rem', fontWeight: 'bold' }}
      >
        404
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Sorry, we couldn't find the page you're looking for.
      </Typography>
      <Button
        component={Link}
        href="/"
        variant="contained"
        color="primary"
        startIcon={<HomeIcon />}
        size="large"
      >
        Go to Homepage
      </Button>
    </Container>
  );
}
