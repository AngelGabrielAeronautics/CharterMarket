'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole } from '@/lib/userCode';
import { 
  Box, 
  Button, 
  Avatar, 
  Typography, 
  Paper, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Popper,
  Grow,
  ClickAwayListener,
  IconButton,
  useTheme as useMuiTheme
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { ListItemIcon } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface AccountDropdownProps {
  userEmail: string;
  firstName: string;
  compact?: boolean;
}

export default function AccountDropdown({ userEmail, firstName, compact }: AccountDropdownProps) {
  const theme = useMuiTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const anchorRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (userEmail) {
      fetchUserDetails();
    }
  }, [userEmail]);

  const fetchUserDetails = async () => {
    if (!userEmail) return;

    try {
      const q = query(collection(db, 'users'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserCode(userData.userCode || '');
        setRole(userData.role || '');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setIsOpen(false);
  };

  return (
    <Box>
      <Button
        ref={anchorRef}
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          color: 'text.primary',
          textTransform: 'none',
          p: 1,
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <Avatar
            sx={{
              width: theme.spacing(4),
              height: theme.spacing(4),
              bgcolor: 'primary.main',
              fontSize: theme.typography.body2.fontSize,
              fontWeight: theme.typography.body2.fontWeight
            }}
          >
            {firstName.charAt(0).toUpperCase()}
          </Avatar>
          {!compact && (
            <Box sx={{ 
              display: { xs: 'none', sm: 'block' },
              textAlign: 'left'
            }}>
              <Typography variant="body2" color="text.primary" noWrap>
                {firstName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {userCode}
              </Typography>
            </Box>
          )}
          {!compact && (
            <KeyboardArrowDownIcon 
              sx={{ 
                color: 'text.secondary',
                transition: 'transform 0.2s',
                transform: isOpen ? 'rotate(180deg)' : 'none'
              }} 
            />
          )}
        </Box>
      </Button>

      <Popper
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        sx={{ 
          zIndex: theme.zIndex.modal,
          width: { 
            xs: `calc(100vw - ${theme.spacing(4)})`, 
            sm: theme.spacing(32) 
          }
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper 
              elevation={4}
              sx={{ 
                mt: 1,
                borderRadius: '6px', // subtle rounding
                overflow: 'hidden'
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  <Box sx={{ 
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle2" color="text.primary">
                      Account Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {userEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      <Box component="span" fontWeight="medium">User Code:</Box> {userCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <Box component="span" fontWeight="medium">Account Type:</Box>{' '}
                      <Box component="span" sx={{ textTransform: 'capitalize' }}>{role}</Box>
                    </Typography>
                  </Box>

                  <List sx={{ p: 0 }}>
                    <ListItem
                      component={Link}
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <DashboardIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Dashboard"
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.primary'
                        }}
                      />
                    </ListItem>
                    <ListItem 
                      component={Link} 
                      href="/dashboard/profile"
                      onClick={() => setIsOpen(false)}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="User Profile" 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.primary'
                        }}
                      />
                    </ListItem>

                    <ListItem 
                      component={Link} 
                      href="/dashboard/guide"
                      onClick={() => setIsOpen(false)}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Setup Guide" 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.primary'
                        }}
                      />
                    </ListItem>

                    <ListItem 
                      component={Link} 
                      href="/dashboard/support"
                      onClick={() => setIsOpen(false)}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <HelpIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Help & Support" 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.primary'
                        }}
                      />
                    </ListItem>

                    <Divider />

                    <ListItem 
                      component={Link} 
                      href="/dashboard/profile?action=change-password"
                      onClick={() => setIsOpen(false)}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Change Password" 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.primary'
                        }}
                      />
                    </ListItem>

                    <ListItem 
                      onClick={handleSignOut}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Sign Out" 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'error.main'
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
    </Box>
  );
} 