'use client';

import React from 'react';
import { Box, Typography, Avatar, Badge, Chip } from '@mui/material';
import { Group, Person, Business, FlightTakeoff, Receipt } from '@mui/icons-material';
import { Conversation } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const unreadCount = conversation.unreadCounts ? 
    Object.values(conversation.unreadCounts).reduce((sum, count) => sum + count, 0) : 0;

  const getContextIcon = () => {
    switch (conversation.contextType) {
      case 'quote':
        return <FlightTakeoff fontSize="small" />;
      case 'booking':
        return <FlightTakeoff fontSize="small" />;
      case 'invoice':
        return <Receipt fontSize="small" />;
      default:
        return null;
    }
  };

  const getContextColor = () => {
    switch (conversation.contextType) {
      case 'quote':
        return 'primary';
      case 'booking':
        return 'success';
      case 'invoice':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = () => {
    switch (conversation.priority) {
      case 'urgent':
        return '#ff1744';
      case 'high':
        return '#ff9800';
      case 'normal':
        return 'transparent';
      case 'low':
        return '#4caf50';
      default:
        return 'transparent';
    }
  };

  const getConversationAvatar = () => {
    if (conversation.isGroupChat) {
      return (
        <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
          <Group />
        </Avatar>
      );
    }

    // For individual conversations, show the other participant's info
    const otherParticipant = conversation.participants?.find(p => p.userCode !== 'current_user');
    
    if (otherParticipant) {
      if (otherParticipant.avatar) {
        return (
          <Avatar src={otherParticipant.avatar} sx={{ width: 48, height: 48 }}>
            {otherParticipant.name.charAt(0).toUpperCase()}
          </Avatar>
        );
      }
      
      const roleIcon = otherParticipant.role === 'operator' ? <Business /> : <Person />;
      return (
        <Avatar sx={{ 
          bgcolor: otherParticipant.role === 'operator' ? 'primary.main' : 'secondary.main',
          width: 48, 
          height: 48 
        }}>
          {roleIcon}
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ bgcolor: 'grey.400', width: 48, height: 48 }}>
        <Person />
      </Avatar>
    );
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type, senderName } = conversation.lastMessage;
    
    switch (type) {
      case 'file':
        return `${senderName}: 📎 Shared a file`;
      case 'image':
        return `${senderName}: 🖼️ Shared an image`;
      case 'system':
        return content;
      default:
        return `${senderName}: ${content}`;
    }
  };

  const getTimeAgo = () => {
    if (conversation.lastActivityAt) {
      const date = conversation.lastActivityAt.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return '';
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        borderLeft: `4px solid ${isSelected ? 'primary.main' : 'transparent'}`,
        borderRight: `2px solid ${getPriorityColor()}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
        position: 'relative',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Conversation with ${conversation.title}`}
    >
      {/* Avatar */}
      <Box sx={{ position: 'relative' }}>
        {getConversationAvatar()}
        
        {/* Online Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            bgcolor: 'success.main',
            borderRadius: '50%',
            border: '2px solid',
            borderColor: 'background.paper',
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: unreadCount > 0 ? 600 : 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            }}
          >
            {conversation.title}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
            {getTimeAgo()}
          </Typography>
        </Box>

        {/* Context & Tags */}
        {(conversation.contextType || conversation.tags?.length) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            {conversation.contextType && (
              getContextIcon() ? (
                <Chip
                  icon={getContextIcon()!}
                  label={conversation.contextType}
                  size="small"
                  variant="outlined"
                  color={getContextColor() as any}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              ) : (
                <Chip
                  label={conversation.contextType}
                  size="small"
                  variant="outlined"
                  color={getContextColor() as any}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )
            )}
            
            {conversation.tags?.slice(0, 2).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            ))}
            
            {conversation.tags && conversation.tags.length > 2 && (
              <Typography variant="caption" color="text.secondary">
                +{conversation.tags.length - 2}
              </Typography>
            )}
          </Box>
        )}

        {/* Last Message */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.875rem',
            lineHeight: 1.2,
          }}
        >
          {getLastMessagePreview()}
        </Typography>

        {/* Participants Preview (for group chats) */}
        {conversation.isGroupChat && conversation.participants && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
            <Group fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {conversation.participants.length} participants
            </Typography>
          </Box>
        )}
      </Box>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <Badge
          badgeContent={unreadCount > 99 ? '99+' : unreadCount}
          color="error"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              height: 18,
              minWidth: 18,
            },
          }}
        />
      )}

      {/* Priority Indicator */}
      {conversation.priority === 'urgent' && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 8,
            height: 8,
            bgcolor: 'error.main',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.2)',
                opacity: 0.7,
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
            },
          }}
        />
      )}
    </Box>
  );
};

export default ConversationCard; 