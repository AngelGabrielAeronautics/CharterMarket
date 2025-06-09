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
  Switch,
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
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import GetAppIcon from '@mui/icons-material/GetApp';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
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
    name: 'Company Profile',
    href: '/dashboard/company-profile',
    icon: <BusinessIcon />,
    roles: ['operator', 'agent'],
  },
  {
    name: 'Passengers',
    href: '/dashboard/passengers',
    icon: <PeopleIcon />,
    roles: ['passenger', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Bookings',
    href: '/dashboard/bookings',
    icon: <BookIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Flights',
    href: '/dashboard/flights',
    icon: <FlightIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: <ReceiptIcon />,
    roles: ['passenger', 'agent'],
  },
  {
    name: 'Quotes',
    href: '/dashboard/quotes',
    icon: <ListAltIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Quote Requests',
    href: '/dashboard/quotes/incoming',
    icon: <ListAltIcon />,
    roles: ['operator'],
  },
  {
    name: 'My Submitted Quotes',
    href: '/dashboard/my-quotes',
    icon: <ListAltIcon />,
    roles: ['operator'],
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
    name: 'Payments',
    href: '/admin/payments',
    icon: <PaymentIcon />,
    roles: ['admin', 'superAdmin'],
  },
  {
    name: 'Admin Management',
    href: '/dashboard/admin',
    icon: <ShieldIcon />,
    roles: ['superAdmin'],
  },
  {
    name: 'Download App',
    href: '/download',
    icon: <PhoneIphoneIcon />,
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
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
        name: 'Test Loading',
        href: '/test-loading',
        icon: <ViewQuiltIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Responsive Test',
        href: '/responsive-test',
        icon: <ViewQuiltIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Admin Register',
        href: '/admin/register',
        icon: <PersonIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Operator Manifests',
        href: '/operator/manifests',
        icon: <ListAltIcon />,
        roles: ['superAdmin'],
      },
      {
        name: 'Operator Fleet',
        href: '/operator/fleet',
        icon: <FlightIcon />,
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

export default function SideNav({
  userRole,
  isMobile,
  onCloseMobile,
  mini,
  onToggleMini,
}: SideNavProps) {
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
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((item) => item !== itemName) : [...prev, itemName]
    );
  };

  // Use theme spacing tokens for drawer widths
  const drawerWidth = theme.spacing(32); // 32 * 8 = 256px
  const collapsedWidth = theme.spacing(6); // 6 * 8 = 48px - even more compact
  const drawerWidthPx = mini ? collapsedWidth : drawerWidth;

  const isPathActive = (path: string, exact: boolean = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const content = (
    <Paper
      elevation={0}
      square
      sx={{
        p: mini ? 0.5 : 2, // Minimal padding in mini mode
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: drawerWidthPx,
        bgcolor: 'background.paper',
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: 'visible',
        boxShadow: 'none',
        border: 'none',
        position: 'relative',
      }}
    >
      {/* Logo at top */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(mini && {
            width: '100%',
            height: theme.spacing(4.5), // Reduced height in mini mode
            mt: 0.5,
            mb: 0,
            px: 0,
            flexShrink: 0,
          }),
          ...(!mini && {
            px: 2,
            py: 2,
          }),
        }}
      >
        {mini ? (
          <Image
            src="/branding/favicon/Charter-favicon-32x32.png"
            alt="Charter favicon"
            width={20}
            height={20}
          />
        ) : (
          <Tooltip title="Go to Home" arrow>
            <Logo href="/" height={40} sx={{ cursor: 'pointer' }} />
          </Tooltip>
        )}
      </Box>

      {/* Header with user name and collapse toggle */}
      <Box
        sx={{
          px: mini ? 0 : 2,
          py: mini ? 0.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: mini ? 'center' : 'space-between',
          mb: mini ? 0 : 1,
        }}
      >
        {!mini && profile && (
          <Typography variant="subtitle1" fontWeight="bold">
            {profile.firstName} {profile.lastName}
          </Typography>
        )}
        <IconButton
          onClick={onToggleMini}
          size="small"
          sx={{
            color: 'text.primary',
            ...(mini && {
              padding: 0.5,
            }),
          }}
        >
          {mini ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Close button for mobile */}
      {isMobile && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: { xs: 'flex', lg: 'none' },
            justifyContent: 'flex-end',
          }}
        >
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

      {/* Navigation Items - Make this section scrollable and more compact in mini mode */}
      <Box
        sx={{
          flexGrow: 1,
          pt: mini ? 0.5 : 3,
          pb: mini ? 0.5 : 2,
          overflow: 'auto', // Allow scrolling
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <List
          role="menu"
          sx={{
            px: mini ? 0 : 1,
            // Reduce vertical spacing between nav items in mini mode
            '& > div': mini
              ? {
                  marginBottom: '2px',
                }
              : {},
          }}
        >
          {navigation
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const active = item.children
                ? isPathActive(item.href)
                : isPathActive(item.href, true);
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
                            boxShadow: theme.shadows[1],
                          },
                        },
                        arrow: {
                          sx: { color: 'background.paper' },
                        },
                      }}
                    >
                      <ListItemButton
                        role="menuitem"
                        aria-expanded={
                          item.children ? expandedItems.includes(item.name) : undefined
                        }
                        {...(item.children
                          ? { onClick: () => toggleExpanded(item.name) }
                          : {
                              component: Link,
                              href: item.href,
                              onClick: isMobile ? onCloseMobile : undefined,
                            })}
                        onMouseEnter={
                          mini && item.children
                            ? (e) => {
                                setSubmenuAnchorEl(e.currentTarget);
                                setSubmenuName(item.name);
                              }
                            : undefined
                        }
                        sx={{
                          position: 'relative',
                          borderRadius: `${theme.shape.borderRadius}px`,
                          mb: mini ? 0 : 0.5,
                          pl: mini ? 0 : 2,
                          pr: mini ? 0 : 2,
                          py: mini ? 0.5 : 1.25,
                          justifyContent: mini ? 'center' : 'flex-start',
                          color: active ? 'primary.main' : 'text.primary',
                          ...(mini
                            ? {
                                minHeight: theme.spacing(4.25), // More compact height for mini items
                                minWidth: theme.spacing(4.25),
                              }
                            : {}),
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: mini ? '4px' : '8px',
                            bottom: mini ? '4px' : '8px',
                            width: mini ? '2px' : '3px',
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
                            ...(mini
                              ? {
                                  fontSize: '1rem',
                                  margin: 0,
                                  padding: 0,
                                }
                              : {}),
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
                        {!mini &&
                          item.children &&
                          (expandedItems.includes(item.name) ? (
                            <ExpandLessIcon
                              fontSize="small"
                              sx={{ color: active ? 'primary.main' : 'text.secondary' }}
                            />
                          ) : (
                            <ExpandMoreIcon
                              fontSize="small"
                              sx={{ color: active ? 'primary.main' : 'text.secondary' }}
                            />
                          ))}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {item.children && !mini && (
                    <Collapse in={expandedItems.includes(item.name)} timeout="auto" unmountOnExit>
                      <List role="menu" component="div" disablePadding sx={{ pl: 2 }}>
                        {item.children
                          .filter((child) => child.roles.includes(userRole))
                          .map((child) => {
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
                                        boxShadow: theme.shadows[1],
                                      },
                                    },
                                    arrow: {
                                      sx: { color: 'background.paper' },
                                    },
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
                                        ? item.children
                                          ? 'space-between'
                                          : 'center'
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
                                        backgroundColor: childActive
                                          ? 'primary.main'
                                          : 'transparent',
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
                                        primaryTypographyProps={{
                                          variant: 'body2',
                                          fontWeight: childActive ? 'medium' : 'regular',
                                        }}
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
            popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 4] } }] }}
          >
            <Paper
              elevation={4}
              sx={{
                mt: 0.5,
                borderRadius: `${theme.shape.borderRadius}px`,
                overflow: 'hidden',
                p: 0.25,
                maxWidth: 'max-content',
              }}
              onMouseLeave={() => setSubmenuAnchorEl(null)}
            >
              <List disablePadding dense>
                {navigation
                  .find((item) => item.name === submenuName)
                  ?.children?.filter((child) => child.roles.includes(userRole))
                  .map((child) => (
                    <ListItem key={child.name} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={child.href}
                        onClick={isMobile ? onCloseMobile : undefined}
                        sx={{
                          py: 0.75,
                          px: 1.5,
                          justifyContent: 'flex-start',
                          color: isPathActive(child.href, true) ? 'primary.main' : 'text.primary',
                          minHeight: 32,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                            justifyContent: 'center',
                            color: isPathActive(child.href, true)
                              ? 'primary.main'
                              : 'text.secondary',
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.name}
                          primaryTypographyProps={{
                            fontWeight: isPathActive(child.href, true) ? 'medium' : 'regular',
                            variant: 'body2',
                            fontSize: '0.875rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </Paper>
          </Popper>
        )}
      </Box>

      {/* Bottom section - fixed at the bottom */}
      <Box
        sx={{
          mt: 'auto',
          pt: mini ? 0.5 : 2,
          width: '100%',
          bgcolor: 'background.paper',
        }}
      >
        {/* Notifications & Profile section */}
        <Divider sx={{ mb: mini ? 0.5 : 2 }} />
        <Box
          sx={{
            px: mini ? 0 : 1,
            py: mini ? 0.25 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: mini ? 0.25 : 1,
          }}
        >
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: mini ? 0.5 : 1 }}>
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
                      boxShadow: theme.shadows[1],
                    },
                  },
                  arrow: {
                    sx: { color: 'background.paper' },
                  },
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
            <Tooltip
              title="Account"
              disableHoverListener={!mini}
              placement="right"
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    boxShadow: theme.shadows[1],
                  },
                },
                arrow: {
                  sx: { color: 'background.paper' },
                },
              }}
            >
              <span>
                <AccountDropdown
                  userEmail={user.email || ''}
                  firstName={profile.firstName}
                  compact={mini}
                />
              </span>
            </Tooltip>
          )}
        </Box>

        {/* Theme toggle section */}
        <Divider sx={{ my: mini ? 0.5 : 2 }} />
        <Box sx={{ px: mini ? 0 : 1, mb: mini ? 0.5 : 2 }}>
          {mini ? (
            // Mini Mode: Icons above Switch toggle
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 0.25,
                width: '100%',
              }}
            >
              {/* Row 1: Icons */}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-around', width: '100%', mb: 0.25 }}
              >
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
                        boxShadow: theme.shadows[1],
                      },
                    },
                    arrow: {
                      sx: { color: 'background.paper' },
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!isDarkMode) toggleTheme();
                    }}
                    aria-label="Switch to dark theme"
                    sx={{
                      color: isDarkMode ? 'primary.main' : 'text.secondary',
                      p: 0.25,
                      '& .MuiSvgIcon-root': {
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <Brightness4Icon fontSize="small" />
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
                        boxShadow: theme.shadows[1],
                      },
                    },
                    arrow: {
                      sx: { color: 'background.paper' },
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (isDarkMode) toggleTheme();
                    }}
                    aria-label="Switch to light theme"
                    sx={{
                      color: !isDarkMode ? 'primary.main' : 'text.secondary',
                      p: 0.25,
                      '& .MuiSvgIcon-root': {
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    <Brightness7Icon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {/* Row 2: Switch */}
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                size="small"
                sx={{
                  mt: 0,
                  transform: 'scale(0.8)',
                  p: 0,
                }}
              />
            </Box>
          ) : (
            // Expanded Mode: Custom "DARK" - Switch - "LIGHT" toggle
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                py: 1,
                borderRadius: `${theme.shape.borderRadius}px`,
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
                onClick={() => !isDarkMode && toggleTheme()}
              >
                Dark
              </Typography>
              <Switch checked={isDarkMode} onChange={toggleTheme} size="small" />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: !isDarkMode ? 'bold' : 'normal',
                  color: !isDarkMode ? 'text.primary' : 'text.secondary',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                onClick={() => isDarkMode && toggleTheme()}
              >
                Light
              </Typography>
            </Box>
          )}
        </Box>
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
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
          boxShadow: 'none',
          border: 'none',
          left: theme.spacing(4),
          top: theme.spacing(4),
          height: `calc(100% - ${theme.spacing(8)})`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        },
      }}
    >
      {content}
    </Drawer>
  ) : (
    <Box
      component="nav"
      sx={{
        width: drawerWidthPx,
        flexShrink: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: 'hidden',
        position: 'relative',
        '& > div': {
          borderRadius: `${Number(theme.shape.borderRadius) * 2}px`,
          overflow: 'visible',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        },
      }}
    >
      {content}
    </Box>
  );
}
