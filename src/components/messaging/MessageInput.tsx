'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  Close,
  Description,
  Image,
} from '@mui/icons-material';

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string, replyToMessageId?: string) => Promise<string>;
  onSendFile: (content: string, files: File[]) => Promise<string>;
  onStartTyping: () => void;
  onStopTyping: () => void;
  sending: boolean;
  error: string | null;
  disabled?: boolean;
  placeholder?: string;
  replyToMessageId?: string;
  onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  onSendFile,
  onStartTyping,
  onStopTyping,
  sending,
  error,
  disabled = false,
  placeholder = "Type a message...",
  replyToMessageId,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState<null | HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Common emoji shortcuts
  const commonEmojis = ['😊', '😄', '😃', '😁', '😆', '🤣', '😂', '😅', '👍', '👎', '❤️', '🔥'];

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.trim() && !disabled) {
      onStartTyping();
      
      // Auto-stop typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 3000);
    } else {
      onStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [onStartTyping, onStopTyping, disabled]);

  const handleSendMessage = useCallback(async () => {
    const content = message.trim();
    if (!content && attachedFiles.length === 0) return;
    if (disabled || sending) return;

    try {
      // Stop typing indicator
      onStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (attachedFiles.length > 0) {
        await onSendFile(content, attachedFiles);
      } else {
        await onSendMessage(content, replyToMessageId);
      }

      // Reset form
      setMessage('');
      setAttachedFiles([]);
      if (onCancelReply) {
        onCancelReply();
      }
      
      // Focus back on input
      textInputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [message, attachedFiles, disabled, sending, onSendMessage, onSendFile, onStopTyping, replyToMessageId, onCancelReply]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveFile = useCallback((indexToRemove: number) => {
    setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleEmojiClick = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiMenuAnchor(null);
    textInputRef.current?.focus();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Validate and add files
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'relative',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(25, 118, 210, 0.1)',
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <AttachFile sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Box sx={{ color: 'primary.main', fontWeight: 500 }}>
              Drop files here to attach
            </Box>
          </Box>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Reply Indicator */}
      {replyToMessageId && onCancelReply && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            borderLeft: '3px solid',
            borderColor: 'primary.main',
          }}
        >
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            Replying to message
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachedFiles.map((file, index) => (
              <Chip
                key={index}
                icon={isImageFile(file) ? <Image /> : <Description />}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => handleRemoveFile(index)}
                variant="outlined"
                sx={{ maxWidth: '250px' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* File Attachment Button */}
        <Tooltip title="Attach files">
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending}
            sx={{ mb: 0.5 }}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>

        {/* Emoji Button */}
        <Tooltip title="Add emoji">
          <IconButton
            onClick={(e) => setEmojiMenuAnchor(e.currentTarget)}
            disabled={disabled || sending}
            sx={{ mb: 0.5 }}
          >
            <EmojiEmotions />
          </IconButton>
        </Tooltip>

        {/* Text Input */}
        <TextField
          ref={textInputRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? 'This conversation is closed' : placeholder}
          disabled={disabled || sending}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
            },
          }}
        />

        {/* Send Button */}
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={disabled || sending || (!message.trim() && attachedFiles.length === 0)}
          sx={{
            minWidth: 'auto',
            px: 2,
            py: 1,
            mb: 0.5,
          }}
          startIcon={sending ? <CircularProgress size={16} /> : <Send />}
        >
          {sending ? '' : 'Send'}
        </Button>
      </Box>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Emoji Menu */}
      <Menu
        anchorEl={emojiMenuAnchor}
        open={Boolean(emojiMenuAnchor)}
        onClose={() => setEmojiMenuAnchor(null)}
        PaperProps={{
          sx: { maxWidth: '300px' }
        }}
      >
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5 }}>
          {commonEmojis.map((emoji) => (
            <MenuItem
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              sx={{
                minWidth: 'auto',
                p: 1,
                textAlign: 'center',
                fontSize: '1.2rem',
              }}
            >
              {emoji}
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </Box>
  );
};

export default MessageInput; 