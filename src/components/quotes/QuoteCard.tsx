'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Message,
  Phone,
  Email,
  Check,
  Close,
  MoreVert,
  Business,
  AttachMoney,
  AccessTime,
  FlightTakeoff,
} from '@mui/icons-material';
import { Offer } from '@/types/flight';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationManager } from '@/hooks/useMessaging';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface QuoteCardProps {
  offer: Offer;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
  onMessageClick?: (conversationId: string) => void;
  requestId: string;
  isClientView?: boolean;
  showActions?: boolean;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  offer,
  onAccept,
  onReject,
  onMessageClick,
  requestId,
  isClientView = false,
  showActions = true,
}) => {
  const { user } = useAuth();
  const { findOrCreateConversation, creating } = useConversationManager();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'accept' | 'reject' | null;
  }>({ open: false, action: null });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending-client-acceptance':
        return 'warning';
      case 'accepted-by-client':
        return 'success';
      case 'rejected-by-client':
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending-client-acceptance':
        return 'Pending Review';
      case 'accepted-by-client':
        return 'Accepted';
      case 'rejected-by-client':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleMessageOperator = async () => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      // Find or create conversation between client and operator for this quote
      const participantUserCodes = [offer.operatorUserCode];
      if (offer.clientUserCode && offer.clientUserCode !== user.userCode) {
        participantUserCodes.push(offer.clientUserCode);
      }

      const conversationId = await findOrCreateConversation(
        participantUserCodes,
        'quote',
        requestId
      );

      if (onMessageClick) {
        onMessageClick(conversationId);
      } else {
        // Open messaging in a new window/tab or navigate
        window.open(`/dashboard/messages?conversation=${conversationId}`, '_blank');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleAccept = () => {
    setConfirmDialog({ open: true, action: 'accept' });
  };

  const handleReject = () => {
    setConfirmDialog({ open: true, action: 'reject' });
  };

  const handleConfirmAction = () => {
    const { action } = confirmDialog;
    if (action === 'accept' && onAccept) {
      onAccept(offer.offerId);
    } else if (action === 'reject' && onReject) {
      onReject(offer.offerId);
    }
    setConfirmDialog({ open: false, action: null });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const isAccepted = offer.offerStatus === 'accepted-by-client';
  const isPending = offer.offerStatus === 'pending-client-acceptance';
  const canAccept = isClientView && isPending && showActions;
  const canMessage = user && (user.userCode === offer.operatorUserCode || user.userCode === offer.clientUserCode);

  return (
    <>
      <Card
        sx={{
          mb: 2,
          border: isAccepted ? '2px solid' : '1px solid',
          borderColor: isAccepted ? 'success.main' : 'divider',
          bgcolor: isAccepted ? 'success.50' : 'background.paper',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 2,
          },
        }}
      >
        <CardContent sx={{
          // Enhanced mobile padding
          p: { xs: 2, sm: 3 }
        }}>
          {/* Header - improved mobile layout */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between', 
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main',
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 }
              }}>
                <Business />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div" sx={{
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  {offer.operatorUserCode}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Quote #{offer.offerId.slice(-8)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' }
            }}>
              <Chip
                label={getStatusLabel(offer.offerStatus)}
                color={getStatusColor(offer.offerStatus) as any}
                size="small"
                sx={{
                  height: { xs: 32, sm: 24 },
                  fontSize: { xs: '0.8rem', sm: '0.75rem' }
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  // Enhanced mobile touch target
                  width: { xs: 44, sm: 32 },
                  height: { xs: 44, sm: 32 }
                }}
              >
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          {/* Aircraft Information - enhanced mobile layout */}
          {offer.aircraftDetails && (
            <Box sx={{ 
              mb: 2, 
              p: { xs: 2, sm: 1.5 }, 
              bgcolor: 'background.default', 
              borderRadius: 1 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1,
                flexWrap: 'wrap'
              }}>
                <FlightTakeoff color="primary" />
                <Typography variant="subtitle2" fontWeight={600} sx={{
                  fontSize: { xs: '0.9rem', sm: '0.875rem' }
                }}>
                  Aircraft Details
                </Typography>
              </Box>
              <Typography variant="body2" sx={{
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                mb: 1
              }}>
                {offer.aircraftDetails.make} {offer.aircraftDetails.model}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.75rem' },
                lineHeight: 1.4,
                display: 'block'
              }}>
                Registration: {offer.aircraftDetails.registration}
                <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> • </Box>
                  Max Passengers: {offer.aircraftDetails.maxPassengers}
                </Box>
              </Typography>
            </Box>
          )}

          {/* Pricing - enhanced mobile layout */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 1,
              flexWrap: 'wrap'
            }}>
              <AttachMoney color="primary" />
              <Typography variant="subtitle2" fontWeight={600} sx={{
                fontSize: { xs: '0.9rem', sm: '0.875rem' }
              }}>
                Pricing Breakdown
              </Typography>
            </Box>
            
            <Box sx={{ pl: { xs: 2, sm: 4 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 0.5,
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.25, sm: 0 }
              }}>
                <Typography variant="body2" sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}>
                  Base Price:
                </Typography>
                <Typography variant="body2" fontWeight={500} sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}>
                  {formatCurrency(offer.price, offer.currency)}
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 0.5,
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.25, sm: 0 }
              }}>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}>
                  Charter Commission (3%):
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}>
                  {formatCurrency(offer.commission, offer.currency)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{
                  fontSize: { xs: '1rem', sm: '1rem' }
                }}>
                  Total Price:
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main" sx={{
                  fontSize: { xs: '1.1rem', sm: '1rem' }
                }}>
                  {formatCurrency(offer.totalPrice, offer.currency)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Notes - enhanced mobile typography */}
          {offer.notes && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{
                fontSize: { xs: '0.9rem', sm: '0.875rem' }
              }}>
                Operator Notes:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                lineHeight: { xs: 1.4, sm: 1.43 }
              }}>
                {offer.notes}
              </Typography>
            </Box>
          )}

          {/* Attachments - enhanced mobile layout */}
          {offer.attachments && offer.attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{
                fontSize: { xs: '0.9rem', sm: '0.875rem' }
              }}>
                Attachments:
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: { xs: 1, sm: 1 }
              }}>
                {offer.attachments.map((attachment, index) => (
                  <Chip
                    key={index}
                    label={attachment.fileName}
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(attachment.url, '_blank')}
                    sx={{ 
                      cursor: 'pointer',
                      // Enhanced mobile touch targets
                      height: { xs: 32, sm: 24 },
                      fontSize: { xs: '0.8rem', sm: '0.75rem' },
                      // Better mobile text wrapping
                      maxWidth: { xs: '100%', sm: 'none' },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 0.75 }
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Timestamp - enhanced mobile layout */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            gap: 1, 
            mt: 2,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5 
            }}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.75rem' },
                lineHeight: 1.4
              }}>
                Submitted {formatDistanceToNow(offer.createdAt.toDate(), { addSuffix: true })}
              </Typography>
            </Box>
            {offer.responseTimeMinutes && (
              <Typography variant="caption" color="text.secondary" sx={{
                fontSize: { xs: '0.75rem', sm: '0.75rem' },
                pl: { xs: 2.5, sm: 0 }
              }}>
                Response time: {Math.round(offer.responseTimeMinutes / 60)} hours
              </Typography>
            )}
          </Box>
        </CardContent>

        {/* Actions - enhanced mobile layout */}
        {showActions && (
          <CardActions sx={{ 
            justifyContent: 'space-between', 
            px: { xs: 2, sm: 2 }, 
            pb: { xs: 2, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <Box sx={{ 
              order: { xs: 2, sm: 1 },
              width: { xs: '100%', sm: 'auto' }
            }}>
              {canMessage && (
                <Button
                  startIcon={creating ? undefined : <Message />}
                  onClick={handleMessageOperator}
                  disabled={creating}
                  size="small"
                  sx={{
                    // Enhanced mobile touch targets
                    height: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {creating ? 'Starting...' : isClientView ? 'Message Operator' : 'Message Client'}
                </Button>
              )}
            </Box>

            {canAccept && (
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 2, sm: 1 },
                order: { xs: 1, sm: 2 },
                width: { xs: '100%', sm: 'auto' },
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Close />}
                  onClick={handleReject}
                  size="small"
                  sx={{
                    // Enhanced mobile touch targets
                    height: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={handleAccept}
                  size="small"
                  sx={{
                    // Enhanced mobile touch targets
                    height: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    fontWeight: 'medium',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Accept Quote
                </Button>
              </Box>
            )}
          </CardActions>
        )}
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          // Copy quote ID to clipboard
          navigator.clipboard.writeText(offer.offerId);
          toast.success('Quote ID copied to clipboard');
        }}>
          Copy Quote ID
        </MenuItem>
        
        {canMessage && (
          <MenuItem onClick={() => {
            setMenuAnchor(null);
            handleMessageOperator();
          }}>
            <Message sx={{ mr: 1 }} />
            Send Message
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          // Could add email functionality here
        }}>
          <Email sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          // Could add phone functionality here
        }}>
          <Phone sx={{ mr: 1 }} />
          Call Operator
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'accept' ? 'Accept Quote' : 'Decline Quote'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'accept'
              ? `Are you sure you want to accept this quote for ${formatCurrency(offer.totalPrice, offer.currency)}?`
              : 'Are you sure you want to decline this quote?'
            }
          </Typography>
          {confirmDialog.action === 'accept' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will proceed to the booking stage and you will be asked to provide passenger details and payment.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'accept' ? 'success' : 'error'}
          >
            {confirmDialog.action === 'accept' ? 'Accept Quote' : 'Decline Quote'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuoteCard; 