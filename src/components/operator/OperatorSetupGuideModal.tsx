import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Link from 'next/link';

interface Props {
  open: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

const steps = [
  {
    label: 'Complete Company Profile',
    description:
      'In Dashboard → Company Profile upload your AOC certificate, contact info and branding so clients recognise you.',
    image: '/images/login/login_modal.png',
    url: '/dashboard/company-profile',
  },
  {
    label: 'Add Your Aircraft',
    description:
      'Go to Dashboard → Aircraft and click “Add Aircraft”. Fill in details and upload photos so clients can see your fleet.',
    image: '/images/mobile/52b99030575717.562913b828865.webp',
    url: '/dashboard/aircraft',
  },
  {
    label: 'Respond to Quote Requests',
    description:
      'Navigate to Dashboard → Quotes to view new requests. Click a request to review details and submit your offer.',
    image: '/images/misc/submit.png', // placeholder screenshot
    url: '/dashboard/quotes',
  },
];

export default function OperatorSetupGuideModal({ open, onClose, onDontShowAgain }: Props) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    if (!open) setActiveStep(0);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Getting Started with Charter</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {steps[activeStep].label}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {steps[activeStep].description}
          </Typography>
          <Link href={steps[activeStep].url} passHref legacyBehavior>
            <Button component="a" variant="outlined" size="small" sx={{ mb: 2 }}>
              Take me there
            </Button>
          </Link>
          <Box
            component="img"
            src={steps[activeStep].image}
            alt={steps[activeStep].label}
            sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 1, boxShadow: 3 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Link href="/dashboard/guide" passHref legacyBehavior>
            <Button component="a" variant="contained">
              Open Full Guide
            </Button>
          </Link>
        )}
        <Button onClick={onDontShowAgain} color="inherit">
          Don’t show again
        </Button>
      </DialogActions>
    </Dialog>
  );
} 