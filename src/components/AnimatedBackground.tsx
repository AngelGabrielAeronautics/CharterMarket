'use client';

import React from 'react';
import { Box, keyframes } from '@mui/material';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const dotsAnimation = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 100px 100px; }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
`;

export default function AnimatedBackground({ children }: { children?: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: 'relative',
        background: 'linear-gradient(-45deg, #0b3746, #0f4657, #0b3746, #0d3e4f)',
        backgroundSize: '400% 400%',
        animation: `${gradientAnimation} 15s ease infinite`,
        height: '100%',
        width: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(249, 239, 228, 0.15) 1%, transparent 1%),
            radial-gradient(circle at 75% 75%, rgba(249, 239, 228, 0.15) 1%, transparent 1%)
          `,
          backgroundSize: '100px 100px',
          opacity: 0.5,
          animation: `${dotsAnimation} 10s linear infinite`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(11, 55, 70, 0.6) 100%)',
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            background: 'rgba(249, 239, 228, 0.08)',
            border: '1px solid rgba(249, 239, 228, 0.1)',
            borderRadius: '50%',
            animation: `${floatAnimation} 8s infinite`,
            width: '150px',
            height: '150px',
            top: '-75px',
            left: '-75px'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            background: 'rgba(249, 239, 228, 0.08)',
            border: '1px solid rgba(249, 239, 228, 0.1)',
            borderRadius: '50%',
            animation: `${floatAnimation} 8s infinite`,
            animationDelay: '-2s',
            width: '200px',
            height: '200px',
            top: '50%',
            right: '-100px'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            background: 'rgba(249, 239, 228, 0.08)',
            border: '1px solid rgba(249, 239, 228, 0.1)',
            borderRadius: '50%',
            animation: `${floatAnimation} 8s infinite`,
            animationDelay: '-4s',
            width: '100px',
            height: '100px',
            bottom: '-50px',
            left: '30%'
          }}
        />
      </Box>
      {children}
    </Box>
  );
} 