'use client';

import { useState } from 'react';
import { 
  Refresh as RefreshIcon, 
  OpenInNew as ExternalLinkIcon, 
  PhoneIphone as PhoneIcon, 
  Tablet as TabletIcon, 
  Laptop as LaptopIcon, 
  DesktopMac as DesktopIcon, 
  Link as LinkIcon 
} from '@mui/icons-material';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';

const deviceCategories = {
  mobile: {
    name: 'Mobile Devices',
    icon: PhoneIcon,
    color: 'success',
    devices: [
      { name: 'iPhone SE', width: 375, height: 667, category: 'mobile' },
      { name: 'iPhone 12/13/14', width: 390, height: 844, category: 'mobile' },
      { name: 'iPhone 12/13/14 Pro Max', width: 428, height: 926, category: 'mobile' },
      { name: 'Samsung Galaxy S21', width: 384, height: 854, category: 'mobile' },
      { name: 'Google Pixel 5', width: 393, height: 851, category: 'mobile' },
    ]
  },
  tablet: {
    name: 'Tablet Devices',
    icon: TabletIcon,
    color: 'info',
    devices: [
      { name: 'iPad Mini', width: 768, height: 1024, category: 'tablet' },
      { name: 'iPad Air', width: 820, height: 1180, category: 'tablet' },
      { name: 'iPad Pro 11"', width: 834, height: 1194, category: 'tablet' },
      { name: 'iPad Pro 12.9"', width: 1024, height: 1366, category: 'tablet' },
      { name: 'Surface Pro', width: 912, height: 1368, category: 'tablet' },
    ]
  },
  laptop: {
    name: 'Laptop & Desktop',
    icon: LaptopIcon,
    color: 'primary',
    devices: [
      { name: 'MacBook Air', width: 1280, height: 832, category: 'laptop' },
      { name: 'MacBook Pro 14"', width: 1512, height: 982, category: 'laptop' },
      { name: 'MacBook Pro 16"', width: 1728, height: 1117, category: 'laptop' },
      { name: '1080p Monitor', width: 1920, height: 1080, category: 'desktop' },
      { name: '1440p Monitor', width: 2560, height: 1440, category: 'desktop' },
    ]
  }
};

const testPages = [
  { name: 'Homepage', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Quote Request', path: '/dashboard/quotes/request' },
  { name: 'Bookings', path: '/dashboard/bookings' },
  { name: 'Aircraft Management', path: '/dashboard/aircraft' },
  { name: 'Users Management', path: '/dashboard/users' },
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
];

export default function ResponsiveTestPage() {
  const [selectedPage, setSelectedPage] = useState('/');
  const [selectedCategory, setSelectedCategory] = useState<string>('mobile');
  const [refreshKey, setRefreshKey] = useState(0);

  const allDevices = Object.values(deviceCategories).flatMap(category => category.devices);
  const currentDevices = deviceCategories[selectedCategory as keyof typeof deviceCategories]?.devices || allDevices;

  const calculateScale = (deviceWidth: number, containerWidth: number = 450) => {
    return Math.min(1, (containerWidth - 32) / deviceWidth);
  };

  const refreshAll = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main" gutterBottom>
          Responsive Design Testing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test the Charter app across different device sizes and screen resolutions to ensure optimal user experience
        </Typography>
      </Box>

      {/* Controls Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom sx={{ mb: 3 }}>
          Testing Controls
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          {/* Page Selection */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Test Page</InputLabel>
              <Select
                value={selectedPage}
                label="Test Page"
                onChange={(e) => setSelectedPage(e.target.value)}
              >
                {testPages.map((page) => (
                  <MenuItem key={page.path} value={page.path}>
                    {page.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Refresh Button */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Tooltip title="Refresh all device previews">
                <Button
                  variant="outlined"
                  onClick={refreshAll}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 120 }}
                >
                  Refresh All
                </Button>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Device Category Tabs */}
        <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 3 }}>
          <Tabs 
            value={selectedCategory} 
            onChange={handleCategoryChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {Object.entries(deviceCategories).map(([key, category]) => (
              <Tab 
                key={key} 
                value={key} 
                label={category.name}
                icon={<category.icon />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>
      </Paper>

      {/* Device Previews Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom sx={{ mb: 3 }}>
          Device Previews ({currentDevices.length} devices)
        </Typography>
        
        <Grid container spacing={3}>
          {currentDevices.map((device) => {
            const scale = calculateScale(device.width, 450);
            const scaledHeight = Math.min(600, device.height * scale);
            const category = deviceCategories[selectedCategory as keyof typeof deviceCategories];

            return (
              <Grid size={{ xs: 12, lg: 6, xl: 4 }} key={`${device.name}-${refreshKey}`}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      elevation: 4,
                      transform: 'translateY(-2px)' 
                    }
                  }}
                >
                  {/* Device Header */}
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="medium" gutterBottom>
                          {device.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {device.width} × {device.height}px • Scale: {Math.round(scale * 100)}%
                        </Typography>
                      </Box>
                      <Chip
                        icon={<category.icon />}
                        label={device.category}
                        color={category.color as any}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    {/* Device Screen Preview */}
                    <Box 
                      sx={{ 
                        position: 'relative',
                        bgcolor: 'grey.900',
                        borderRadius: 2,
                        p: 2,
                        mb: 2
                      }}
                    >
                      <Box
                        sx={{
                          overflow: 'hidden',
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          boxShadow: 3,
                          width: '100%',
                          height: `${scaledHeight}px`,
                        }}
                      >
                        <iframe
                          key={`${device.name}-${selectedPage}-${refreshKey}`}
                          src={selectedPage}
                          style={{
                            width: `${device.width}px`,
                            height: `${device.height}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: '0 0',
                            border: 'none',
                          }}
                          title={`${device.name} preview of ${selectedPage}`}
                          loading="lazy"
                        />
                      </Box>
                    </Box>
                  </CardContent>

                  {/* Device Footer */}
                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <LinkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {selectedPage}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={<ExternalLinkIcon />}
                      href={`${selectedPage}?viewport=${device.width}x${device.height}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Usage Instructions */}
      <Alert 
        severity="info" 
        variant="outlined" 
        sx={{ 
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        <Typography variant="h6" gutterBottom>
          How to Use This Tool
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
              🎯 Testing Strategy
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Test critical user flows on each device size</li>
              <li>Check for responsive design issues and layout breaks</li>
              <li>Verify mobile navigation works properly</li>
              <li>Ensure forms are usable on small screens</li>
              <li>Test touch interactions on mobile devices</li>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
              🔧 Features & Tips
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Switch between different pages using the dropdown</li>
              <li>Filter by device category using the tabs</li>
              <li>Click "Open" to test pages in new tabs</li>
              <li>Use "Refresh All" to reload all previews simultaneously</li>
              <li>Hover over cards for enhanced interaction</li>
            </Box>
          </Grid>
        </Grid>
      </Alert>
    </Box>
  );
} 