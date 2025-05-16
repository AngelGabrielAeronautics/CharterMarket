'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Paper, Typography, Tabs, Tab } from '@mui/material';
import NotificationList from '@/components/NotificationList';
import NotificationPreferences from '@/components/NotificationPreferences';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">Notifications</Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Manage your notifications and preferences
        </Typography>
      </Box>
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Notifications" />
          <Tab label="Preferences" />
        </Tabs>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {activeTab === 0 && <NotificationList userId={user.uid} />}
          {activeTab === 1 && <NotificationPreferences userId={user.uid} />}
        </Box>
      </Paper>
    </Box>
  );
} 