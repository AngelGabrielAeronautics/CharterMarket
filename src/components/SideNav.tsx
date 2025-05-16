'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/userCode';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  Divider,
  IconButton,
  useTheme as useMuiTheme,
  SvgIcon,
  Tooltip,
  Popper,
  Paper,
  Switch
} from '@mui/material';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import FlightIcon from '@mui/icons-material/Flight';
import BusinessIcon from '@mui/icons-material/Business';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShieldIcon from '@mui/icons-material/Shield';
import SettingsIcon from '@mui/icons-material/Settings';
import StyleIcon from '@mui/icons-material/Style';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import WidgetsIcon from '@mui/icons-material/Widgets';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationDropdown from './NotificationDropdown';
import AccountDropdown from './AccountDropdown';
import Logo from './Logo';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Image from 'next/image';
import Banner from '@/components/Banner';
import tokens from '@/styles/tokens';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: <PersonIcon />,
    roles: ['operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Passengers',
    href: '/dashboard/passengers',
    icon: <PeopleIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Bookings',
    href: '/dashboard/bookings',
    icon: <BookIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Operator Bookings',
    href: '/dashboard/bookings/operator',
    icon: <BookIcon />,
    roles: ['operator'],
  },
  {
    name: 'Aircraft',
    href: '/dashboard/aircraft',
    icon: <FlightIcon />,
    roles: ['operator', 'admin', 'superAdmin'],
  },
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: <BusinessIcon />,
    roles: ['agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: <SupervisorAccountIcon />,
    roles: ['admin', 'superAdmin'],
  },
  {
    name: 'Events',
    href: '/dashboard/events',
    icon: <VisibilityIcon />,
    roles: ['admin', 'superAdmin'],
  },
  {
    name: 'Admin Management',
    href: '/dashboard/admin',
    icon: <ShieldIcon />,
    roles: ['superAdmin'],
  },
  {
    name: 'System Settings',
    href: '/dashboard/settings',
    icon: <SettingsIcon />,
    roles: ['admin', 'superAdmin'],
    children: [
      {
        name: 'Style Guide',
        href: '/admin/dashboard/style-guide',
        icon: <StyleIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Test Pages',
        href: '/dashboard/test',
        icon: <ViewQuiltIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Test Components',
        href: '/dashboard/test/components',
        icon: <WidgetsIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Test Forms',
        href: '/dashboard/test/forms',
        icon: <ListAltIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Test Layouts',
        href: '/dashboard/test/layouts',
        icon: <ViewComfyIcon />,
        roles: ['superAdmin'],
      },
    ],
  },
];

interface SideNavProps {
  userRole: UserRole;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  mini: boolean;
  onToggleMini: () => void;
}

