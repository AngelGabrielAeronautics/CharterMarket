'use client';

import React, { useState, useMemo } from 'react';
import { Box, TextField, InputAdornment, Typography, Skeleton, Alert, Button } from '@mui/material';
import { Search, Add, FilterList, Refresh, Security } from '@mui/icons-material';
import { useConversations, useUnreadCount } from '@/hooks/useMessaging';
import { ConversationFilters } from '@/types/message';
import ConversationCard from './ConversationCard';
import CreateConversationDialog from './CreateConversationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

interface ConversationListProps {
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversationId,
  onConversationSelect,
  className,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [fixingAuth, setFixingAuth] = useState(false);

  // Load conversations with real-time updates
  const { conversations, loading, error, refreshConversations } = useConversations(filters);
  const { totalUnreadCount } = useUnreadCount();

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(conversation => {
      // Search by conversation title
      if (conversation.title?.toLowerCase().includes(query)) return true;
      
      // Search by participant names
      if (conversation.participants?.some((participant: any) => 
        participant.name.toLowerCase().includes(query)
      )) return true;
      
      // Search by last message content
      if (conversation.lastMessage?.content?.toLowerCase().includes(query)) return true;
      
      // Search by context (e.g., quote, booking)
      if (conversation.contextType?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [conversations, searchQuery]);

  const handleCreateConversation = () => {
    setShowCreateDialog(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    setShowCreateDialog(false);
    onConversationSelect(conversationId);
    refreshConversations();
  };

  const handleFixAuthentication = async () => {
    if (!user || !auth.currentUser || fixingAuth) return;

    setFixingAuth(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/auth/fix-user-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        console.log('User claims fixed successfully');
        // Force token refresh to get updated claims
        await auth.currentUser.getIdToken(true);
        // Refresh conversations after fixing claims
        setTimeout(() => {
          refreshConversations();
        }, 1000);
      } else {
        console.error('Failed to fix user claims:', await response.text());
      }
    } catch (error) {
      console.error('Error fixing user claims:', error);
    } finally {
      setFixingAuth(false);
    }
  };

  return (
    <Box
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: { md: 1 },
        borderColor: 'divider',
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Messages
            {totalUnreadCount > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.5,
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Box>
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              component="button"
              onClick={handleCreateConversation}
              sx={{
                p: 1,
                borderRadius: 1,
                border: 'none',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
              aria-label="Start new conversation"
            >
              <Add fontSize="small" />
            </Box>
          </Box>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
            },
          }}
        />
      </Box>

      {/* Conversation List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
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
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert 
              severity="error" 
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<Security />}
                    onClick={handleFixAuthentication}
                    disabled={fixingAuth}
                  >
                    {fixingAuth ? 'Fixing...' : 'Fix Auth'}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={refreshConversations}
                  >
                    Retry
                  </Button>
                </Box>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {loading ? (
          <Box sx={{ p: 1 }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Box key={index} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="90%" height={16} sx={{ mt: 0.5 }} />
                    <Skeleton variant="text" width="40%" height={14} sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              textAlign: 'center',
              p: 3,
            }}
          >
            {searchQuery ? (
              <>
                <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No conversations found for "{searchQuery}"
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No conversations yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Start a conversation with an operator or passenger
                </Typography>
                <Box
                  component="button"
                  onClick={handleCreateConversation}
                  sx={{
                    px: 3,
                    py: 1.5,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    border: 'none',
                    borderRadius: 1,
                    cursor: 'pointer',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  Start Conversation
                </Box>
              </>
            )}
          </Box>
        ) : (
          <Box>
            {filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onConversationSelect(conversation.id)}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Create Conversation Dialog */}
      <CreateConversationDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConversationCreated={handleConversationCreated}
      />
    </Box>
  );
};

export default ConversationList; 