'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorQuoteRequests } from '@/hooks/useFlights';
import { useRouter } from 'next/navigation';

import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  TableContainer,
  Table,
  TableHead as MuiTableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  TableSortLabel,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  TableHeader,
  TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Search, X } from 'lucide-react';
import QuoteRequestModal from '@/components/quotes/QuoteRequestModal';
import ResponseTimeAnalyticsModal from '@/components/quotes/ResponseTimeAnalyticsModal';
import { QuoteRequest } from '@/types/flight';

type SortableColumn = 'status' | 'submitted' | 'flightDate' | 'client' | 'responseTime';
type SortDirection = 'asc' | 'desc';

const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  // Operator perspective status colors
  switch (status) {
    case 'new request':
    case 'submitted':
    case 'pending':
      return 'error'; // Pulsing red hue
    case 'quote submitted':
    case 'under-offer':
    case 'quoted':
      return 'success'; // Light green hue
    case 'accepted!':
    case 'accepted':
    case 'booked':
      return 'primary'; // Darker green hue (we'll customize this)
    case 'rejected':
      return 'default'; // Dark grey hue
    case 'won by competitor':
      return 'error'; // Dark red hue
    case 'expired':
    case 'cancelled':
      return 'secondary'; // Greyed out
    default:
      return 'default';
  }
};

// Get the operator-specific status for a request
const getOperatorSpecificStatus = (request: QuoteRequest, operatorUserCode: string | undefined): string => {
  if (!operatorUserCode) return request.status || 'pending';
  
  // Check if operator has submitted a quote for this request
  const operatorOffer = request.offers?.find(offer => offer.operatorUserCode === operatorUserCode);
  
  if (operatorOffer) {
    // Operator has submitted a quote, return based on their quote status
    switch (operatorOffer.offerStatus) {
      case 'pending-client-acceptance':
        return 'quote submitted';
      case 'accepted-by-client':
        return 'accepted';
      case 'rejected-by-client':
        return 'rejected';
      case 'expired':
        return 'expired';
      default:
        return operatorOffer.offerStatus;
    }
  } else {
    // Operator hasn't submitted a quote yet, return overall request status
    return request.status || 'pending';
  }
};

// Map database status to operator-friendly display names
const getOperatorStatusDisplay = (status: string): string => {
  switch (status) {
    case 'submitted':
    case 'pending':
      return 'new request';
    case 'under-operator-review':
      return 'under review';
    case 'under-offer':
    case 'quoted':
    case 'quote submitted':
      return 'quote submitted';
    case 'accepted':
    case 'booked':
      return 'accepted!';
    case 'cancelled':
    case 'rejected':
      return 'Client Rejected';
    case 'expired':
      return 'expired';
    // Custom statuses for operator perspective
    case 'won by competitor':
      return 'won by competitor';
    default:
      return status;
  }
};

// Count how many competitor operators have submitted quotes (excluding current operator)
const getCompetitorCount = (request: QuoteRequest, currentOperatorUserCode: string | undefined): number => {
  if (!currentOperatorUserCode) return 0;
  
  // Use the operatorUserCodesWhoHaveQuoted array if available
  if (request.operatorUserCodesWhoHaveQuoted && request.operatorUserCodesWhoHaveQuoted.length > 0) {
    return request.operatorUserCodesWhoHaveQuoted.filter(
      operatorCode => operatorCode !== currentOperatorUserCode
    ).length;
  }
  
  // Fallback to counting offers array if operatorUserCodesWhoHaveQuoted is not available
  if (request.offers && request.offers.length > 0) {
    return request.offers.filter(
      offer => offer.operatorUserCode !== currentOperatorUserCode
    ).length;
  }
  
  return 0;
};

