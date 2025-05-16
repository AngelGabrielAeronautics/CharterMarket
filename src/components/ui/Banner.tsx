import { ReactNode } from 'react';
import { Box, Paper, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  variant?: BannerVariant;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<BannerVariant, { bgcolor: string; borderColor: string; color: string; actionColor: string }> = {
  info:    { bgcolor: 'info.lighter',    borderColor: 'info.light',    color: 'info.dark',    actionColor: 'info.main' },
  success: { bgcolor: 'success.lighter', borderColor: 'success.light', color: 'success.dark', actionColor: 'success.main' },
  warning: { bgcolor: 'warning.lighter', borderColor: 'warning.light', color: 'warning.dark', actionColor: 'warning.main' },
  error:   { bgcolor: 'error.lighter',   borderColor: 'error.light',   color: 'error.dark',   actionColor: 'error.main' },
};

export default function Banner({ 
  variant = 'info',
  children, 
  action,
  onDismiss,
  className 
}: BannerProps) {
  const styles = variantStyles[variant];
  return (
    <Paper
      elevation={0}
      sx={{
        borderLeft: 4,
        borderColor: styles.borderColor,
        bgcolor: styles.bgcolor,
        color: styles.color,
        p: 2,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
      className={className}
    >
      <Box sx={{ flex: 1, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
        {children}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {action && (
          <Button
            onClick={action.onClick}
            disabled={action.loading}
            size="small"
            sx={{
              color: styles.actionColor,
              fontWeight: 500,
              textTransform: 'none',
              minWidth: 100,
              opacity: action.loading ? 0.7 : 1,
            }}
          >
            {action.loading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
            {action.loading ? 'LOADING...' : action.label}
          </Button>
        )}
        {onDismiss && (
          <IconButton onClick={onDismiss} size="small" sx={{ color: styles.color, opacity: 0.6, '&:hover': { opacity: 1 } }} aria-label="Dismiss">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
} 