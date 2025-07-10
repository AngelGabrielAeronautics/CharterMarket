'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientQuoteRequests } from '@/hooks/useFlights';
import { useSearchParams, useRouter } from 'next/navigation';
import { QuoteRequest } from '@/types/flight';
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
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  TableSortLabel,
  TablePagination,
  Container,
} from '@mui/material';
import ProgressNav from '@/components/dashboard/ProgressNav';
import { Button } from '@/components/ui/Button';
import { RefreshCw, PlusIcon, ListIcon, Search, X } from 'lucide-react';
import QuoteRequestModal from '@/components/quotes/QuoteRequestModal';
import BookingForm from '@/components/BookingForm';
import StatusBadge from '@/components/ui/StatusBadge';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

type SortableColumn = 'status' | 'submitted' | 'flightDate' | 'route' | 'offers';
type SortDirection = 'asc' | 'desc';

// Helper to parse Firestore Timestamp into JS Date
function toJsDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
}

// Format route for display
const formatRoute = (request: QuoteRequest): string => {
  const { routing } = request;
  return `${routing.departureAirport} → ${routing.arrivalAirport}`;
};

// Format complete route legs with leg numbers
const formatCompleteRouteLegs = (request: QuoteRequest): Array<{legNumber: number, route: string}> => {
  const legs: Array<{legNumber: number, route: string}> = [];
  
  if (request.tripType === 'multiCity' && request.multiCityRoutes && request.multiCityRoutes.length > 0) {
    // For multi-city: show each route as a separate leg
    request.multiCityRoutes.forEach((route, index) => {
      legs.push({
        legNumber: index + 1,
        route: `${route.departureAirport} → ${route.arrivalAirport}`
      });
    });
  } else if (request.tripType === 'return') {
    // For return trips: outbound and return legs
    legs.push({
      legNumber: 1,
      route: `${request.routing.departureAirport} → ${request.routing.arrivalAirport}`
    });
    legs.push({
      legNumber: 2,
      route: `${request.routing.arrivalAirport} → ${request.routing.departureAirport}`
    });
  } else {
    // For one-way trips: single leg
    legs.push({
      legNumber: 1,
      route: `${request.routing.departureAirport} → ${request.routing.arrivalAirport}`
    });
  }
  
  return legs;
};

// Get flight date from request
const getFlightDate = (request: QuoteRequest): Date | null => {
  if (request.routing?.departureDate) {
    return toJsDate(request.routing.departureDate);
  }
  return null;
};

// Format time elapsed since a date (currently unused but available for future use)
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
  }
  
  return 'just now';
};

