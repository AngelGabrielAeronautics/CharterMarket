'use client';

import { useTheme as useAppTheme } from '@/contexts/ThemeContext';
import { Box, Typography, Switch, Button } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function DarkModeToggle() {
  const { isDarkMode, toggleTheme } = useAppTheme();

  return (
    <Button
      onClick={toggleTheme}
      fullWidth
      sx={{
        justifyContent: 'flex-start',
        textTransform: 'none',
        py: 1.5,
        px: 2,
        color: 'text.primary'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isDarkMode ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}
          <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'uppercase' }}>
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Typography>
        </Box>
        
        <Switch
          checked={isDarkMode}
          onChange={toggleTheme}
          color="primary"
          size="small"
        />
      </Box>
    </Button>
  );
} 