'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Banner from '@/components/ui/Banner';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import { UserProfile } from '@/types/user';

interface OperatorOnboardingBannerProps {
  profile: UserProfile;
  isEmailVerified: boolean;
}

const steps = [
  'Verify your email',
  'Complete your profile',
  'Add your first aircraft'
] as const;

export default function OperatorOnboardingBanner({ profile, isEmailVerified }: OperatorOnboardingBannerProps) {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);

  if (!showBanner || profile.status === 'active') return null;

  // Calculate active step
  let activeStep = 0;
  if (isEmailVerified) {
    activeStep = 1;
    if (profile.isProfileComplete) {
      activeStep = 2;
      if (profile.hasAircraft) {
        return null; // All steps completed, don't show banner
      }
    }
  }

  const handleAction = () => {
    switch (activeStep) {
      case 0:
        // Email verification is handled by EmailVerificationBanner
        break;
      case 1:
        router.push('/operator/profile');
        break;
      case 2:
        router.push('/operator/aircraft/new');
        break;
    }
  };

  const getActionLabel = (): string => {
    switch (activeStep) {
      case 0:
        return 'CHECK YOUR EMAIL';
      case 1:
        return 'COMPLETE PROFILE';
      case 2:
        return 'ADD AIRCRAFT';
      default:
        return 'CONTINUE REGISTRATION';
    }
  };

  return (
    <Banner
      variant="info"
      onDismiss={() => setShowBanner(false)}
      action={{
        label: getActionLabel(),
        onClick: handleAction
      }}
    >
      <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
        <Typography variant="h6" component="div" sx={{ mb: 2, fontWeight: 600 }}>
          You're just {3 - activeStep} steps away from plugging into the Charter Market
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Banner>
  );
} 