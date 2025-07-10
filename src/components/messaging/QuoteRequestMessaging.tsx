'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Message,
  ExpandMore,
  ExpandLess,
  Close,
  Person,
  Business,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationManager, useUnreadCount } from '@/hooks/useMessaging';
import MessagingInterface from './MessagingInterface';
import { QuoteRequest, Offer } from '@/types/flight';
import toast from 'react-hot-toast';

interface QuoteRequestMessagingProps {
  quoteRequest: QuoteRequest;
  offers?: Offer[];
  onConversationStart?: (conversationId: string) => void;
  compact?: boolean;
}

const QuoteRequestMessaging: React.FC<QuoteRequestMessagingProps> = ({
  quoteRequest,
  offers = [],
  onConversationStart,
  compact = false,
}) => {
  const { user } = useAuth();
  const { findOrCreateConversation, creating } = useConversationManager();
  const { totalUnreadCount } = useUnreadCount();
  const [expanded, setExpanded] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const isOperator = user?.role === 'operator';
  const isClient = user?.role === 'passenger' || user?.role === 'agent';

  const handleStartConversation = async (operatorUserCode?: string) => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      let participantUserCodes: string[] = [];
      
      if (operatorUserCode) {
        // Specific operator conversation
        participantUserCodes = [operatorUserCode];
      } else if (isOperator) {
        // Operator messaging client
        participantUserCodes = [quoteRequest.clientUserCode];
      } else {
        // Client messaging - create general conversation for this quote request
        // This will be accessible to all operators who submit quotes
        participantUserCodes = offers.map(offer => offer.operatorUserCode);
        if (participantUserCodes.length === 0) {
          toast('No operators have submitted quotes yet. The conversation will be available once operators respond.');
          return;
        }
      }

      const conversationId = await findOrCreateConversation(
        participantUserCodes,
        'quote',
        quoteRequest.id
      );

      setActiveConversationId(conversationId);
      setExpanded(true);

      if (onConversationStart) {
        onConversationStart(conversationId);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const getConversationButtonText = () => {
    if (creating) return 'Starting...';
    
    if (isOperator) {
      return 'Message Client';
    } else if (offers.length === 0) {
      return 'No Operators Yet';
    } else if (offers.length === 1) {
      return 'Message Operator';
    } else {
      return `Message Operators (${offers.length})`;
    }
  };

  const getParticipantInfo = () => {
    if (isOperator) {
      return {
        type: 'client',
        name: quoteRequest.clientUserCode,
        count: 1,
      };
    } else {
      return {
        type: 'operators',
        name: offers.length === 1 ? offers[0].operatorUserCode : 'Multiple Operators',
        count: offers.length,
      };
    }
  };

  const participantInfo = getParticipantInfo();

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={creating ? undefined : <Message />}
          onClick={() => handleStartConversation()}
          disabled={creating || (!isOperator && offers.length === 0)}
        >
          {getConversationButtonText()}
        </Button>
        
        {totalUnreadCount > 0 && (
          <Badge
            badgeContent={totalUnreadCount}
            color="error"
            max={99}
          >
            <Message color="primary" />
          </Badge>
        )}
      </Box>
    );
  }

  return (
    <Card
      sx={{
        mb: 2,
        border: expanded ? '2px solid' : '1px solid',
        borderColor: expanded ? 'primary.main' : 'divider',
      }}
    >
      <CardContent sx={{ pb: expanded ? 0 : 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Message />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                Messages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quote Request #{quoteRequest.requestCode}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {totalUnreadCount > 0 && (
              <Chip
                label={`${totalUnreadCount} unread`}
                color="error"
                size="small"
              />
            )}
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <ExpandMore />
            </IconButton>
          </Box>
        </Box>

        {/* Participant Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {participantInfo.type === 'client' ? <Person /> : <Business />}
            <Typography variant="body2" color="text.secondary">
              {participantInfo.type === 'client' ? 'Client:' : 'Operators:'}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {participantInfo.name}
            </Typography>
            {participantInfo.count > 1 && (
              <Chip
                label={`${participantInfo.count} participants`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={expanded ? 'outlined' : 'contained'}
            startIcon={creating ? undefined : <Message />}
            onClick={() => handleStartConversation()}
            disabled={creating || (!isOperator && offers.length === 0)}
          >
            {getConversationButtonText()}
          </Button>

          {/* Individual operator buttons for clients */}
          {isClient && offers.length > 1 && (
            <>
              <Divider orientation="vertical" flexItem />
              {offers.slice(0, 3).map((offer) => (
                <Button
                  key={offer.operatorUserCode}
                  variant="text"
                  size="small"
                  onClick={() => handleStartConversation(offer.operatorUserCode)}
                  disabled={creating}
                >
                  {offer.operatorUserCode}
                </Button>
              ))}
              {offers.length > 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  +{offers.length - 3} more
                </Typography>
              )}
            </>
          )}
        </Box>
      </CardContent>

      {/* Expanded Messaging Interface */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          {activeConversationId ? (
            <MessagingInterface
              defaultConversationId={activeConversationId}
              contextType="quote"
              contextId={quoteRequest.id}
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Box>
                <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Start a Conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Message {participantInfo.type}" above to begin chatting about this quote request.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Close Button */}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(false)}
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
          >
            <Close />
          </IconButton>
        </Box>
      </Collapse>
    </Card>
  );
};

export default QuoteRequestMessaging; 