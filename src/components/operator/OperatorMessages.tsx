'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  FlightTakeoff as FlightIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Avatar as MuiAvatar, Chip as MuiChip } from '@mui/material';
import {
  SendIcon as LucideSendIcon,
  PaperclipIcon,
  SmileIcon as SmileyIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  DownloadIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  InfoIcon,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

// Mock data for conversations
const mockConversations = [
  {
    id: 'conv1',
    name: 'John Smith',
    avatar: '/images/avatars/user1.png',
    lastMessage: 'Can you confirm the departure time?',
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    unread: 2,
    type: 'client',
    status: 'active',
    flightId: 'FLT-OP-JETS-20230601-1234',
  },
  {
    id: 'conv2',
    name: 'Charter Support',
    avatar: '/images/avatars/support.png',
    lastMessage: 'We need the passenger manifest for flight #CH5678',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unread: 0,
    type: 'support',
    status: 'active',
  },
  {
    id: 'conv3',
    name: 'ABC Travel Agency',
    avatar: '/images/avatars/corporate.png',
    lastMessage: 'Please send the invoice for the Dubai flight',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unread: 0,
    type: 'client',
    status: 'active',
    flightId: 'FLT-OP-JETS-20230610-5678',
  },
];

// Mock data for messages in a conversation
const mockMessages = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    sender: 'John Smith',
    senderType: 'client',
    message: "Hi, I wanted to confirm our departure time for tomorrow's flight.",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    sender: 'Operator',
    senderType: 'operator',
    message:
      'Hello John, your flight is scheduled for departure at 10:00 AM. Please arrive at the terminal at least 1 hour before.',
    timestamp: new Date(Date.now() - 55 * 60 * 1000),
    read: true,
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    sender: 'John Smith',
    senderType: 'client',
    message: 'Thank you. Is there any change in the weather forecast?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
  },
  {
    id: 'msg4',
    conversationId: 'conv1',
    sender: 'John Smith',
    senderType: 'client',
    message: 'Also, can we bring an extra piece of luggage?',
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    read: false,
  },
];

export default function OperatorMessages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('conv1');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter conversations based on search query
  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.flightId && conv.flightId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get messages for the selected conversation
  const conversationMessages = mockMessages.filter(
    (msg) => msg.conversationId === selectedConversation
  );

  // Current conversation details
  const currentConversation = mockConversations.find((conv) => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsLoading(true);

    // Simulate sending a message
    setTimeout(() => {
      setNewMessage('');
      setIsLoading(false);

      // In a real application, this would add the message to the database
      // and then update the UI accordingly
    }, 800);
  };

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', height: '80vh', display: 'flex' }}>
      {/* Conversation list sidebar */}
      <Box
        sx={{
          width: 320,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            Messages
          </Typography>
          <TextField
            placeholder="Search conversations..."
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List disablePadding>
            {filteredConversations.map((conversation) => (
              <ListItem disablePadding key={conversation.id}>
                <ListItemButton
                  selected={selectedConversation === conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  sx={{
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  {conversation.unread > 0 && (
                    <ListItemAvatar>
                      <MuiChip
                        color="error"
                        label={conversation.unread}
                        size="small"
                      />
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight={conversation.unread > 0 ? 'bold' : 'regular'}
                          noWrap
                        >
                          {conversation.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(conversation.timestamp, 'HH:mm')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{
                            fontWeight: conversation.unread > 0 ? 'medium' : 'regular',
                            color: conversation.unread > 0 ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {conversation.lastMessage}
                        </Typography>
                        {conversation.flightId && (
                          <MuiChip
                            size="small"
                            label={conversation.flightId.split('-').slice(-1)[0]}
                            variant="outlined"
                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
      {/* Chat area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
        }}
      >
        {selectedConversation ? (
          <>
            {/* Conversation header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MuiAvatar
                    src={currentConversation?.avatar}
                    sx={{
                      mr: 1.5,
                      bgcolor:
                        currentConversation?.type === 'support' ? 'primary.main' : 'secondary.main',
                    }}
                  >
                    {currentConversation?.type === 'support' ? <BusinessIcon /> : <PersonIcon />}
                  </MuiAvatar>
                  <Box>
                    <Typography variant="h6">{currentConversation?.name}</Typography>
                    {currentConversation?.flightId && (
                      <MuiChip
                        size="small"
                        label={currentConversation.flightId}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                <MuiChip
                  label={currentConversation?.type === 'support' ? 'Charter Support' : 'Client'}
                  color={currentConversation?.type === 'support' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Box>
            </Box>

            {/* Messages area */}
            <Box
              sx={{
                p: 2,
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
              }}
            >
              {conversationMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.senderType === 'operator' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 0.5 }}>
                    {message.senderType !== 'operator' && (
                      <MuiAvatar
                        src={currentConversation?.avatar}
                        sx={{ width: 32, height: 32, mr: 1 }}
                      />
                    )}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        maxWidth: '70%',
                        bgcolor:
                          message.senderType === 'operator' ? 'primary.main' : 'background.paper',
                        color:
                          message.senderType === 'operator'
                            ? 'primary.contrastText'
                            : 'text.primary',
                        ml: message.senderType === 'operator' ? 'auto' : 0,
                        mr: message.senderType === 'operator' ? 0 : 'auto',
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2">{message.message}</Typography>
                    </Paper>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      ml: message.senderType === 'operator' ? 'auto' : 0,
                      mr: message.senderType === 'operator' ? 1 : 0,
                      px: 1,
                    }}
                  >
                    {format(message.timestamp, 'HH:mm')}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Message input area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Grid container spacing={1}>
                <Grid size="grow">
                  <TextField
                    placeholder="Type a message..."
                    fullWidth
                    multiline
                    maxRows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton>
                            <AttachFileIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={
                      isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />
                    }
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    sx={{ height: '100%' }}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Flight information if applicable */}
            {currentConversation?.flightId && (
              <Alert
                severity="info"
                variant="outlined"
                sx={{
                  position: 'absolute',
                  bottom: 80,
                  right: 16,
                  maxWidth: 320,
                  boxShadow: 2,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                }}
                icon={<FlightIcon />}
              >
                <Typography variant="body2">
                  This conversation is related to flight{' '}
                  <strong>{currentConversation.flightId}</strong>.
                </Typography>
                <Button
                  size="small"
                  color="inherit"
                  sx={{ mt: 1 }}
                  href={`/dashboard/bookings/${currentConversation.flightId}`}
                >
                  View Flight Details
                </Button>
              </Alert>
            )}
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 400, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select a Conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a conversation from the list to start messaging. All your communication with
                clients and Charter support is in one place.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
