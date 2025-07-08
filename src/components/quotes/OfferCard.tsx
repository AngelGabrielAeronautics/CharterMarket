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
import { CheckCircle, HourglassEmpty, Cancel, Business, AttachFile } from '@mui/icons-material';

interface OfferCardProps {
  offer: Offer;
  isClientView: boolean;
  onAccept: (offer: Offer) => void;
  isAccepting: boolean;
  isRequestBooked: boolean;
  showAdminInfo?: boolean; // For showing admin-only information like attachments
}

// Helper function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'ZAR': 'R',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'JPY': '¥',
  };
  return symbols[currency] || currency;
};

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
  showAdminInfo = false,
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
            {operator?.photoURL ? (
              <Avatar 
                src={operator.photoURL} 
                alt={operator.companyName || operator.company || 'Operator Logo'}
                sx={{ mr: 2, width: 40, height: 40 }}
              />
            ) : (
              <Avatar sx={{ mr: 2, width: 40, height: 40, bgcolor: 'primary.main' }}>
                {operator?.companyName?.charAt(0) || operator?.company?.charAt(0) || <Business />}
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
                {operator?.companyName || operator?.company || `${operator?.firstName} ${operator?.lastName}` || 'Operator'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {operator?.userCode}
              </Typography>
            </Box>
          </Box>
        )}
        <Divider sx={{ my: 1.5 }} />
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', my: 2 }}
        >
          <Box>
            <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>
              {getCurrencySymbol(offer.currency || 'USD')}{(isClientView ? offer.totalPrice : offer.price).toFixed(2)}
              <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                {offer.currency || 'USD'}
              </Typography>
            </Typography>
            {isClientView && (
              <Typography variant="caption" color="text.secondary">
                (incl. 3% fee)
              </Typography>
            )}
          </Box>
        </Box>

        {/* Additional offer info */}
        {offer.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              "{offer.notes}"
            </Typography>
          </Box>
        )}

        {/* Aircraft Information */}
        {offer.aircraftDetails && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
              Aircraft
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {offer.aircraftDetails.registration}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                - {offer.aircraftDetails.make} {offer.aircraftDetails.model}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Type: {offer.aircraftDetails.type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max: {offer.aircraftDetails.maxPassengers} pax
              </Typography>
            </Box>
          </Box>
        )}

        {/* Attachment info (for admin or operator view) */}
        {(showAdminInfo || !isClientView) && (
          <>
            {/* New multiple attachments */}
            {offer.attachments && offer.attachments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Attachments ({offer.attachments.length})
                </Typography>
                {offer.attachments.map((attachment, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AttachFile fontSize="small" color="primary" />
                    <Typography variant="body2" color="primary" sx={{ fontSize: '0.875rem' }}>
                      {attachment.fileName}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            
            {/* Legacy single attachment (for backward compatibility) */}
            {!offer.attachments && offer.attachmentUrl && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFile fontSize="small" color="primary" />
                <Typography variant="body2" color="primary">
                  {offer.attachmentFileName || 'Attachment Available'}
                </Typography>
              </Box>
            )}
          </>
        )}
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
