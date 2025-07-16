'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  DataUsage as DataIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Assessment as ReportsIcon,
  Build as ToolsIcon,
  AdminPanelSettings as AdminIcon,
  CloudUpload as CloudIcon,
  Delete as CleanupIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface SettingCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  category: 'data' | 'security' | 'system' | 'tools';
  status?: 'available' | 'coming-soon' | 'beta';
}

const settingsCards: SettingCard[] = [
  {
    title: 'Test Data Generator',
    description: 'Generate comprehensive test data including users, aircraft, quotes, and offers for development and testing',
    icon: DataIcon,
    href: '/dashboard/settings/test-data',
    category: 'data',
    status: 'available'
  },
  {
    title: 'User Management',
    description: 'Manage user accounts, roles, and permissions across the platform',
    icon: AdminIcon,
    href: '/dashboard/users',
    category: 'security',
    status: 'available'
  },
  {
    title: 'System Notifications',
    description: 'Configure system-wide notifications and email settings',
    icon: NotificationsIcon,
    href: '/dashboard/settings/notifications',
    category: 'system',
    status: 'coming-soon'
  },
  {
    title: 'Data Backup & Export',
    description: 'Backup system data and export reports for compliance',
    icon: BackupIcon,
    href: '/dashboard/settings/backup',
    category: 'data',
    status: 'coming-soon'
  },
  {
    title: 'Security Settings',
    description: 'Configure authentication, access controls, and security policies',
    icon: SecurityIcon,
    href: '/dashboard/settings/security',
    category: 'security',
    status: 'coming-soon'
  },
  {
    title: 'Storage Management',
    description: 'Monitor and manage database storage, file uploads, and quotas',
    icon: StorageIcon,
    href: '/dashboard/settings/storage',
    category: 'system',
    status: 'coming-soon'
  },
  {
    title: 'Analytics & Reports',
    description: 'Generate system reports and analytics dashboards',
    icon: ReportsIcon,
    href: '/dashboard/settings/reports',
    category: 'tools',
    status: 'coming-soon'
  },
  {
    title: 'Development Tools',
    description: 'Developer utilities, API testing, and debugging tools',
    icon: ToolsIcon,
    href: '/dashboard/settings/dev-tools',
    category: 'tools',
    status: 'beta'
  },
  {
    title: 'Data Cleanup',
    description: 'Clean up test data, expired sessions, and orphaned records',
    icon: CleanupIcon,
    href: '/dashboard/settings/cleanup',
    category: 'data',
    status: 'coming-soon'
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'data': return <DataIcon />;
    case 'security': return <SecurityIcon />;
    case 'system': return <SettingsIcon />;
    case 'tools': return <ToolsIcon />;
    default: return <SettingsIcon />;
  }
};

const getStatusChip = (status?: string) => {
  switch (status) {
    case 'available':
      return <Chip label="Available" color="success" size="small" />;
    case 'beta':
      return <Chip label="Beta" color="warning" size="small" />;
    case 'coming-soon':
      return <Chip label="Coming Soon" color="default" size="small" />;
    default:
      return null;
  }
};

export default function SystemSettingsPage() {
  const { user, profile } = useAuth();

  // Only super admins can access system settings
  if (!user || user.role !== 'superAdmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Access denied. This page is only accessible to Super Administrators.
        </Alert>
      </Box>
    );
  }

  const categories = ['data', 'security', 'system', 'tools'];
  const categoryNames = {
    data: 'Data Management',
    security: 'Security & Access',
    system: 'System Configuration', 
    tools: 'Development Tools'
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SettingsIcon fontSize="large" color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
            System Settings
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Configure system-wide settings, manage data, and access administrative tools.
        </Typography>
      </Box>

      {/* Quick Access Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Quick Access:</strong> Most commonly used features are Test Data Generation and User Management.
          Use these tools carefully as they affect the entire platform.
        </Typography>
      </Alert>

      {/* Settings Categories */}
      {categories.map((category) => {
        const categoryCards = settingsCards.filter(card => card.category === category);
        
        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Paper elevation={1} sx={{ p: 3, backgroundColor: 'transparent', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {getCategoryIcon(category)}
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
                  {categoryNames[category as keyof typeof categoryNames]}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {categoryCards.map((card) => (
                  <Box key={card.title}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        backgroundColor: 'transparent',
                        '&:hover': { 
                          boxShadow: 6,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <card.icon color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {card.title}
                          </Typography>
                          {getStatusChip(card.status)}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </CardContent>
                      
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        {card.status === 'available' ? (
                          <Button 
                            component={Link}
                            href={card.href}
                            variant="contained" 
                            fullWidth
                            sx={{ 
                              backgroundColor: '#1a2b3c',
                              '&:hover': { backgroundColor: '#2a3b4c' }
                            }}
                          >
                            Open
                          </Button>
                        ) : card.status === 'beta' ? (
                          <Button 
                            component={Link}
                            href={card.href}
                            variant="outlined" 
                            fullWidth
                            color="warning"
                          >
                            Try Beta
                          </Button>
                        ) : (
                          <Button 
                            variant="outlined" 
                            fullWidth
                            disabled
                          >
                            Coming Soon
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        );
      })}

      {/* System Information */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1a2b3c' }}>
          System Information
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <AdminIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Current User" 
              secondary={`${profile?.firstName || 'Unknown'} ${profile?.lastName || 'User'} (${user.userCode})`} 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Access Level" 
              secondary="Super Administrator - Full system access" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CloudIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Environment" 
              secondary="Development/Testing Environment" 
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
} 