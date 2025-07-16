"use client";

import React, { useMemo } from 'react';
import { Stepper, Step, StepLabel, Box, StepIconProps } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import FlightIcon from '@mui/icons-material/Flight';

interface StepConfig {
  label: string;
  href: string;
}

const steps: StepConfig[] = [
  { label: "Quote Requests", href: "/dashboard/quotes/request" },
  { label: "Quotes", href: "/dashboard/quotes" },
  { label: "Bookings", href: "/dashboard/bookings" },
  { label: "Invoices & Payments", href: "/dashboard/invoices" },
  { label: "Flights", href: "/dashboard/flights" },
];

// Custom StepIcon component
const CustomStepIcon: React.FC<StepIconProps> = (props) => {
  const { active, completed, icon } = props;

  // Show plane icon for step 5 (Flights)
  if (icon === 5) {
    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: active || completed ? 'primary.main' : 'grey.300',
          color: active || completed ? 'primary.contrastText' : 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FlightIcon sx={{ fontSize: '1.25rem', transform: 'rotate(90deg)' }} />
      </Box>
    );
  }

  // Default numbered icon for other steps
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: active || completed ? 'primary.main' : 'grey.300',
        color: active || completed ? 'primary.contrastText' : 'text.secondary',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}
    >
      {icon}
    </Box>
  );
};

const ProgressNav: React.FC<{ sx?: any }> = ({ sx }) => {
  const pathname = usePathname();
  const router = useRouter();

  const activeStep = useMemo(() => {
    const idx = steps.findIndex((step) => pathname.startsWith(step.href));
    return idx === -1 ? 0 : idx;
  }, [pathname]);

  const handleStepClick = (href: string) => {
    router.push(href);
  };

  return (
    <Box sx={{ width: "100%", overflowX: "hidden", ...sx }}>
      <Stepper 
        alternativeLabel 
        activeStep={activeStep} 
        sx={{ width: '100%' }}
      >
        {steps.map((step, index) => (
          <Step key={step.label} completed={false}>
            <Box
              onClick={() => handleStepClick(step.href)}
              sx={{
                cursor: 'pointer',
                width: '100%',
                '&:hover': {
                  opacity: 0.7,
                },
              }}
            >
              <StepLabel
                StepIconComponent={CustomStepIcon}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: 500,
                    cursor: 'pointer',
                  },
                  '& .MuiStepIcon-root': {
                    cursor: 'pointer',
                  },
                  cursor: 'pointer',
                }}
              >
                {step.label}
              </StepLabel>
            </Box>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default ProgressNav; 