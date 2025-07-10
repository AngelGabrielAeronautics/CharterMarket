'use client';

import React, { useState } from 'react';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';

interface MessagingInterfaceProps {
  className?: string;
  defaultConversationId?: string;
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string;
  preselectedUserCodes?: string[];
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  className,
  defaultConversationId,
  contextType,
  contextId,
  preselectedUserCodes,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    defaultConversationId
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleCloseMobileConversation = () => {
    if (isMobile) {
      setSelectedConversationId(undefined);
      setMobileDrawerOpen(true);
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <Box className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {selectedConversationId ? (
          // Show message thread on mobile
          <MessageThread
            conversationId={selectedConversationId}
            onClose={handleCloseMobileConversation}
          />
        ) : (
          // Show conversation list on mobile
          <ConversationList
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
          />
        )}
      </Box>
    );
  }

  // Desktop Layout
  return (
    <Box
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Conversation List - Left Sidebar */}
      <Box
        sx={{
          width: { md: '320px', lg: '360px' },
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <ConversationList
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
        />
      </Box>

      {/* Message Thread - Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversationId ? (
          <MessageThread
            conversationId={selectedConversationId}
            onClose={() => setSelectedConversationId(undefined)}
          />
        ) : (
          // Welcome/Empty State
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 4,
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                mb: 3,
                fontSize: '4rem',
                opacity: 0.3,
              }}
            >
              💬
            </Box>
            <Box sx={{ mb: 2, fontSize: '1.5rem', fontWeight: 500, color: 'text.primary' }}>
              Charter Messaging
            </Box>
            <Box sx={{ color: 'text.secondary', maxWidth: '400px', lineHeight: 1.6 }}>
              Select a conversation from the sidebar to start messaging, or create a new conversation
              to connect with operators and passengers.
            </Box>
            {contextType && contextId && (
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                Context: {contextType} #{contextId}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagingInterface; 