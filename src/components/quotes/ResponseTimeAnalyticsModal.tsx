'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, TrendingUp, TrendingDown, Timeline, Compare, ThumbUp, ThumbDown, Balance } from '@mui/icons-material';
import { QuoteRequest, Offer } from '@/types/flight';
import ResponseTimeGauge from './ResponseTimeGauge';

interface ResponseTimeAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  requests: QuoteRequest[];
  operatorUserCode?: string;
}

type TimePeriod = 'all' | '12m' | '6m' | '3m';

interface AnalyticsData {
  averageResponseTime: number;
  totalSubmissions: number;
  submissions: Array<{
    requestCode: string;
    submittedDate: Date;
    responseTime: number;
    route: string;
    status: string;
  }>;
}

const ResponseTimeAnalyticsModal: React.FC<ResponseTimeAnalyticsModalProps> = ({
  open,
  onClose,
  requests,
  operatorUserCode,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [tabValue, setTabValue] = useState(0);

  // Helper function to get operator response time from a request
  const getOperatorResponseTime = (request: QuoteRequest): number | null => {
    if (!operatorUserCode || !request.offers) return null;
    
    const operatorOffer = request.offers.find(offer => offer.operatorUserCode === operatorUserCode);
    if (!operatorOffer || !operatorOffer.responseTimeMinutes) return null;
    
    return operatorOffer.responseTimeMinutes;
  };

  // Helper function to format route
  const formatRoute = (request: QuoteRequest): string => {
    if (request.multiCityRoutes && request.multiCityRoutes.length > 0) {
      return request.multiCityRoutes.map((route, index) => {
        const legNumber = index + 1;
        return `Leg ${legNumber}: ${route.departureAirport} → ${route.arrivalAirport}`;
      }).join(', ');
    }
    
    if (request.routing) {
      return `${request.routing.departureAirport} → ${request.routing.arrivalAirport}`;
    }
    
    return 'No route specified';
  };

  // Helper function to get status
  const getStatus = (request: QuoteRequest): string => {
    if (!operatorUserCode || !request.offers) return 'No response';
    
    const operatorOffer = request.offers.find((offer: Offer) => offer.operatorUserCode === operatorUserCode);
    if (!operatorOffer) return 'No response';
    
    return operatorOffer.offerStatus || 'submitted';
  };

  // Calculate analytics data for different time periods
  const analyticsData = useMemo((): Record<TimePeriod, AnalyticsData> => {
    const now = new Date();
    const periods: Record<TimePeriod, Date | null> = {
      all: null,
      '12m': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      '6m': new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      '3m': new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
    };

    const result: Record<TimePeriod, AnalyticsData> = {
      all: { averageResponseTime: 0, totalSubmissions: 0, submissions: [] },
      '12m': { averageResponseTime: 0, totalSubmissions: 0, submissions: [] },
      '6m': { averageResponseTime: 0, totalSubmissions: 0, submissions: [] },
      '3m': { averageResponseTime: 0, totalSubmissions: 0, submissions: [] },
    };

    (Object.keys(periods) as TimePeriod[]).forEach(period => {
      const cutoffDate = periods[period];
      const filteredRequests = cutoffDate 
        ? requests.filter(request => {
            if (!request.createdAt) return false;
            const requestDate = new Date(request.createdAt.toMillis());
            return requestDate >= cutoffDate;
          })
        : requests;

      const submissions: AnalyticsData['submissions'] = [];
      const responseTimes: number[] = [];

      filteredRequests.forEach(request => {
        const responseTime = getOperatorResponseTime(request);
        if (responseTime !== null && request.createdAt) {
          const submittedDate = new Date(request.createdAt.toMillis());
          submissions.push({
            requestCode: request.requestCode || 'N/A',
            submittedDate,
            responseTime,
            route: formatRoute(request),
            status: getStatus(request),
          });
          responseTimes.push(responseTime);
        }
      });

      // Sort submissions by date (newest first)
      submissions.sort((a, b) => b.submittedDate.getTime() - a.submittedDate.getTime());

      result[period] = {
        averageResponseTime: responseTimes.length > 0 
          ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
          : 0,
        totalSubmissions: submissions.length,
        submissions,
      };
    });

    return result;
  }, [requests, operatorUserCode]);

  // Calculate market average (all operators combined) for comparison
  const marketAnalyticsData = useMemo((): Record<TimePeriod, { averageResponseTime: number; totalSubmissions: number }> => {
    const now = new Date();
    const periods: Record<TimePeriod, Date | null> = {
      all: null,
      '12m': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      '6m': new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      '3m': new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
    };

    const result: Record<TimePeriod, { averageResponseTime: number; totalSubmissions: number }> = {
      all: { averageResponseTime: 0, totalSubmissions: 0 },
      '12m': { averageResponseTime: 0, totalSubmissions: 0 },
      '6m': { averageResponseTime: 0, totalSubmissions: 0 },
      '3m': { averageResponseTime: 0, totalSubmissions: 0 },
    };

    (Object.keys(periods) as TimePeriod[]).forEach(period => {
      const cutoffDate = periods[period];
      const filteredRequests = cutoffDate 
        ? requests.filter(request => {
            if (!request.createdAt) return false;
            const requestDate = new Date(request.createdAt.toMillis());
            return requestDate >= cutoffDate;
          })
        : requests;

      const allResponseTimes: number[] = [];

             filteredRequests.forEach(request => {
         if (request.offers && request.offers.length > 0) {
           request.offers.forEach(offer => {
             // Use the stored responseTimeMinutes if available
             if (offer.responseTimeMinutes && offer.responseTimeMinutes > 0) {
               allResponseTimes.push(offer.responseTimeMinutes);
             } else if (offer.updatedAt && offer.createdAt) {
               // Fallback to calculating from createdAt and updatedAt
               const responseTimeMs = offer.updatedAt.toMillis() - offer.createdAt.toMillis();
               const responseTimeMinutes = Math.round(responseTimeMs / (1000 * 60));
               if (responseTimeMinutes > 0) {
                 allResponseTimes.push(responseTimeMinutes);
               }
             }
           });
         }
       });

      result[period] = {
        averageResponseTime: allResponseTimes.length > 0 
          ? Math.round(allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length)
          : 0,
        totalSubmissions: allResponseTimes.length,
      };
    });

    return result;
  }, [requests]);

  // Calculate market comparison
  const getMarketComparison = () => {
    const operatorAvg = currentData.averageResponseTime;
    const marketAvg = marketAnalyticsData[selectedPeriod].averageResponseTime;
    
    if (operatorAvg === 0 || marketAvg === 0) {
      return { status: 'no-data', percentageDiff: 0, isBetter: false };
    }

    const percentageDiff = Math.round(((operatorAvg - marketAvg) / marketAvg) * 100);
    const isBetter = operatorAvg < marketAvg; // Lower response time is better
    
    let status: 'much-better' | 'better' | 'similar' | 'worse' | 'much-worse';
    
    if (Math.abs(percentageDiff) <= 10) {
      status = 'similar';
    } else if (isBetter) {
      status = Math.abs(percentageDiff) >= 30 ? 'much-better' : 'better';
    } else {
      status = Math.abs(percentageDiff) >= 30 ? 'much-worse' : 'worse';
    }

    return { status, percentageDiff: Math.abs(percentageDiff), isBetter };
  };

  // Helper function to format response time - always show the most appropriate unit
  const formatResponseTime = (minutes: number): string => {
    if (minutes === 0) return '0m';
    
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.floor(minutes % 60);
    
    // For values >= 1 day, show days (and hours if significant)
    if (days >= 1) {
      if (hours >= 1) {
        return `${days}d ${hours}h`;
      }
      return `${days}d`;
    }
    
    // For values >= 1 hour, show hours (and minutes if significant)
    if (hours >= 1) {
      if (mins >= 1) {
        return `${hours}h ${mins}m`;
      }
      return `${hours}h`;
    }
    
    // For values < 1 hour, show minutes
    return `${mins}m`;
  };

  // Helper function to get response time color
  const getResponseTimeColor = (minutes: number): string => {
    if (minutes <= 60) return '#4ade80'; // Green - ≤1 hour
    if (minutes <= 240) return '#84cc16'; // Light green - ≤4 hours  
    if (minutes <= 1440) return '#eab308'; // Yellow - ≤24 hours
    if (minutes <= 4320) return '#f97316'; // Orange - ≤3 days
    return '#ef4444'; // Red - >3 days
  };

  // Calculate performance comparison
  const getPerformanceComparison = (): { trend: 'up' | 'down' | 'stable'; change: number } => {
    const current3m = analyticsData['3m'].averageResponseTime;
    const previous3m = analyticsData['6m'].averageResponseTime - analyticsData['3m'].averageResponseTime;
    
    if (current3m === 0 || previous3m === 0) {
      return { trend: 'stable', change: 0 };
    }

    const change = ((current3m - previous3m) / previous3m) * 100;
    
    if (Math.abs(change) < 5) return { trend: 'stable', change: 0 };
    return { trend: change < 0 ? 'up' : 'down', change: Math.abs(change) };
  };

  const currentData = analyticsData[selectedPeriod];
  const performance = getPerformanceComparison();
  const marketComparison = getMarketComparison();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="response-time-analytics-modal"
      aria-describedby="response-time-analytics-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95vw', sm: '90vw', md: '80vw', lg: '1200px' },
        height: { xs: '95vh', sm: '90vh', md: '85vh' },
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 3, 
          borderBottom: '1px solid #e0e0e0' 
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
            Response Time Analytics
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#666' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Time Period Selector */}
        <Box sx={{ p: 3, pb: 0 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Time Period"
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="12m">Last 12 Months</MenuItem>
              <MenuItem value="6m">Last 6 Months</MenuItem>
              <MenuItem value="3m">Last 3 Months</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Color Legend */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: '#1a2b3c' }}>
            Color-coded Response Times:
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center'
          }}>
            {[
              { color: '#ef4444', label: '>3 days', description: 'needs improvement' },
              { color: '#f97316', label: '≤3 days', description: 'slow' },
              { color: '#eab308', label: '≤24 hours', description: 'fair' },
              { color: '#84cc16', label: '≤4 hours', description: 'good' },
              { color: '#4ade80', label: '≤1 hour', description: 'excellent' },
            ].map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#374151', fontSize: '0.8rem' }}>
                  <strong>{item.label}</strong> ({item.description})
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Metrics Overview */}
        <Box sx={{ p: 3, pt: 0 }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' },
            gap: 3 
          }}>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  {currentData.averageResponseTime > 0 ? (
                    <ResponseTimeGauge 
                      averageResponseTime={currentData.averageResponseTime}
                      size={180}
                    />
                  ) : (
                    <Box sx={{ py: 4 }}>
                      <Typography variant="h4" sx={{ color: '#6b7280', fontWeight: 'bold' }}>
                        N/A
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No response data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
                    {currentData.totalSubmissions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {performance.trend === 'up' && <TrendingUp sx={{ color: '#4ade80', fontSize: '2rem' }} />}
                  {performance.trend === 'down' && <TrendingDown sx={{ color: '#ef4444', fontSize: '2rem' }} />}
                  {performance.trend === 'stable' && <Timeline sx={{ color: '#6b7280', fontSize: '2rem' }} />}
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: performance.trend === 'up' ? '#4ade80' : performance.trend === 'down' ? '#ef4444' : '#6b7280'
                    }}>
                      {performance.trend === 'stable' ? 'Stable' : `${performance.change.toFixed(1)}%`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      3M Performance
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card>
                <CardContent sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {marketComparison.status === 'no-data' ? (
                    <>
                      <Compare sx={{ color: '#6b7280', fontSize: '2rem' }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#6b7280' }}>
                          N/A
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs Market
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      {marketComparison.status === 'much-better' && <ThumbUp sx={{ color: '#16a34a', fontSize: '2rem' }} />}
                      {marketComparison.status === 'better' && <ThumbUp sx={{ color: '#4ade80', fontSize: '2rem' }} />}
                      {marketComparison.status === 'similar' && <Balance sx={{ color: '#6b7280', fontSize: '2rem' }} />}
                      {marketComparison.status === 'worse' && <ThumbDown sx={{ color: '#f97316', fontSize: '2rem' }} />}
                      {marketComparison.status === 'much-worse' && <ThumbDown sx={{ color: '#ef4444', fontSize: '2rem' }} />}
                      <Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          color: marketComparison.status.includes('better') ? '#4ade80' : 
                                 marketComparison.status.includes('worse') ? '#ef4444' : '#6b7280'
                        }}>
                          {marketComparison.isBetter ? `-${marketComparison.percentageDiff}%` : `+${marketComparison.percentageDiff}%`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs Market
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          {/* Market Comparison Text */}
          {marketComparison.status !== 'no-data' && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ 
                color: '#374151', 
                textAlign: 'center',
                fontWeight: 'medium'
              }}>
                {marketComparison.status === 'much-better' && 
                  `🎉 Excellent! You respond ${marketComparison.percentageDiff}% faster than the market average of ${formatResponseTime(marketAnalyticsData[selectedPeriod].averageResponseTime)}.`}
                {marketComparison.status === 'better' && 
                  `👍 Good job! You respond ${marketComparison.percentageDiff}% faster than the market average of ${formatResponseTime(marketAnalyticsData[selectedPeriod].averageResponseTime)}.`}
                {marketComparison.status === 'similar' && 
                  `⚖️ You perform similarly to the market average of ${formatResponseTime(marketAnalyticsData[selectedPeriod].averageResponseTime)}.`}
                {marketComparison.status === 'worse' && 
                  `⚠️ You respond ${marketComparison.percentageDiff}% slower than the market average of ${formatResponseTime(marketAnalyticsData[selectedPeriod].averageResponseTime)}.`}
                {marketComparison.status === 'much-worse' && 
                  `🚨 Consider improving: You respond ${marketComparison.percentageDiff}% slower than the market average of ${formatResponseTime(marketAnalyticsData[selectedPeriod].averageResponseTime)}.`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Submissions List" />
              <Tab label="Performance Trends" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {tabValue === 0 && (
              <TableContainer component={Paper}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request Code</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentData.submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">
                            No submissions found for the selected period
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.submissions.map((submission, index) => (
                        <TableRow key={index}>
                          <TableCell>{submission.requestCode}</TableCell>
                          <TableCell>
                            {submission.submittedDate.toLocaleDateString()} {submission.submittedDate.toLocaleTimeString()}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2" sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {submission.route}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatResponseTime(submission.responseTime)}
                              sx={{
                                backgroundColor: getResponseTimeColor(submission.responseTime),
                                color: '#ffffff',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={submission.status}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Alert severity="info">
                  Performance trends graph will be implemented in the next phase. 
                  For now, you can see the 3-month performance indicator in the metrics overview above.
                </Alert>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ResponseTimeAnalyticsModal; 