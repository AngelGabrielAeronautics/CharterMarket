'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useConversationManager } from '@/hooks/useMessaging';
import { ConversationType } from '@/types/message';

interface CreateConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
  preselectedUserCodes?: string[];
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string;
}

// Mock user data - in real app, this would come from API
const mockUsers = [
  { userCode: 'OP001', name: 'Atlantic Airways', role: 'operator', email: 'ops@atlanticair.com' },
  { userCode: 'PA001', name: 'John Smith', role: 'passenger', email: 'john@example.com' },
  { userCode: 'AG001', name: 'Sarah Johnson', role: 'agent', email: 'sarah@travelagent.com' },
  { userCode: 'OP002', name: 'Sky Elite Jets', role: 'operator', email: 'contact@skyelite.com' },
  { userCode: 'PA002', name: 'Michael Brown', role: 'passenger', email: 'michael@example.com' },
];

const CreateConversationDialog: React.FC<CreateConversationDialogProps> = ({
  open,
  onClose,
  onConversationCreated,
  preselectedUserCodes = [],
  contextType: defaultContextType = 'general',
  contextId,
}) => {
  const [title, setTitle] = useState('');
  const [conversationType, setConversationType] = useState<ConversationType>('general_inquiry');
  const [contextType, setContextType] = useState<'quote' | 'booking' | 'invoice' | 'general'>(defaultContextType);
  const [selectedUsers, setSelectedUsers] = useState<typeof mockUsers>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const { createConversation, creating, error } = useConversationManager();

  // Initialize preselected users
  React.useEffect(() => {
    if (preselectedUserCodes.length > 0) {
      const preselected = mockUsers.filter(user => 
        preselectedUserCodes.includes(user.userCode)
      );
      setSelectedUsers(preselected);
    }
  }, [preselectedUserCodes]);

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    try {
      const conversationData = {
        title: title || `Conversation with ${selectedUsers.map(u => u.name).join(', ')}`,
        type: conversationType,
        participantUserCodes: selectedUsers.map(u => u.userCode),
        contextType,
        contextId,
        tags: tags.length > 0 ? tags : undefined,
        allowFileUploads: true,
        emailIntegrationEnabled: true,
        whatsappIntegrationEnabled: false,
        priority: 'normal' as const,
      };

      const conversationId = await createConversation(conversationData);
      onConversationCreated(conversationId);
      handleClose();
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleClose = () => {
    setTitle('');
    setConversationType('general_inquiry');
    setContextType('general');
    setSelectedUsers([]);
    setTags([]);
    setCurrentTag('');
    onClose();
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && currentTag.trim()) {
      event.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="create-conversation-title"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Start New Conversation
        </Typography>
        <Button
          onClick={handleClose}
          size="small"
          sx={{ minWidth: 'auto', p: 1 }}
          aria-label="Close dialog"
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Participants Selection */}
          <Autocomplete
            multiple
            options={mockUsers}
            getOptionLabel={(option) => `${option.name} (${option.role})`}
            value={selectedUsers}
            onChange={(_, newValue) => setSelectedUsers(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Participants"
                placeholder="Start typing to search users..."
                required
                error={selectedUsers.length === 0}
                helperText={selectedUsers.length === 0 ? 'At least one participant is required' : ''}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={`${option.name} (${option.role})`}
                  {...getTagProps({ index })}
                  key={option.userCode}
                />
              ))
            }
            isOptionEqualToValue={(option, value) => option.userCode === value.userCode}
          />

          {/* Conversation Title */}
          <TextField
            label="Conversation Title (Optional)"
            placeholder="Enter a custom title for this conversation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            helperText="If left empty, a title will be generated automatically"
          />

          {/* Conversation Type */}
          <FormControl fullWidth>
            <InputLabel>Conversation Type</InputLabel>
            <Select
              value={conversationType}
              onChange={(e) => setConversationType(e.target.value as ConversationType)}
              label="Conversation Type"
            >
              <MenuItem value="general_inquiry">General Inquiry</MenuItem>
              <MenuItem value="quote_discussion">Quote Discussion</MenuItem>
              <MenuItem value="booking_support">Booking Support</MenuItem>
              <MenuItem value="payment_discussion">Payment Discussion</MenuItem>
              <MenuItem value="admin_support">Admin Support</MenuItem>
            </Select>
          </FormControl>

          {/* Context Type */}
          <FormControl fullWidth>
            <InputLabel>Context</InputLabel>
            <Select
              value={contextType}
              onChange={(e) => setContextType(e.target.value as typeof contextType)}
              label="Context"
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="quote">Quote Related</MenuItem>
              <MenuItem value="booking">Booking Related</MenuItem>
              <MenuItem value="invoice">Invoice Related</MenuItem>
            </Select>
          </FormControl>

          {/* Context ID */}
          {contextType !== 'general' && (
            <TextField
              label={`${contextType.charAt(0).toUpperCase() + contextType.slice(1)} ID`}
              placeholder={`Enter the ${contextType} ID this conversation relates to`}
              value={contextId || ''}
              disabled={!!contextId}
              fullWidth
              helperText={contextId ? 'This conversation is linked to a specific context' : ''}
            />
          )}

          {/* Tags */}
          <Box>
            <TextField
              label="Add Tags"
              placeholder="Type and press Enter to add tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              helperText="Tags help organize and categorize conversations"
            />
            
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Participant Preview */}
          {selectedUsers.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Conversation Participants ({selectedUsers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedUsers.map((user) => (
                  <Box
                    key={user.userCode}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.role} • {user.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'operator' ? 'primary' : 'secondary'}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={creating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={creating || selectedUsers.length === 0}
        >
          {creating ? 'Creating...' : 'Start Conversation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateConversationDialog; 