// Custom status styling function
const getCustomStatusSx = (status: string) => {
  const displayStatus = getOperatorStatusDisplay(status);
  
  // Base styling with border for all statuses
  const baseStyle = {
    border: '1px solid',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  };
  
  switch (displayStatus) {
    case 'new request':
      return {
        ...baseStyle,
        backgroundColor: '#ffebee', // Light red background
        color: '#c62828', // Dark red text
        borderColor: '#ef5350', // Red border
      };
    case 'under review':
      return {
        ...baseStyle,
        backgroundColor: '#fff3e0', // Light orange background
        color: '#e65100', // Orange text
        borderColor: '#ff9800', // Orange border
      };
    case 'quote submitted':
      return {
        ...baseStyle,
        backgroundColor: '#e8f5e8', // Light green background
        color: '#2e7d32', // Green text
        borderColor: '#4caf50', // Green border
      };
    case 'accepted!':
      return {
        ...baseStyle,
        backgroundColor: '#51727a', // Charter blue background
        color: '#ffffff', // White text
        borderColor: '#ffffff', // White border
        fontWeight: 'bold'
      };
    case 'Client Rejected':
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5', // Light grey background
        color: '#424242', // Dark grey text
        borderColor: '#9e9e9e', // Grey border
      };
    case 'won by competitor':
      return {
        ...baseStyle,
        backgroundColor: '#b71c1c', // Dark red background
        color: '#ffffff', // White text
        borderColor: '#d32f2f', // Red border
      };
    case 'expired':
      return {
        ...baseStyle,
        backgroundColor: '#eeeeee', // Grey background
        color: '#9e9e9e', // Light grey text
        borderColor: '#bdbdbd', // Light grey border
      };
    default:
      return baseStyle;
  }
};

// Helper function to format the complete route by legs
const formatCompleteRouteLegs = (request: QuoteRequest): Array<{legNumber: number, route: string}> => {
  const legs: Array<{legNumber: number, route: string}> = [];
  
  if (request.tripType === 'multiCity' && request.multiCityRoutes && request.multiCityRoutes.length > 0) {
    // For multi-city: show each route as a separate leg
    request.multiCityRoutes.forEach((route, index) => {
      legs.push({
        legNumber: index + 1,
        route: `${route.departureAirport} - ${route.arrivalAirport}`
      });
    });
  } else if (request.tripType === 'return') {
    // For return trips: outbound and return legs
    legs.push({
      legNumber: 1,
      route: `${request.routing.departureAirport} - ${request.routing.arrivalAirport}`
    });
    legs.push({
      legNumber: 2,
      route: `${request.routing.arrivalAirport} - ${request.routing.departureAirport}`
    });
  } else {
    // For one-way trips: single leg
    legs.push({
      legNumber: 1,
      route: `${request.routing.departureAirport} - ${request.routing.arrivalAirport}`
    });
  }
  
  return legs;
};

// Helper function to get the first flight date
const getFirstFlightDate = (request: QuoteRequest): Date | null => {
  try {
    if (request.tripType === 'multiCity' && request.multiCityRoutes && request.multiCityRoutes.length > 0) {
      const firstRoute = request.multiCityRoutes[0];
      if (firstRoute.departureDate) {
        // MultiCity routes store Date objects
        return firstRoute.departureDate instanceof Date 
          ? firstRoute.departureDate 
          : new Date(firstRoute.departureDate);
      }
    } else if (request.routing.departureDate) {
      // Regular routes store Timestamps
      return request.routing.departureDate.toDate();
    }
    return null;
  } catch (error) {
    console.error('Error getting first flight date:', error);
    return null;
  }
};

// Helper function to format response time in a human-readable way
const formatResponseTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
};

// Helper function to get response time color based on performance
const getResponseTimeColor = (minutes: number): string => {
  if (minutes <= 60) return '#4caf50'; // Green - excellent (≤1 hour)
  if (minutes <= 240) return '#8bc34a'; // Light green - good (≤4 hours)
  if (minutes <= 1440) return '#ffc107'; // Yellow - average (≤24 hours)
  if (minutes <= 4320) return '#ff9800'; // Orange - slow (≤3 days)
  return '#f44336'; // Red - very slow (>3 days)
};

// Helper function to get operator's response time for a request
const getOperatorResponseTime = (request: QuoteRequest, operatorUserCode: string | undefined): number | null => {
  if (!operatorUserCode) return null;
  
  const operatorOffer = request.offers?.find(offer => offer.operatorUserCode === operatorUserCode);
  return operatorOffer?.responseTimeMinutes || null;
};

