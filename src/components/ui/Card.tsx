// @ts-nocheck
import React from 'react';
import { Card as MuiCard, CardProps as MuiCardProps, CardContent } from '@mui/material';

interface CardProps extends MuiCardProps {
  children: React.ReactNode;
}

export function Card({ children, ...props }: CardProps) {
  return (
    <MuiCard
      variant="outlined"
      sx={(theme) => ({
        borderRadius: 2,
        boxShadow: 1,
        backgroundColor: theme.palette.mode === 'dark'
          ? theme.palette.primary.main
          : theme.palette.background.paper,
        color: theme.palette.mode === 'dark'
          ? theme.palette.primary.contrastText
          : undefined,
        ...props.sx,
      })}
      {...props}
    >
      <CardContent>
        {children}
      </CardContent>
    </MuiCard>
  );
} 