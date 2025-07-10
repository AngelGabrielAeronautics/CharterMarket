"use client";

import React, { useMemo } from 'react';
import { Stepper, Step, StepLabel, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

interface StepConfig {
  label: string;
  href: string;
}

const steps: StepConfig[] = [
  { label: "Quote Requests", href: "/dashboard/quotes/request" },
  { label: "Quotes", href: "/dashboard/quotes" },
  { label: "Bookings", href: "/dashboard/bookings" },
  { label: "Invoices", href: "/dashboard/invoices" },
  { label: "Flights", href: "/dashboard/flights" },
];

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
      <Stepper alternativeLabel activeStep={activeStep} sx={{ width: '100%' }}>
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