import React, { useState } from 'react';
import { createLazyComponent } from '../utils/lazyLoad';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { brandColors } from '../theme/brandColors';

// Lazy load the Chart component
const LazyChart = createLazyComponent(() => import('../components/Charts/Chart'), {
  errorBoundary: true,
  fallback: (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body1">Loading chart data...</Typography>
    </Box>
  )
});

// Sample data for charts
const monthlyRevenueData = [
  { label: 'Jan', value: 5200 },
  { label: 'Feb', value: 4800 },
  { label: 'Mar', value: 6100 },
  { label: 'Apr', value: 7400 },
  { label: 'May', value: 8200 },
  { label: 'Jun', value: 7900 },
];

const userActivityData = [
  { label: 'Mon', value: 47 },
  { label: 'Tue', value: 52 },
  { label: 'Wed', value: 63 },
  { label: 'Thu', value: 55 },
  { label: 'Fri', value: 48 },
  { label: 'Sat', value: 38 },
  { label: 'Sun', value: 42 },
];

const AnalyticsPage: React.FC = () => {
  const [isRevenueVisible, setIsRevenueVisible] = useState(true);
  const [isActivityVisible, setIsActivityVisible] = useState(true);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Monthly Revenue</Typography>
                <Button 
                  size="small" 
                  onClick={() => setIsRevenueVisible(!isRevenueVisible)}
                >
                  {isRevenueVisible ? 'Hide' : 'Show'}
                </Button>
              </Box>
              
              {isRevenueVisible && (
                <LazyChart 
                  data={monthlyRevenueData}
                  title="Revenue ($)"
                  height={250}
                  color={brandColors.primary.main}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Weekly User Activity</Typography>
                <Button 
                  size="small"
                  onClick={() => setIsActivityVisible(!isActivityVisible)}
                >
                  {isActivityVisible ? 'Hide' : 'Show'}
                </Button>
              </Box>
              
              {isActivityVisible && (
                <LazyChart 
                  data={userActivityData}
                  title="Active Users"
                  height={250}
                  color={brandColors.cream?.main || '#F5DEB3'}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage; 