'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Divider } from '@mui/material';
import { ExpandLess, Refresh } from '@mui/icons-material';
import { useConversationView } from '@/hooks/useMessaging';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';

interface MessageThreadProps {
  conversationId: string;
  onClose?: () => void;
  className?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  onClose,
  className,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);

  const {
    conversation,
    conversationLoading,
    conversationError,
    messages,
    messagesLoading,
    messagesError,
    hasMoreMessages,
    loadMoreMessages,
    markAsRead,
    markAllAsRead,
    sendMessage,
    sendTextMessage,
    sendFileMessage,
    sending,
    sendError,
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  } = useConversationView(conversationId);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Handle scroll events to determine auto-scroll behavior
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    setAutoScroll(isNearBottom);
    setShowScrollToBottom(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  // Load more messages when scrolling to top
  const handleLoadMore = useCallback(async () => {
    if (!hasMoreMessages || messagesLoading) return;
    
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const previousScrollHeight = container.scrollHeight;
    
    await loadMoreMessages();
    
    // Maintain scroll position after loading more messages
    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - previousScrollHeight;
      }
    }, 100);
  }, [hasMoreMessages, messagesLoading, loadMoreMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (messages.length > 0 && conversation) {
      const timeoutId = setTimeout(() => {
        markAllAsRead();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, conversation, markAllAsRead]);

  // Handle infinite scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScrollDebounced = () => {
      clearTimeout((handleScrollDebounced as any).timeoutId);
      (handleScrollDebounced as any).timeoutId = setTimeout(() => {
        handleScroll();
        
        // Load more messages if scrolled to top
        if (container.scrollTop === 0 && hasMoreMessages) {
          handleLoadMore();
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScrollDebounced);
    return () => {
      container.removeEventListener('scroll', handleScrollDebounced);
      clearTimeout((handleScrollDebounced as any).timeoutId);
    };
  }, [handleScroll, handleLoadMore, hasMoreMessages]);

  if (conversationLoading) {
    return (
      <Box
        className={className}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (conversationError || !conversation) {
    return (
      <Box
        className={className}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {conversationError || 'Conversation not found'}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {conversation.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {conversation.participants?.length || 0} participants • {messages.length} messages
            </Typography>
          </Box>
          
          {onClose && (
            <Button
              onClick={onClose}
              size="small"
              sx={{ minWidth: 'auto', p: 1 }}
              aria-label="Close conversation"
            >
              <ExpandLess />
            </Button>
          )}
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
          },
        }}
      >
        {/* Load More Messages Button */}
        {hasMoreMessages && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={handleLoadMore}
              disabled={messagesLoading}
              startIcon={messagesLoading ? <CircularProgress size={16} /> : undefined}
            >
              {messagesLoading ? 'Loading...' : 'Load More Messages'}
            </Button>
          </Box>
        )}

        {/* Messages */}
        <Box sx={{ p: 1 }}>
          {messagesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load messages. Please try again.
            </Alert>
          )}

          {messages.length === 0 && !messagesLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body1" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="body2">
                Send a message to start the conversation
              </Typography>
            </Box>
          ) : (
            messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDateDivider = previousMessage && 
                !isSameDay(message.createdAt.toDate(), previousMessage.createdAt.toDate());
              
              return (
                <React.Fragment key={message.id}>
                  {showDateDivider && (
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatMessageDate(message.createdAt.toDate())}
                      </Typography>
                    </Divider>
                  )}
                  
                  <MessageBubble
                    message={message}
                    previousMessage={previousMessage}
                    onMarkAsRead={() => markAsRead(message.id)}
                  />
                </React.Fragment>
              );
            })
          )}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 16,
            zIndex: 2,
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setAutoScroll(true);
              scrollToBottom();
            }}
            sx={{
              minWidth: 'auto',
              width: 40,
              height: 40,
              borderRadius: '50%',
              boxShadow: 2,
            }}
            aria-label="Scroll to bottom"
          >
            ↓
          </Button>
        </Box>
      )}

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId}
        onSendMessage={sendTextMessage}
        onSendFile={sendFileMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        sending={sending}
        error={sendError}
        disabled={conversation.status === 'closed' || conversation.status === 'blocked'}
      />
    </Box>
  );
};

// Helper functions
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

const formatMessageDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

export default MessageThread; 