import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

export interface PageLayoutProps {
  /** Main heading for the page */
  title: string;
  /** Optional short description shown under the title */
  subtitle?: string;
  /** Optional leading icon displayed left of the title */
  icon?: React.ReactNode;
  /** Right-aligned actions such as buttons, search fields, etc. */
  actions?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Optional additional Box sx styles for the outer container */
  sx?: SxProps<Theme>;
}

/**
 * PageLayout – a simple, opinionated wrapper that provides:
 * 1. Consistent max-width container with responsive padding
 * 2. Flexible header area supporting icon, title, subtitle and right-aligned actions
 * 3. Space below the header for arbitrary page content
 *
 * Usage:
 * ```tsx
 * <PageLayout
 *   title="My Invoices"
 *   actions={<Button>Refresh</Button>}
 * >
 *   ...page content...
 * </PageLayout>
 * ```
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  sx,
}) => {
  return (
    <Box className="container mx-auto px-4 py-8" sx={sx}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: subtitle ? 'flex-start' : 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>          
          {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{actions}</Box>}
      </Box>
      {children}
    </Box>
  );
};

export default PageLayout; 