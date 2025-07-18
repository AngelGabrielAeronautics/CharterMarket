import React from 'react';
import { Box, Container, Typography, Card, CardContent, Button } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

const sections = [
  {
    title: '1. Complete Company Profile',
    desc:
      'In Dashboard → Company Profile upload your AOC and insurance documents, add contact numbers and brand assets. A complete profile builds trust and is required before receiving payments.',
    img: '/images/login/login_modal.png',
    url: '/dashboard/company-profile',
  },
  {
    title: '2. Add Your Aircraft',
    desc:
      'Go to Dashboard → Aircraft then click “Add Aircraft”. Complete the form: tail-number, model, seating, range, hourly rate and upload high-quality photos to boost conversions.',
    img: '/images/mobile/52b99030575717.562913b828865.webp',
    url: '/dashboard/aircraft',
  },
  {
    title: '3. Respond to Quote Requests',
    desc:
      'Navigate to Dashboard → Quotes. New requests are highlighted. Click a request to review the itinerary and submit your offer. You can attach notes and set validity dates.',
    img: '/images/misc/submit.png',
    url: '/dashboard/quotes',
  },
];

export default function GuidePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" gutterBottom textAlign="center">
        Operator Setup Guide
      </Typography>
      <Typography variant="subtitle1" textAlign="center" sx={{ mb: 6 }}>
        Follow these three steps to start winning charter business on the platform.
      </Typography>

      {sections.map((sec) => (
        <Card key={sec.title} elevation={3} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 4 }}>
          <Box sx={{ flex: 1, position: 'relative', minHeight: 220 }}>
            <Image
              src={sec.img}
              alt={sec.title}
              fill
              style={{ objectFit: 'cover', borderRadius: '4px 0 0 4px' }}
              sizes="(max-width: 600px) 100vw, 300px"
            />
          </Box>
          <CardContent sx={{ flex: 2 }}>
            <Typography variant="h5" gutterBottom>
              {sec.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{sec.desc}</Typography>
            <Link href={sec.url} passHref legacyBehavior>
              <Button component="a" variant="outlined" size="small">
                Take me there
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
} 