export default function SideNav({ userRole, isMobile, onCloseMobile, mini, onToggleMini }: SideNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState<HTMLElement | null>(null);
  const [submenuName, setSubmenuName] = useState<string>('');
  const theme = useMuiTheme();
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout, user, profile } = useAuth();
  const activeItemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [pathname]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  // Use theme spacing tokens for drawer widths
  const drawerWidth = theme.spacing(32);    // 32 * 8 = 256px
  const collapsedWidth = theme.spacing(9);  // 9 * 8 = 72px
  const drawerWidthPx = mini ? collapsedWidth : drawerWidth;
  
  const isPathActive = (path: string, exact: boolean = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const content = (
    <Paper elevation={0} square sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: drawerWidthPx,
      bgcolor: 'background.paper',
      borderRadius: `${theme.shape.borderRadius}px`,
      overflow: 'visible',
      boxShadow: 'none',
      border: 'none',
    }}>

      {/* Logo at top */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(mini && {
          width: '100%',
          height: theme.spacing(6), // 48px height for the 32px image + padding
          px: 1,
          flexShrink: 0,
        }),
        ...(!mini && {
          px: 2,
          py: 2,
        }),
      }}>
        {mini ? (
          <Image
            src="/branding/favicon/Charter-favicon-32x32.png"
            alt="Charter favicon"
            width={32}
            height={32}
          />
        ) : (
          <Tooltip title="Go to Home" arrow>
            <Logo href="/" height={40} sx={{ cursor: 'pointer' }} />
          </Tooltip>
        )}
      </Box>

      {/* Header with user name and collapse toggle */}
      <Box sx={{ px: mini ? 1 : 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: mini ? 'center' : 'space-between' }}>
        {!mini && profile && (
          <Typography variant="subtitle1" fontWeight="bold">
            {profile.firstName} {profile.lastName}
          </Typography>
        )}
        <IconButton onClick={onToggleMini} size="small" sx={{ color: 'text.primary' }}>
          {mini ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Close button for mobile */}
      {isMobile && (
        <Box sx={{ 
          px: 2, 
          py: 1, 
          display: { xs: 'flex', lg: 'none' }, 
          justifyContent: 'flex-end'
        }}>
          <IconButton
            aria-label="Close sidebar"
            onClick={onCloseMobile}
            size="large"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Navigation Items */}
      <Box sx={{
        flexGrow: 1,
        pt: 3,
        pb: 2,
        overflow: 'auto'
      }}>
        <List role="menu" sx={{ px: 1 }}>
          {navigation.filter(item => item.roles.includes(userRole)).map(item => {
            const active = item.children ? isPathActive(item.href) : isPathActive(item.href, true);
            return (
              <Box key={item.name}>
                <ListItem disablePadding>
                  <Tooltip
                    title={item.name}
                    placement="right"
                    disableHoverListener={!mini}
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          boxShadow: theme.shadows[1]
                        }
                      },
                      arrow: {
                        sx: { color: 'background.paper' }
                      }
                    }}
                  >
                    <ListItemButton
                      role="menuitem"
                      aria-expanded={item.children ? expandedItems.includes(item.name) : undefined}
                      {...(item.children
                        ? { onClick: () => toggleExpanded(item.name) }
                        : { component: Link, href: item.href, onClick: isMobile ? onCloseMobile : undefined })}
                      onMouseEnter={mini && item.children ? (e) => { setSubmenuAnchorEl(e.currentTarget); setSubmenuName(item.name); } : undefined}
                      sx={{
                        position: 'relative',
                        borderRadius: `${theme.shape.borderRadius}px`,
                        mb: 0.5,
                        pl: mini ? 0 : 2,
                        pr: mini ? 0 : 2,
                        py: 1.25,
                        justifyContent: mini
                          ? item.children ? 'space-between' : 'center'
                          : 'flex-start',
                        color: active ? 'primary.main' : 'text.primary',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '8px',
                          bottom: '8px',
                          width: '4px',
                          borderRadius: `${theme.shape.borderRadius}px`,
                          backgroundColor: active ? 'primary.main' : 'transparent',
                        },
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: mini ? 'auto' : 40,
                          justifyContent: 'center',
                          color: active ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!mini && (
                        <ListItemText
                          primary={item.name}
                          primaryTypographyProps={{ fontWeight: active ? 'medium' : 'regular' }}
                        />
                      )}
                      {item.children && (
                        expandedItems.includes(item.name)
                          ? <ExpandLessIcon fontSize="small" sx={{ color: active ? 'primary.main' : 'text.secondary' }} />
                          : <ExpandMoreIcon fontSize="small" sx={{ color: active ? 'primary.main' : 'text.secondary' }} />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
                {item.children && !mini && (
                  <Collapse in={expandedItems.includes(item.name)} timeout="auto" unmountOnExit>
                    <List role="menu" component="div" disablePadding sx={{ pl: 2 }}>
                      {item.children.filter(child => child.roles.includes(userRole)).map(child => {
                        const childActive = isPathActive(child.href, true);
                        return (
                          <ListItem key={child.name} disablePadding>
                            <Tooltip
                              title={child.name}
                              placement="right"
                              disableHoverListener={!mini}
                              arrow
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    bgcolor: 'background.paper',
                                    color: 'text.primary',
                                    fontSize: '0.875rem',
                                    boxShadow: theme.shadows[1]
                                  }
                                },
                                arrow: {
                                  sx: { color: 'background.paper' }
                                }
                              }}
                            >
                              <ListItemButton
                                role="menuitem"
                                component={Link}
                                href={child.href}
                                onClick={isMobile ? onCloseMobile : undefined}
                                sx={{
                                  position: 'relative',
                                  borderRadius: `${theme.shape.borderRadius}px`,
                                  mb: 0.5,
                                  pl: mini ? 0 : 2,
                                  pr: mini ? 0 : 2,
                                  py: 1.25,
                                  justifyContent: mini
                                    ? item.children ? 'space-between' : 'center'
                                    : 'flex-start',
                                  color: childActive ? 'primary.main' : 'text.primary',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    top: '8px',
                                    bottom: '8px',
                                    width: '4px',
                                    borderRadius: `${theme.shape.borderRadius}px`,
                                    backgroundColor: childActive ? 'primary.main' : 'transparent',
                                  },
                                  '&:hover': { backgroundColor: 'action.hover' },
                                }}
                              >
                                <ListItemIcon
                                  sx={{
                                    minWidth: mini ? 'auto' : 40,
                                    justifyContent: 'center',
                                    color: childActive ? 'primary.main' : 'text.secondary',
                                  }}
                                >
                                  {child.icon}
                                </ListItemIcon>
                                {!mini && (
                                  <ListItemText
                                    primary={child.name}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: childActive ? 'medium' : 'regular' }}
                                  />
                                )}
                              </ListItemButton>
                            </Tooltip>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
        {mini && submenuAnchorEl && (
          <Popper
            open
            anchorEl={submenuAnchorEl}
            placement="right-start"
            sx={{ zIndex: theme.zIndex.drawer + 1 }}
            popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
          >
            <Paper 
              elevation={4} 
              sx={{ mt: 1, borderRadius: `${theme.shape.borderRadius}px`, overflow: 'hidden', p: 0.5 }}
              onMouseLeave={() => setSubmenuAnchorEl(null)}
            >
              <List disablePadding>
                {navigation.find(item => item.name === submenuName)?.children
                  ?.filter(child => child.roles.includes(userRole))
                  .map(child => (
                    <ListItem key={child.name} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={child.href}
                        onClick={isMobile ? onCloseMobile : undefined}
                        sx={{
                          py: 1.25,
                          pl: 2,
                          pr: 2,
                          justifyContent: 'flex-start',
                          color: isPathActive(child.href, true) ? 'primary.main' : 'text.primary',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center', color: isPathActive(child.href, true) ? 'primary.main' : 'text.secondary' }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText primary={child.name} primaryTypographyProps={{ fontWeight: isPathActive(child.href, true) ? 'medium' : 'regular' }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </Paper>
          </Popper>
        )}
      </Box>
      
      {/* Notifications & Profile section */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ px: 1, py: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip 
              title="Notifications" 
              disableHoverListener={!mini} 
              placement="right" 
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    boxShadow: theme.shadows[1]
                  }
                },
                arrow: {
                  sx: { color: 'background.paper' }
                }
              }}
            >
              <span>
                <NotificationDropdown userId={user.email || ''} />
              </span>
            </Tooltip>
            {!mini && (
              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                Notifications
              </Typography>
            )}
          </Box>
        )}
        {user && profile && (
          <Tooltip title="Account" disableHoverListener={!mini} placement="right" arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  boxShadow: theme.shadows[1]
                }
              },
              arrow: {
                sx: { color: 'background.paper' }
              }
            }}
          >
            <span> {/* Tooltip needs a DOM element to attach to if AccountDropdown is a functional component or doesn't forward refs */}
              <AccountDropdown userEmail={user.email || ''} firstName={profile.firstName} compact={mini} />
            </span>
          </Tooltip>
        )}
      </Box>
      {/* Bottom controls: theme toggle */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ px: 1 }}>
        {mini ? (
          // Mini Mode: Icons above Switch toggle
          (<Box
            sx={{
              display: 'flex',
              flexDirection: 'column', // Stack rows vertically
              alignItems: 'center',    // Center content horizontally
              py: 0.5, 
              width: '100%',
            }}
          >
            {/* Row 1: Icons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', mb: 0.25 }}>
              <Tooltip 
                title="Switch to dark theme" 
                placement="right"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      boxShadow: theme.shadows[1]
                    }
                  },
                  arrow: {
                    sx: { color: 'background.paper' }
                  }
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => { if (!isDarkMode) toggleTheme(); }}
                  aria-label="Switch to dark theme"
                  sx={{ color: isDarkMode ? 'primary.main' : 'text.secondary', p: theme.spacing(0.25) }}
                >
                  <Brightness4Icon fontSize="small" /> {/* Moon Icon */}
                </IconButton>
              </Tooltip>
              <Tooltip 
                title="Switch to light theme" 
                placement="right"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      boxShadow: theme.shadows[1]
                    }
                  },
                  arrow: {
                    sx: { color: 'background.paper' }
                  }
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => { if (isDarkMode) toggleTheme(); }}
                  aria-label="Switch to light theme"
                  sx={{ color: !isDarkMode ? 'primary.main' : 'text.secondary', p: theme.spacing(0.25) }}
                >
                  <Brightness7Icon fontSize="small" /> {/* Sun Icon */}
                </IconButton>
              </Tooltip>
            </Box>
            {/* Row 2: Switch */}
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              size="small"
              sx={{ mt: 0.25 }} // Add a little space above the switch
            />
          </Box>)
        ) : (
          // Expanded Mode: Custom "DARK" - Switch - "LIGHT" toggle
          (<Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around', // Distributes space around items
              py: 1, // Vertical padding for the whole component
              borderRadius: `${theme.shape.borderRadius}px`,
              // Optional: Add a subtle background or border if needed
              // backgroundColor: 'action.hover',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: isDarkMode ? 'bold' : 'normal',
                color: isDarkMode ? 'text.primary' : 'text.secondary',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onClick={() => !isDarkMode && toggleTheme()} // Click "DARK" to switch to dark
            >
              Dark
            </Typography>
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              size="small"
              sx={{
                // The switch itself
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: !isDarkMode ? 'bold' : 'normal',
                color: !isDarkMode ? 'text.primary' : 'text.secondary',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onClick={() => isDarkMode && toggleTheme()} // Click "LIGHT" to switch to light
            >
              Light
            </Typography>
          </Box>)
        )}
      </Box>
    </Paper>
  );

  // For mobile, we use the Drawer component; for desktop, we use a permanent drawer
  return isMobile ? (
    <Drawer
      variant="temporary"
      open={Boolean(isMobile)}
      onClose={onCloseMobile}
      ModalProps={{ keepMounted: true }} // Better mobile performance
      sx={{
        display: { xs: 'block', lg: 'none' },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRadius: `${theme.shape.borderRadius * 2}px`,
          overflow: 'hidden',
          boxShadow: 'none',
          border: 'none',
          left: theme.spacing(4),
          top: theme.spacing(4),
          height: `calc(100% - ${theme.spacing(8)})`,
        },
      }}
    >
      {content}
    </Drawer>
  ) : (
    // Desktop navigation flows in the layout without fixed positioning
    <Box
      component="nav"
      sx={{
        width: drawerWidthPx,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: 'hidden',
        '& > div': {
          borderRadius: `${theme.shape.borderRadius * 2}px`,
          overflow: 'visible'
        }
      }}
    >
      {content}
    </Box>
  );
} 