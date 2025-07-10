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
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {offer.operatorUserCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quote #{offer.offerId.slice(-8)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getStatusLabel(offer.offerStatus)}
                color={getStatusColor(offer.offerStatus) as any}
                size="small"
              />
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          {/* Aircraft Information */}
          {offer.aircraftDetails && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FlightTakeoff color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Aircraft Details
                </Typography>
              </Box>
              <Typography variant="body2">
                {offer.aircraftDetails.make} {offer.aircraftDetails.model}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registration: {offer.aircraftDetails.registration} • 
                Max Passengers: {offer.aircraftDetails.maxPassengers}
              </Typography>
            </Box>
          )}

          {/* Pricing */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Pricing Breakdown
              </Typography>
            </Box>
            
            <Box sx={{ pl: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Base Price:</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(offer.price, offer.currency)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Charter Commission (3%):
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(offer.commission, offer.currency)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Total Price:
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                  {formatCurrency(offer.totalPrice, offer.currency)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Notes */}
          {offer.notes && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Operator Notes:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {offer.notes}
              </Typography>
            </Box>
          )}

          {/* Attachments */}
          {offer.attachments && offer.attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Attachments:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {offer.attachments.map((attachment, index) => (
                  <Chip
                    key={index}
                    label={attachment.fileName}
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(attachment.url, '_blank')}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Timestamp */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Submitted {formatDistanceToNow(offer.createdAt.toDate(), { addSuffix: true })}
              {offer.responseTimeMinutes && (
                <> • Response time: {Math.round(offer.responseTimeMinutes / 60)} hours</>
              )}
            </Typography>
          </Box>
        </CardContent>

        {/* Actions */}
        {showActions && (
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Box>
              {canMessage && (
                <Button
                  startIcon={creating ? undefined : <Message />}
                  onClick={handleMessageOperator}
                  disabled={creating}
                  size="small"
                >
                  {creating ? 'Starting...' : isClientView ? 'Message Operator' : 'Message Client'}
                </Button>
              )}
            </Box>

            {canAccept && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Close />}
                  onClick={handleReject}
                  size="small"
                >
                  Decline
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={handleAccept}
                  size="small"
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