// Format date for searching
const formatDateForSearch = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${day}.${month}.${year} ${month}/${day}/${year}`;
};

// Check if request has unviewed quotes
const hasUnviewedQuotes = (request: QuoteRequest): boolean => {
  return request.status === 'quote-received';
};

export default function QuoteRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('submitted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const {
    requests: quoteRequests,
    loading,
    error,
    refreshRequests,
  } = useClientQuoteRequests(user?.userCode);

  // Update last refreshed timestamp when data changes
  useEffect(() => {
    if (!loading) {
      setLastRefreshed(new Date());
    }
  }, [quoteRequests, loading]);

  // Handle opening a specific request from URL parameter
  useEffect(() => {
    const openRequestId = searchParams.get('openRequest');
    if (openRequestId && quoteRequests.length > 0) {
      const requestExists = quoteRequests.some(request => request.id === openRequestId);
      if (requestExists) {
        setSelectedRequestId(openRequestId);
        setTabValue(0);
      }
    }
  }, [searchParams, quoteRequests]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (id: string) => {
    setSelectedRequestId(id);
  };

  const handleCloseModal = () => {
    setSelectedRequestId(null);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('openRequest');
    router.replace(currentUrl.pathname + currentUrl.search);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNewQuotesBannerClick = () => {
    setSortColumn('status');
    setSortDirection('desc');
    setPage(0);
  };

  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = quoteRequests;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = quoteRequests.filter(request => {
        const requestCode = request.requestCode?.toLowerCase() || '';
        const routeLegs = formatCompleteRouteLegs(request);
        const route = routeLegs.map(leg => `leg ${leg.legNumber} ${leg.route}`).join(' ').toLowerCase();
        const status = request.status?.toLowerCase() || '';
        
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
        const flightDate = getFlightDate(request);
        if (flightDate) {
          flightDateStr = formatDateForSearch(flightDate);
        }
        
        return requestCode.includes(search) ||
               route.includes(search) ||
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
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
          break;
        case 'submitted':
          valueA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
          valueB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
          break;
        case 'flightDate': {
          const flightDateA = getFlightDate(a);
          const flightDateB = getFlightDate(b);
          valueA = flightDateA ? flightDateA.getTime() : 0;
          valueB = flightDateB ? flightDateB.getTime() : 0;
          break;
        }
        case 'route': {
          const routeLegsA = formatCompleteRouteLegs(a);
          const routeLegsB = formatCompleteRouteLegs(b);
          valueA = routeLegsA.map(leg => leg.route).join(' ');
          valueB = routeLegsB.map(leg => leg.route).join(' ');
          break;
        }
        case 'offers':
          valueA = a.offers?.length || 0;
          valueB = b.offers?.length || 0;
          break;
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
  }, [quoteRequests, searchTerm, sortColumn, sortDirection]);

  // Calculate pagination
  const paginatedRequests = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedRequests.slice(startIndex, endIndex);
  }, [filteredAndSortedRequests, page, rowsPerPage]);

  // Calculate new quotes count
  const newQuotesCount = useMemo(() => {
    return quoteRequests.filter(request => hasUnviewedQuotes(request)).length;
  }, [quoteRequests]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Quote Requests
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            View your existing quote requests or submit a new one
          </Typography>
        </Box>
        <ProgressNav sx={{ maxWidth: 600 }} />
      </Box>

      <Paper
        elevation={1}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              },
            }}
          >
            <Tab
              icon={<ListIcon size={20} />}
              iconPosition="start"
              label={`My Requests (${quoteRequests.length})`}
            />
            <Tab
              icon={<PlusIcon size={20} />}
              iconPosition="start"
              label="Submit New Request"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Header with search and refresh */}
          <Box sx={{ 
            p: { xs: 2, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'flex-end',
            gap: 2,
            mb: 4 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                placeholder="Search requests..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                sx={{ 
                  width: { xs: '100%', md: '300px' },
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
              />
              <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshRequests}>
                Refresh
              </Button>
            </Box>
          </Box>

          {/* New Quotes Alert Banner */}
          {newQuotesCount > 0 && (
            <Box sx={{ px: { xs: 2, md: 4 }, mb: 3 }}>
              <Box 
                onClick={handleNewQuotesBannerClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: '#e8f5e8',
                  border: '2px solid #4caf50',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#c8e6c9',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
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
                    backgroundColor: '#2e7d32',
                    color: '#ffffff',
                    borderRadius: '50%',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                >
                  {newQuotesCount}
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#2e7d32',
                      fontWeight: 'bold',
                      mb: 0.5
                    }}
                  >
                    {newQuotesCount === 1 
                      ? 'You have 1 new quote available!' 
                      : `You have ${newQuotesCount} new quotes available!`
                    }
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#4caf50',
                      fontWeight: 'medium',
                      fontStyle: 'italic'
                    }}
                  >
                    Click to view your latest quotes
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load quote requests: {error}</Alert>}

            {!loading && !error && (
              <>
                {quoteRequests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      No quote requests found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Get started by submitting your first quote request
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PlusIcon />}
                      onClick={() => setTabValue(1)}
                    >
                      Submit New Request
                    </Button>
                  </Box>
                ) : (
                  <Paper sx={{ overflow: 'hidden' }}>
                    <TableContainer>
                      <Table stickyHeader aria-label="quote requests table">
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
                            <TableCell>
                              <TableSortLabel
                                active={sortColumn === 'route'}
                                direction={sortColumn === 'route' ? sortDirection : 'desc'}
                                onClick={() => handleSort('route')}
                              >
                                Route
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
                            <TableCell align="center">
                              <TableSortLabel
                                active={sortColumn === 'offers'}
                                direction={sortColumn === 'offers' ? sortDirection : 'desc'}
                                onClick={() => handleSort('offers')}
                              >
                                Quotes Received
                              </TableSortLabel>
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
                                    const flightDate = getFlightDate(request);
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
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                                  <Box 
                                    sx={{
                                      minWidth: '250px',
                                      width: '100%'
                                    }}
                                  >
                                    <StatusBadge 
                                      status={request.status}
                                      perspective="passenger"
                                      hasUnviewedQuotes={hasUnviewedQuotes(request)}
                                    />
                                  </Box>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      fontWeight: 'normal',
                                      width: '100%',
                                      minWidth: '250px',
                                      whiteSpace: 'nowrap',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {request.requestCode}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={request.offers?.length || 0}
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
              </>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Submit New Request Tab */}
          <Box sx={{ px: 3, pb: 4 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 3 }}>
              Submit New Quote Request
            </Typography>
            <BookingForm />
          </Box>
        </TabPanel>
      </Paper>

      <QuoteRequestModal
        open={!!selectedRequestId}
        onClose={handleCloseModal}
        requestId={selectedRequestId}
      />
    </Container>
  );
}
