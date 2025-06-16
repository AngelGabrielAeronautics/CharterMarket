'use client';

import { useState, useEffect } from 'react';
import { Offer } from '@/types/flight';
import { UserProfile } from '@/types/user';
import { getUserDataByUserCode } from '@/lib/user';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import { CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';

interface OfferCardProps {
  offer: Offer;
  isClientView: boolean;
  onAccept: (offer: Offer) => void;
  isAccepting: boolean;
  isRequestBooked: boolean;
}

const statusConfig = {
  'pending-client-acceptance': {
    label: 'Pending Acceptance',
    color: 'warning' as const,
    icon: <HourglassEmpty />,
  },
  'accepted-by-client': {
    label: 'Accepted',
    color: 'success' as const,
    icon: <CheckCircle />,
  },
  'rejected-by-client': {
    label: 'Rejected',
    color: 'error' as const,
    icon: <Cancel />,
  },
  'awaiting-acknowledgement': {
    label: 'Awaiting Ack',
    color: 'info' as const,
    icon: <HourglassEmpty />,
  },
  expired: {
    label: 'Expired',
    color: 'default' as const,
    icon: <Cancel />,
  },
};

export default function OfferCard({
  offer,
  isClientView,
  onAccept,
  isAccepting,
  isRequestBooked,
}: OfferCardProps) {
  const [operator, setOperator] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOperatorData = async () => {
      setLoading(true);
      try {
        const opData = await getUserDataByUserCode(offer.operatorUserCode);
        setOperator(opData as unknown as UserProfile);
      } catch (error) {
        console.error('Failed to fetch operator data for offer card', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOperatorData();
  }, [offer.operatorUserCode]);

  const config = statusConfig[offer.offerStatus] || {
    label: offer.offerStatus,
    color: 'default' as const,
    icon: null,
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderColor: offer.offerStatus === 'accepted-by-client' ? 'success.main' : 'divider',
        borderWidth: offer.offerStatus === 'accepted-by-client' ? 2 : 1,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar src={operator?.photoURL || ''} sx={{ mr: 2 }}>
              {operator?.companyName?.charAt(0)}
            </Avatar>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
              {operator?.companyName || 'Operator'}
            </Typography>
          </Box>
        )}
        <Divider sx={{ my: 1.5 }} />
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', my: 2 }}
        >
          <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>
            ${isClientView ? offer.totalPrice.toFixed(2) : offer.price.toFixed(2)}
          </Typography>
          {isClientView && (
            <Typography variant="caption" color="text.secondary">
              (incl. 3% fee)
            </Typography>
          )}
        </Box>
        <Chip
          icon={config.icon}
          label={config.label}
          color={config.color}
          size="small"
          sx={{ width: '100%' }}
        />
      </CardContent>
      {isClientView && (
        <CardActions sx={{ justifyContent: 'center', p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => onAccept(offer)}
            disabled={
              isAccepting || offer.offerStatus !== 'pending-client-acceptance' || isRequestBooked
            }
          >
            {isAccepting ? 'Processing...' : 'Accept Offer'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
