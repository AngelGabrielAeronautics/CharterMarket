'use client';

import React from 'react';
import { Box, Typography, Avatar, Chip, Paper } from '@mui/material';
import { Check, CheckCircle, Description, Image, Download } from '@mui/icons-material';
import { Message } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  previousMessage?: Message | null;
  onMarkAsRead: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  previousMessage,
  onMarkAsRead,
}) => {
  const isOwnMessage = message.senderId === 'current_user'; // In real app, compare with current user
  const showAvatar = !previousMessage || 
    previousMessage.senderId !== message.senderId ||
    (message.createdAt.toDate().getTime() - previousMessage.createdAt.toDate().getTime()) > 5 * 60 * 1000; // 5 minutes

  const getMessageStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Check sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'sent':
        return <Check sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'delivered':
        return <CheckCircle sx={{ fontSize: 14, color: 'text.secondary' }} />;
      case 'read':
        return <CheckCircle sx={{ fontSize: 14, color: 'primary.main' }} />;
      default:
        return null;
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getMessageTypeDisplay = () => {
    switch (message.type) {
      case 'system':
        return (
          <Box
            sx={{
              textAlign: 'center',
              py: 1,
              px: 2,
              my: 1,
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                bgcolor: 'action.hover',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                color: 'text.secondary'
              }}
            >
              {message.content}
            </Typography>
          </Box>
        );
      
      case 'quote_update':
      case 'booking_update':
      case 'payment_update':
        return (
          <Box
            sx={{
              textAlign: 'center',
              py: 1,
              px: 2,
              my: 1,
            }}
          >
            <Chip
              label={message.content}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        );
      
      default:
        return null;
    }
  };

  // Handle system and status messages differently
  if (message.type === 'system' || message.type === 'quote_update' || message.type === 'booking_update' || message.type === 'payment_update') {
    return getMessageTypeDisplay();
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 1,
        my: 1,
        px: 1,
      }}
    >
      {/* Avatar */}
      {!isOwnMessage && (
        <Box sx={{ width: 32, height: 32, mb: 0.5 }}>
          {showAvatar ? (
            <Avatar
              src={message.senderAvatar}
              sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
            >
              {message.senderName?.charAt(0)?.toUpperCase()}
            </Avatar>
          ) : (
            <Box sx={{ width: 32 }} />
          )}
        </Box>
      )}

      {/* Message Content */}
      <Box
        sx={{
          maxWidth: { xs: '85%', sm: '70%', md: '60%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Sender Name (for other users' messages) */}
        {!isOwnMessage && showAvatar && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, ml: 1 }}
          >
            {message.senderName}
          </Typography>
        )}

        {/* Reply Context */}
        {message.quotedMessage && (
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 0.5,
              bgcolor: 'action.hover',
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              maxWidth: '100%',
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Replying to {message.quotedMessage.senderName}
            </Typography>
            <Typography variant="body2" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {message.quotedMessage.content}
            </Typography>
          </Paper>
        )}

        {/* Message Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            borderTopRightRadius: isOwnMessage ? 0.5 : 2,
            borderTopLeftRadius: isOwnMessage ? 2 : 0.5,
            maxWidth: '100%',
            wordWrap: 'break-word',
          }}
        >
          {/* Text Content */}
          {message.content && (
            <Typography 
              variant="body2" 
              sx={{ 
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {message.content}
            </Typography>
          )}

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: message.content ? 1 : 0 }}>
              {message.attachments.map((attachment) => (
                <Box
                  key={attachment.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    mb: 0.5,
                    bgcolor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'action.hover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'action.selected',
                    },
                  }}
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  {attachment.fileType.startsWith('image/') ? (
                    <Image fontSize="small" />
                  ) : (
                    <Description fontSize="small" />
                  )}
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {attachment.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(attachment.fileSize)}
                    </Typography>
                  </Box>
                  
                  <Download fontSize="small" />
                </Box>
              ))}
            </Box>
          )}

          {/* Image Attachments Preview */}
          {message.attachments?.some(a => a.fileType.startsWith('image/')) && (
            <Box
              sx={{
                mt: 1,
                display: 'grid',
                gridTemplateColumns: message.attachments.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 1,
                maxWidth: '300px',
              }}
            >
              {message.attachments
                .filter(a => a.fileType.startsWith('image/'))
                .map((attachment) => (
                  <Box
                    key={attachment.id}
                    component="img"
                    src={attachment.thumbnailUrl || attachment.url}
                    alt={attachment.fileName}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(attachment.url, '_blank')}
                  />
                ))}
            </Box>
          )}
        </Paper>

        {/* Message Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5,
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {formatMessageTime(message.createdAt.toDate())}
          </Typography>
          
          {message.editedAt && (
            <Typography variant="caption" color="text.secondary">
              • edited
            </Typography>
          )}
          
          {isOwnMessage && getMessageStatusIcon()}
        </Box>
      </Box>
    </Box>
  );
};

// Helper function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default MessageBubble; 