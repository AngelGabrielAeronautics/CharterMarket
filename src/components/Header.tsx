'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  useTheme,
  Avatar,
  Typography,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme as useCharterTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

export default function Header() {
  const theme = useTheme();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useCharterTheme();
  const { user, profile, logout, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCloseDropdown = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setIsDropdownOpen(false);
  };

  return (
    <AppBar
      position="fixed"
      elevation={isScrolled ? 1 : 0}
      sx={(t) => ({
        backgroundColor: isScrolled ? alpha(t.palette.background.paper, 0.5) : 'transparent',
        color: isScrolled ? t.palette.text.primary : t.palette.common.white,
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

          {!loading && profile ? (
            <>
              <Button
                ref={anchorRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                sx={{
                  color: isScrolled ? 'text.primary' : 'common.white',
                  textTransform: 'none',
                  p: 1,
                  '&:hover': {
                    bgcolor: isScrolled ? 'action.hover' : alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: theme.spacing(4),
                      height: theme.spacing(4),
                      bgcolor: 'primary.main',
                      fontSize: theme.typography.body2.fontSize,
                      fontWeight: theme.typography.body2.fontWeight,
                    }}
                  >
                    {profile.firstName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      textAlign: 'left',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: isScrolled ? 'text.primary' : 'common.white',
                      }}
                      noWrap
                    >
                      {profile.firstName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isScrolled
                          ? 'text.secondary'
                          : alpha(theme.palette.common.white, 0.8),
                      }}
                      noWrap
                    >
                      {profile.userCode}
                    </Typography>
                  </Box>
                  <KeyboardArrowDownIcon
                    sx={{
                      color: isScrolled ? 'text.secondary' : alpha(theme.palette.common.white, 0.8),
                      transition: 'transform 0.2s',
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </Box>
              </Button>

              <Popper
                open={isDropdownOpen}
                anchorEl={anchorRef.current}
                placement="bottom-end"
                transition
                sx={{
                  zIndex: theme.zIndex.modal,
                  width: {
                    xs: `calc(100vw - ${theme.spacing(4)})`,
                    sm: theme.spacing(32),
                  },
                }}
              >
                {({ TransitionProps }) => (
                  <Grow {...TransitionProps}>
                    <Paper
                      elevation={4}
                      sx={{
                        mt: 1,
                        borderRadius: theme.shape.borderRadius,
                        overflow: 'hidden',
                      }}
                    >
                      <ClickAwayListener onClickAway={handleCloseDropdown}>
                        <Box>
                          <Box
                            sx={{
                              p: 2,
                              borderBottom: 1,
                              borderColor: 'divider',
                            }}
                          >
                            <Typography variant="subtitle2" color="text.primary">
                              Account Details
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ wordBreak: 'break-all' }}
                            >
                              {profile.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              <Box component="span" fontWeight="medium">
                                User Code:
                              </Box>{' '}
                              {profile.userCode}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <Box component="span" fontWeight="medium">
                                Account Type:
                              </Box>{' '}
                              <Box component="span" sx={{ textTransform: 'capitalize' }}>
                                {profile.role}
                              </Box>
                            </Typography>
                          </Box>

                          <List sx={{ p: 0 }}>
                            <ListItem
                              component={Link}
                              href="/dashboard"
                              onClick={() => setIsDropdownOpen(false)}
                              sx={{
                                px: 2,
                                py: 1.5,
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <DashboardIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary="Dashboard"
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.primary',
                                }}
                              />
                            </ListItem>
                            <ListItem
                              component={Link}
                              href="/dashboard/profile"
                              onClick={() => setIsDropdownOpen(false)}
                              sx={{
                                px: 2,
                                py: 1.5,
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <PersonIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary="User Profile"
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.primary',
                                }}
                              />
                            </ListItem>

                            <Divider />

                            <ListItem
                              onClick={handleSignOut}
                              sx={{
                                px: 2,
                                py: 1.5,
                                '&:hover': { bgcolor: 'action.hover' },
                                cursor: 'pointer',
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <LogoutIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary="Sign Out"
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.primary',
                                }}
                              />
                            </ListItem>
                          </List>
                        </Box>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button sx={{ color: isScrolled ? 'text.primary' : 'common.white' }}>Login</Button>
              </Link>
              <Link href="/register" passHref>
                <Button sx={{ color: isScrolled ? 'text.primary' : 'common.white' }}>
                  Register
                </Button>
              </Link>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