// Helper function to create searchable date strings
const formatDateForSearch = (date: Date): string => {
  try {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const longFormat = date.toLocaleDateString('en-US', options); // "July 9, 2025"
    const shortFormat = date.toLocaleDateString(); // "7/9/2025" or "09/07/2025" depending on locale
    const isoFormat = date.toISOString().split('T')[0]; // "2025-07-09"
    const year = date.getFullYear().toString(); // "2025"
    const month = date.toLocaleDateString('en-US', { month: 'long' }); // "July"
    const shortMonth = date.toLocaleDateString('en-US', { month: 'short' }); // "Jul"
    
    return `${longFormat} ${shortFormat} ${isoFormat} ${year} ${month} ${shortMonth}`.toLowerCase();
  } catch (error) {
    console.error('Error formatting date for search:', error);
    return '';
  }
};

export default function AllOperatorQuoteRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    requests: quoteRequests,
    loading,
    error,
    refreshRequests,
  } = useOperatorQuoteRequests(user?.userCode);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('submitted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  const handleViewDetails = (id: string) => {
    setSelectedRequestId(id);
  };

  const handleCloseModal = () => {
    setSelectedRequestId(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0); // Reset to first page when clearing search
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default descending direction
      setSortColumn(column);
      setSortDirection('desc');
    }
    setPage(0); // Reset to first page when sorting
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNewRequestsBannerClick = () => {
    // Sort by status with new requests first
    setSortColumn('status');
    setSortDirection('desc'); // This will put "new request" at the top since we sort by display name
    setPage(0); // Reset to first page
  };

  // Helper function to format time elapsed since a date
  const formatTimeElapsed = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      const dayText = diffDays === 1 ? '1 day' : `${diffDays} days`;
      
      if (remainingHours > 0) {
        const hourText = remainingHours === 1 ? '1 hour' : `${remainingHours} hours`;
        return `${dayText} ${hourText}`;
      } else {
        return dayText;
      }
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      const hourText = diffHours === 1 ? '1 hour' : `${diffHours} hours`;
      
      if (remainingMinutes > 0) {
        const minuteText = remainingMinutes === 1 ? '1 minute' : `${remainingMinutes} minutes`;
        return `${hourText} ${minuteText}`;
      } else {
        return hourText;
      }
    } else if (diffMinutes > 0) {
      return diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
    } else {
      return 'just now';
    }
  };

  // Get the oldest new request waiting time
  const getOldestNewRequestWaitTime = (): string | null => {
    const newRequests = quoteRequests.filter(request => {
      const operatorStatus = getOperatorSpecificStatus(request, user?.userCode);
      return getOperatorStatusDisplay(operatorStatus) === 'new request';
    });
    
    if (newRequests.length === 0) return null;
    
    // Find the oldest request by createdAt timestamp
    const oldestRequest = newRequests.reduce((oldest, current) => {
      if (!oldest.createdAt) return current;
      if (!current.createdAt) return oldest;
      
      return current.createdAt.toMillis() < oldest.createdAt.toMillis() ? current : oldest;
    });
    
    if (!oldestRequest.createdAt) return null;
    
    const createdDate = new Date(oldestRequest.createdAt.toMillis());
    return formatTimeElapsed(createdDate);
  };

  // Calculate average response time for performance tracking
  const getAverageResponseTime = (): { average: number; count: number } | null => {
    const responseTimes: number[] = [];
    
    quoteRequests.forEach(request => {
      const responseTime = getOperatorResponseTime(request, user?.userCode);
      if (responseTime !== null) {
        responseTimes.push(responseTime);
      }
    });

    if (responseTimes.length === 0) return null;

    const average = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
    return { average, count: responseTimes.length };
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = quoteRequests;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = quoteRequests.filter(request => {
        const requestCode = request.requestCode?.toLowerCase() || '';
        const routeLegs = formatCompleteRouteLegs(request);
        const route = routeLegs.map(leg => `leg ${leg.legNumber} ${leg.route}`).join(' ').toLowerCase();
        const client = request.clientUserCode?.toLowerCase() || '';
        const operatorStatus = getOperatorSpecificStatus(request, user?.userCode);
        const status = getOperatorStatusDisplay(operatorStatus).toLowerCase();
        
        // Format dates for searching
        let submittedDateStr = '';
        if (request.createdAt) {
          try {
            const submittedDate = new Date(request.createdAt.toMillis());
            submittedDateStr = formatDateForSearch(submittedDate);
          } catch (error) {
            console.error('Error formatting submitted date:', error);
          }
        }
        
        let flightDateStr = '';
        const flightDate = getFirstFlightDate(request);
        if (flightDate) {
          flightDateStr = formatDateForSearch(flightDate);
        }
        
        return requestCode.includes(search) ||
               route.includes(search) ||
               client.includes(search) ||
               status.includes(search) ||
               submittedDateStr.includes(search) ||
               flightDateStr.includes(search);
      });
    }
    
    // Sort by selected column and direction
    return [...filtered].sort((a, b) => {
      let valueA: any = '';
      let valueB: any = '';
      
      switch (sortColumn) {
        case 'status': {
          const operatorStatusA = getOperatorSpecificStatus(a, user?.userCode);
          const operatorStatusB = getOperatorSpecificStatus(b, user?.userCode);
          valueA = getOperatorStatusDisplay(operatorStatusA);
          valueB = getOperatorStatusDisplay(operatorStatusB);
          
          // Special handling: always prioritize "new request" at the top when sorting by status
          if (valueA === 'new request' && valueB !== 'new request') {
            return sortDirection === 'desc' ? -1 : 1;
          }
          if (valueB === 'new request' && valueA !== 'new request') {
            return sortDirection === 'desc' ? 1 : -1;
          }
          break;
        }

        case 'submitted':
          valueA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
          valueB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
          break;
        case 'flightDate': {
          const flightDateA = getFirstFlightDate(a);
          const flightDateB = getFirstFlightDate(b);
          valueA = flightDateA ? flightDateA.getTime() : 0;
          valueB = flightDateB ? flightDateB.getTime() : 0;
          break;
        }
        case 'client':
          valueA = a.clientUserCode || '';
          valueB = b.clientUserCode || '';
          break;
        case 'responseTime': {
          const responseTimeA = getOperatorResponseTime(a, user?.userCode);
          const responseTimeB = getOperatorResponseTime(b, user?.userCode);
          // Null values (no response yet) should be sorted as very high values (worst performance)
          valueA = responseTimeA !== null ? responseTimeA : 999999;
          valueB = responseTimeB !== null ? responseTimeB : 999999;
          break;
        }
        default:
          return 0;
      }
      
      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Handle numeric comparison
      if (sortDirection === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }, [quoteRequests, searchTerm, sortColumn, sortDirection, user?.userCode]);

  // Calculate pagination
  const paginatedRequests = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedRequests.slice(startIndex, endIndex);
  }, [filteredAndSortedRequests, page, rowsPerPage]);

  // Calculate new requests count
  const newRequestsCount = useMemo(() => {
    return quoteRequests.filter(request => {
      const operatorStatus = getOperatorSpecificStatus(request, user?.userCode);
      return getOperatorStatusDisplay(operatorStatus) === 'new request';
    }).length;
  }, [quoteRequests, user?.userCode]);

  return (
    <Box>
      <Box sx={{ 
        p: { xs: 2, md: 4 },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 4 
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1">
            All Incoming Quote Requests
          </Typography>
        </Box>
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '300px' } }}>
          <TextField
            fullWidth
            placeholder="Search requests..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ 
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                '&:hover': {
                  borderColor: '#b0b0b0',
                },
                '&.Mui-focused': {
                  borderColor: '#1976d2',
                },
              },
            }}
          />
        </Box>
        <Box>
          <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshRequests}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Average Response Time Performance Metric */}
      {(() => {
        const avgResponseData = getAverageResponseTime();
        return avgResponseData && (
          <Box sx={{ 
            p: { xs: 2, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 2 
          }}>
            <Box sx={{ flex: 1 }}>
              {/* Empty space to match the header layout */}
            </Box>
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '300px' } }}>
              <Box 
                onClick={() => setIsAnalyticsModalOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: '#f3f4f6',
                  border: '2px solid #9ca3af',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#e5e7eb',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(156, 163, 175, 0.3)',
                  }
                }}
              >
                <Box 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 52,
                    height: 52,
                    backgroundColor: getResponseTimeColor(avgResponseData.average),
                    color: '#ffffff',
                    borderRadius: '50%',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '4px'
                  }}
                >
                  {formatResponseTime(avgResponseData.average)}
                </Box>
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: '#374151',
                      fontWeight: 'bold',
                      mb: 0.25
                    }}
                  >
                    Average Response Time
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6b7280',
                      fontWeight: 'medium'
                    }}
                  >
                    Based on {avgResponseData.count} quote{avgResponseData.count !== 1 ? 's' : ''}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#9ca3af',
                      fontWeight: 'medium',
                      fontSize: '0.65rem',
                      fontStyle: 'italic',
                      mt: 0.25,
                      display: 'block'
                    }}
                  >
                    Click for details
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box>
              {/* Empty space to match the refresh button area */}
            </Box>
          </Box>
        );
      })()}

      {/* New Requests Alert Banner */}
      {newRequestsCount > 0 && (
        <Box sx={{ px: { xs: 2, md: 4 }, mb: 3 }}>
          <Box 
            onClick={handleNewRequestsBannerClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 2,
              backgroundColor: '#ffebee',
              border: '2px solid #ef5350',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
              '&:hover': {
                backgroundColor: '#ffcdd2',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(239, 83, 80, 0.3)',
              }
            }}
          >
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                backgroundColor: '#c62828',
                color: '#ffffff',
                borderRadius: '50%',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
            >
              {newRequestsCount}
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#c62828',
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                {newRequestsCount === 1 
                  ? 'You have 1 new quote request waiting for your attention!' 
                  : `You have ${newRequestsCount} new quote requests waiting for your attention!`
                }
              </Typography>
              {(() => {
                const oldestWaitTime = getOldestNewRequestWaitTime();
                return oldestWaitTime && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#d32f2f',
                      fontWeight: 'medium',
                      fontStyle: 'italic'
                    }}
                  >
                    Oldest request has been waiting {oldestWaitTime}
                  </Typography>
                );
              })()}
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ px: { xs: 2, md: 4 } }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">Failed to load quote requests: {error}</Alert>}

        {!loading && !error && (
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader aria-label="all operator quote requests table">
                <MuiTableHead>
                  <TableRow sx={{ 
                    backgroundColor: '#e9e7e0 !important',
                    '& .MuiTableCell-root': {
                      backgroundColor: '#e9e7e0 !important',
                      color: '#333333 !important',
                      fontWeight: 600,
                      '& .MuiTableSortLabel-root': {
                        color: '#333333 !important',
                        '&:hover': {
                          color: '#000000 !important'
                        },
                        '&.Mui-active': {
                          color: '#000000 !important'
                        }
                      },
                      '& .MuiTableSortLabel-icon': {
                        color: '#333333 !important'
                      }
                    }
                  }}>
                                          <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'submitted'}
                          direction={sortColumn === 'submitted' ? sortDirection : 'desc'}
                          onClick={() => handleSort('submitted')}
                        >
                          Submitted
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'flightDate'}
                          direction={sortColumn === 'flightDate' ? sortDirection : 'desc'}
                          onClick={() => handleSort('flightDate')}
                        >
                          Flight Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'client'}
                          direction={sortColumn === 'client' ? sortDirection : 'desc'}
                          onClick={() => handleSort('client')}
                        >
                          Client
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === 'status'}
                          direction={sortColumn === 'status' ? sortDirection : 'desc'}
                          onClick={() => handleSort('status')}
                        >
                          Request / Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ width: '140px', minWidth: '140px' }}>
                        <TableSortLabel
                          active={sortColumn === 'responseTime'}
                          direction={sortColumn === 'responseTime' ? sortDirection : 'desc'}
                          onClick={() => handleSort('responseTime')}
                        >
                          Your Response Time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                        Competitors have Quoted
                      </TableCell>
                  </TableRow>
                </MuiTableHead>
                <TableBody>
                  {paginatedRequests.map((request: QuoteRequest) => (
                    <TableRow
                      hover
                      key={request.id}
                      onClick={() => handleViewDetails(request.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {request.createdAt
                            ? new Date(request.createdAt.toMillis()).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {(() => {
                            const flightDate = getFirstFlightDate(request);
                            return flightDate ? flightDate.toLocaleDateString() : 'N/A';
                          })()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {formatCompleteRouteLegs(request).map((leg, index) => (
                            <Box key={index} sx={{ 
                              mb: index < formatCompleteRouteLegs(request).length - 1 ? 0.5 : 0,
                              whiteSpace: 'nowrap'
                            }}>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  mr: 1
                                }}
                              >
                                Leg {leg.legNumber}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ 
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  fontWeight: 'medium'
                                }}
                              >
                                {leg.route}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{request.clientUserCode}</TableCell>
                      <TableCell>
                        {(() => {
                          const operatorStatus = getOperatorSpecificStatus(request, user?.userCode);
                          const displayStatus = getOperatorStatusDisplay(operatorStatus);
                          
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                              <Box 
                                sx={{
                                  minWidth: '250px',
                                  ...(displayStatus === 'new request' && {
                                    animation: 'statusPulse 1.5s infinite',
                                    '@keyframes statusPulse': {
                                      '0%': { 
                                        opacity: 1,
                                        transform: 'scale(1)',
                                        boxShadow: '0 0 0 0 rgba(220, 38, 127, 0.7)',
                                        borderRadius: '16px'
                                      },
                                      '50%': { 
                                        opacity: 0.4,
                                        transform: 'scale(1.15)',
                                        boxShadow: '0 0 0 8px rgba(220, 38, 127, 0)',
                                        borderRadius: '20px'
                                      },
                                      '100%': { 
                                        opacity: 1,
                                        transform: 'scale(1)',
                                        boxShadow: '0 0 0 0 rgba(220, 38, 127, 0.7)',
                                        borderRadius: '16px'
                                      }
                                    }
                                  })
                                }}
                              >
                                <Chip 
                                  label={displayStatus} 
                                  size="small" 
                                  sx={{ 
                                    width: '100%',
                                    textTransform: 'capitalize',
                                    '& .MuiChip-label': {
                                      display: 'block',
                                      width: '100%',
                                      textAlign: 'center'
                                    },
                                    ...getCustomStatusSx(operatorStatus)
                                  }}
                                />
                              </Box>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: 'normal',
                                  width: 'fit-content',
                                  minWidth: '250px',
                                  whiteSpace: 'nowrap',
                                  textAlign: 'center'
                                }}
                              >
                                {request.requestCode}
                              </Typography>
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ width: '140px', minWidth: '140px' }}>
                        {(() => {
                          const responseTime = getOperatorResponseTime(request, user?.userCode);
                          if (responseTime === null) {
                            return (
                              <Typography variant="body2" color="text.secondary">
                                No response
                              </Typography>
                            );
                          }
                          
                          const displayTime = formatResponseTime(responseTime);
                          const color = getResponseTimeColor(responseTime);
                          
                          return (
                            <Chip
                              label={displayTime}
                              size="small"
                              sx={{
                                backgroundColor: color,
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                '& .MuiChip-label': {
                                  px: 1.5,
                                },
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center" sx={{ width: '120px', minWidth: '120px' }}>
                        {(() => {
                          const competitorCount = getCompetitorCount(request, user?.userCode);
                          return (
                            <Chip
                              label={competitorCount}
                              sx={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'transparent',
                                color: '#51727a',
                                border: '2px solid #51727a',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                '& .MuiChip-label': {
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: '100%'
                                }
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredAndSortedRequests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
        <QuoteRequestModal
          open={!!selectedRequestId}
          onClose={handleCloseModal}
          requestId={selectedRequestId}
          onQuoteSubmitted={refreshRequests}
        />
        <ResponseTimeAnalyticsModal
          open={isAnalyticsModalOpen}
          onClose={() => setIsAnalyticsModalOpen(false)}
          requests={quoteRequests}
          operatorUserCode={user?.userCode}
        />
      </Box>
    </Box>
  );
}
