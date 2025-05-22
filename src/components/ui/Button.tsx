// @ts-nocheck
'use client';

import React, { forwardRef } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import Link from 'next/link';

export interface ButtonProps extends Omit<MuiButtonProps, 'href'> {
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'contained', size = 'medium', href, component, children, ...props }, ref) => {
    // If no custom component override and href is provided, wrap in Next.js Link to avoid nested anchors
    if (href && !component) {
      return (
        // Use MUI Button with Next Link as its underlying component to avoid nested <a> tags
        // @ts-ignore Suppress MUI Button overload error with Next.js Link
        <MuiButton
          component={Link}
          href={href}
          variant={variant}
          size={size}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className="no-underline"
          {...props}
        >
          {children}
        </MuiButton>
      );
    }

    // Otherwise, render using the custom component (e.g., Next.js Link) or default button
    return (
      <MuiButton
        variant={variant}
        size={size}
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        component={component}
        href={href}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// Stub for buttonVariants to support Calendar component
export function buttonVariants(_options: { variant?: string; size?: string }) {
  return '';
}
