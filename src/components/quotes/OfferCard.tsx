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
        // Enhanced mobile padding and spacing
        p: { xs: 0, sm: 0 }
      }}
    >
      <CardContent sx={{ 
        flexGrow: 1,
        // Better mobile padding
        p: { xs: 2, sm: 2, md: 3 },
        '&:last-child': { pb: { xs: 2, sm: 2, md: 3 } }
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            // Better mobile spacing and wrapping
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' },
            gap: { xs: 1, sm: 0 }
          }}>
            {operator?.photoURL ? (
              <Avatar 
                src={operator.photoURL} 
                alt={operator.companyName || operator.company || 'Operator Logo'}
                sx={{ 
                  mr: { xs: 0, sm: 2 }, 
                  width: { xs: 48, sm: 40 }, 
                  height: { xs: 48, sm: 40 },
                  mb: { xs: 1, sm: 0 }
                }}
              />
            ) : (
              <Avatar sx={{ 
                mr: { xs: 0, sm: 2 }, 
                width: { xs: 48, sm: 40 }, 
                height: { xs: 48, sm: 40 }, 
                bgcolor: 'primary.main',
                mb: { xs: 1, sm: 0 }
              }}>
                {operator?.companyName?.charAt(0) || operator?.company?.charAt(0) || <Business />}
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" sx={{ 
                fontWeight: 'medium',
                // Responsive font size for mobile
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                {operator?.companyName || operator?.company || `${operator?.firstName} ${operator?.lastName}` || 'Operator'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {operator?.userCode}
              </Typography>
            </Box>
          </Box>
        )}
        <Divider sx={{ my: { xs: 1.5, sm: 1.5 } }} />
        
        {/* Enhanced mobile pricing display */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: { xs: 'center', sm: 'space-between' }, 
          alignItems: 'baseline', 
          my: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' },
          gap: { xs: 0.5, sm: 0 }
        }}>
          <Box>
            <Typography variant="h5" component="p" sx={{ 
              fontWeight: 'bold',
              // Responsive font size for pricing
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
              {getCurrencySymbol(offer.currency || 'USD')}{(isClientView ? offer.totalPrice : offer.price).toFixed(2)}
              <Typography component="span" variant="body2" sx={{ 
                ml: 1, 
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                {offer.currency || 'USD'}
              </Typography>
            </Typography>
            {isClientView && (
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                (incl. 3% fee)
              </Typography>
            )}
          </Box>
        </Box>

        {/* Additional offer info - better mobile spacing */}
        {offer.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontStyle: 'italic',
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              lineHeight: { xs: 1.4, sm: 1.43 }
            }}>
              "{offer.notes}"
            </Typography>
          </Box>
        )}

        {/* Aircraft Information - improved mobile layout */}
        {offer.aircraftDetails && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 1, 
              fontWeight: 'medium',
              fontSize: { xs: '0.875rem', sm: '0.875rem' }
            }}>
              Aircraft
            </Typography>
            {/* Stack registration and aircraft details vertically on mobile for better readability */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: { xs: 0.5, sm: 1 }, 
              mb: 0.5 
            }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 'medium',
                fontSize: { xs: '0.875rem', sm: '0.875rem' }
              }}>
                {offer.aircraftDetails.registration}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.875rem', sm: '0.875rem' }
              }}>
                {/* Remove dash on mobile since it's stacked */}
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>- </Box>
                {offer.aircraftDetails.make} {offer.aircraftDetails.model}
              </Typography>
            </Box>
            {/* Better mobile layout for aircraft specs */}
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, sm: 2 },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.75rem' }
              }}>
                Type: {offer.aircraftDetails.type}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.75rem' }
              }}>
                Max: {offer.aircraftDetails.maxPassengers} pax
              </Typography>
            </Box>
          </Box>
        )}

        {/* Attachment info (for admin or operator view) - enhanced mobile layout */}
        {(showAdminInfo || !isClientView) && (
          <>
            {/* New multiple attachments */}
            {offer.attachments && offer.attachments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 1, 
                  fontWeight: 'medium',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}>
                  Attachments ({offer.attachments.length})
                </Typography>
                {offer.attachments.map((attachment, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 0.5,
                    // Better mobile touch targets
                    p: { xs: 0.5, sm: 0 },
                    borderRadius: { xs: 1, sm: 0 },
                    '&:hover': {
                      bgcolor: { xs: 'action.hover', sm: 'transparent' }
                    }
                  }}>
                    <AttachFile fontSize="small" color="primary" />
                    <Typography variant="body2" color="primary" sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      lineHeight: 1.4
                    }}>
                      {attachment.fileName}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            
            {/* Legacy single attachment (for backward compatibility) */}
            {!offer.attachments && offer.attachmentUrl && (
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                // Better mobile touch targets
                p: { xs: 0.5, sm: 0 },
                borderRadius: { xs: 1, sm: 0 },
                '&:hover': {
                  bgcolor: { xs: 'action.hover', sm: 'transparent' }
                }
              }}>
                <AttachFile fontSize="small" color="primary" />
                <Typography variant="body2" color="primary" sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
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
          sx={{ 
            width: '100%',
            // Enhanced mobile touch targets and spacing
            height: { xs: 36, sm: 32 },
            fontSize: { xs: '0.8rem', sm: '0.75rem' },
            '& .MuiChip-icon': {
              fontSize: { xs: '1rem', sm: '0.875rem' }
            }
          }}
        />
      </CardContent>
      {isClientView && (
        <CardActions sx={{ 
          justifyContent: 'center', 
          p: { xs: 2, sm: 2 },
          pt: { xs: 0, sm: 0 }
        }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => onAccept(offer)}
            disabled={
              isAccepting || offer.offerStatus !== 'pending-client-acceptance' || isRequestBooked
            }
            sx={{
              // Enhanced mobile touch targets
              height: { xs: 48, sm: 36 },
              fontSize: { xs: '0.95rem', sm: '0.875rem' },
              fontWeight: 'medium'
            }}
          >
            {isAccepting ? 'Processing...' : 'Accept Offer'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
