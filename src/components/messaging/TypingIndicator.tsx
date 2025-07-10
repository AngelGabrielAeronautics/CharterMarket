'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { TypingIndicator as TypingIndicatorType } from '@/types/message';

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorType[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    const names = typingUsers.map(user => user.userName);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        my: 1,
        px: 1,
      }}
    >
      {/* Spacer for avatar alignment */}
      <Box sx={{ width: 32, height: 32 }} />

      {/* Typing Bubble */}
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          bgcolor: 'background.paper',
          borderRadius: 2,
          borderTopLeftRadius: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {getTypingText()}
        </Typography>
        
        {/* Animated dots */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
          }}
        >
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 4,
                height: 4,
                bgcolor: 'text.secondary',
                borderRadius: '50%',
                animation: 'typingDot 1.4s infinite ease-in-out',
                animationDelay: `${index * 0.16}s`,
                '@keyframes typingDot': {
                  '0%, 80%, 100%': {
                    transform: 'scale(0)',
                    opacity: 0.5,
                  },
                  '40%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
              }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default TypingIndicator; 