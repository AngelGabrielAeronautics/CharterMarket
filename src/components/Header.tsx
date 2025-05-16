'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, Button, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme as useCharterTheme } from '@/contexts/ThemeContext';
import Logo from './Logo';

export default function Header() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCharterTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={isScrolled ? 1 : 0}
      sx={(t) => ({
        backgroundColor: isScrolled
          ? alpha(t.palette.background.paper, 0.5)
          : 'transparent',
        color: isScrolled
          ? t.palette.text.primary
          : t.palette.common.white,
        transition: t.transitions.create(['background-color'], {
          duration: t.transitions.duration.short,
        }),
        boxShadow: 'none !important',
      })}
    >
      <Toolbar
        sx={{
          height: 96,
          px: { xs: 2, sm: 3, lg: 4 },
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Logo
            href="/"
            sx={{ color: 'inherit' }}
            srcOverride={
              isScrolled
                ? '/branding/logos/dark/charter logo - light mode.png'
                : '/branding/logos/light/charter logo - dark mode.png'
            }
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={toggleTheme} sx={{ color: 'inherit' }}>
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Link href="/login" passHref>
            <Button sx={{ color: isScrolled ? 'text.primary' : 'common.white' }}>Login</Button>
          </Link>
          <Link href="/register" passHref>
            <Button sx={{ color: isScrolled ? 'text.primary' : 'common.white' }}>Register</Button>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 