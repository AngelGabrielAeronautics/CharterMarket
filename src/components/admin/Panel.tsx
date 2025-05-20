import React, { ReactNode } from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';

interface PanelProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  fullWidth?: boolean;
  minHeight?: number | string;
  sx?: object;
}

export const Panel = ({
  title,
  children,
  actions,
  fullWidth = false,
  minHeight,
  sx = {},
}: PanelProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        minHeight,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {title && (
        <>
          <Box
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" fontWeight="medium">
              {title}
            </Typography>
            {actions && <Box>{actions}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <Box
        sx={{
          p: fullWidth ? 0 : 3,
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

interface PanelGroupProps {
  children: ReactNode;
  spacing?: number;
  sx?: object;
}

export const PanelGroup = ({ children, spacing = 3, sx = {} }: PanelGroupProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing, ...sx }}>{children}</Box>
  );
};
