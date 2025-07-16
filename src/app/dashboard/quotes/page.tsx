'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Offer } from '@/types/flight';
import {
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  Paper,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  TableSortLabel,
  TablePagination,
} from '@mui/material';
import ProgressNav from '@/components/dashboard/ProgressNav';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Search, X, Building, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllQuotes } from '@/lib/quote';
import { getOfferStatusLabel } from '@/utils/status-helpers';
import { getQuoteRequest } from '@/lib/flight';
import QuoteCard from '@/components/quotes/QuoteCard';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface QuoteWithRequestData {
  id: string;
  offerId: string;
  operatorUserCode: string;
  clientUserCode: string;
  requestId: string;
  price: number;
  commission: number;
  totalPrice: number;
  currency: string;
  notes?: string;
  offerStatus: string;
  createdAt: any;
  updatedAt: any;
  responseTimeMinutes?: number;
  aircraftDetails?: {
    id: string;
    registration: string;
    make: string;
    model: string;
    type: string;
    maxPassengers: number;
  };
  // Request data
  requestCode?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: any;
  passengerCount?: number;
  returnDate?: any;
}

type SortableColumn = 'submitted' | 'flightDate' | 'price' | 'operator' | 'route' | 'quoteIdStatus';
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
const formatRoute = (quote: QuoteWithRequestData): string => {
  return quote.departureAirport && quote.arrivalAirport
    ? `${quote.departureAirport} → ${quote.arrivalAirport}`
    : 'N/A';
};

// Format aircraft for display
const formatAircraft = (quote: QuoteWithRequestData): string => {
  if (quote.aircraftDetails) {
    return `${quote.aircraftDetails.make} ${quote.aircraftDetails.model}`;
  }
  return 'Not specified';
};

// Format date for searching
const formatDateForSearch = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${day}.${month}.${year} ${month}/${day}/${year}`;
};

const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'pending-client-acceptance':
      return 'primary';
    case 'awaiting-acknowledgement':
      return 'warning';
    case 'accepted-by-client':
      return 'success';
    case 'rejected-by-client':
      return 'error';
    case 'expired':
      return 'default';
    default:
      return 'info';
  }
};

// Using centralized getOfferStatusLabel from @/utils/status-helpers

export default function QuotesDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteWithRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('submitted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithRequestData | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());


  const fetchQuotes = async () => {
    // SECURITY CHECK: Verify user has valid userCode
    if (!user?.userCode) {
      console.error('[SECURITY] No user.userCode available for fetching quotes');
      setError('Authentication required');
      setLoading(false);
      return;
    }

    // SECURITY CHECK: Verify user has valid role
    if (!user?.role || !['operator', 'passenger', 'agent'].includes(user.role)) {
      console.error('[SECURITY] Invalid user role for quotes access:', user.role);
      setError('Invalid user permissions');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // For clients, fetch quotes where they are the clientUserCode
      // For operators, fetch quotes they have submitted
      const filters = user?.role === 'operator' 
        ? { operatorUserCode: user.userCode }
        : { clientUserCode: user.userCode };
      
      const fetchedQuotes = await getAllQuotes(filters);

      // DEBUG: Log the raw fetched quotes
      console.log('DEBUG: Raw fetched quotes:', fetchedQuotes.length);
      if (fetchedQuotes.length > 0) {
        console.log('DEBUG: First raw quote:', fetchedQuotes[0]);
      }


      // ADDITIONAL SECURITY CHECK: Filter quotes to ensure they belong to this user
      const userFilteredQuotes = fetchedQuotes.filter((quote: any) => {
        if (user.role === 'operator') {
          if (quote.operatorUserCode !== user.userCode) {
            console.error(`[SECURITY VIOLATION] Operator quote ${quote.id} doesn't belong to user ${user.userCode}`);
            return false;
          }
        } else {
          if (quote.clientUserCode !== user.userCode) {
            console.error(`[SECURITY VIOLATION] Client quote ${quote.id} doesn't belong to user ${user.userCode}`);
            return false;
          }
        }
        return true;
      });

      console.log(`[SECURITY] After user filtering: ${userFilteredQuotes.length}/${fetchedQuotes.length} quotes remain`);

      // Enrich quotes with request data and filter out orphaned quotes
      const enrichedQuotes = await Promise.all(
        userFilteredQuotes.map(async (quote: any) => {
          try {
            const requestData = await getQuoteRequest(quote.requestId);
            
            // SYNC FIX: Check if this quote exists in the request's offers array
            if (requestData && user.role !== 'operator') {
              const offerExists = requestData.offers?.some((offer: any) => 
                offer.offerId === (quote.offerId || quote.id) ||
                (offer.operatorUserCode === quote.operatorUserCode && offer.price === quote.price)
              );
              
              if (!offerExists) {
                console.warn(`[SYNC] Filtering out orphaned quote ${quote.id} - not found in request ${quote.requestId} offers`);
                return null; // Mark for removal
              }
            }
            
            return {
              ...quote,
              requestCode: requestData?.requestCode,
              departureAirport: requestData?.routing?.departureAirport,
              arrivalAirport: requestData?.routing?.arrivalAirport,
              departureDate: requestData?.routing?.departureDate,
              passengerCount: requestData?.passengerCount,
            } as QuoteWithRequestData;
          } catch (error) {
            console.warn(`[SYNC] Failed to fetch request data for quote ${quote.id}, filtering out:`, error);
            return null; // Mark for removal
          }
        })
      );
      
      // Remove null entries (orphaned/invalid quotes)
      const validQuotes = enrichedQuotes.filter(quote => quote !== null) as QuoteWithRequestData[];
      
      // DEBUG: Log the quote data to see what we're actually getting
      console.log('DEBUG: Valid quotes retrieved:', validQuotes.length);
      if (validQuotes.length > 0) {
        console.log('DEBUG: First quote sample:', {
          id: validQuotes[0].id,
          offerId: validQuotes[0].offerId,
          operatorUserCode: validQuotes[0].operatorUserCode,
          requestId: validQuotes[0].requestId,
          requestCode: validQuotes[0].requestCode,
        });
      }
      
      setQuotes(validQuotes);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [user?.userCode, user?.role]);

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

  const handleViewDetails = (requestId: string, quote?: QuoteWithRequestData) => {
    // SECURITY CHECK: Verify the quote belongs to the current user before opening modal
    if (quote && user?.userCode) {
      const belongsToUser = user.role === 'operator' 
        ? quote.operatorUserCode === user.userCode
        : quote.clientUserCode === user.userCode;
      
      if (!belongsToUser) {
        console.error(`[SECURITY VIOLATION] User ${user.userCode} attempted to access quote ${quote.id} that doesn't belong to them`);
        setError('Access denied: You can only view your own quotes');
        return;
      }
    }
    
    if (quote) {
      setSelectedQuote(quote);
      setQuoteModalOpen(true);
    }
  };

  const handleCloseQuoteModal = () => {
    setQuoteModalOpen(false);
    setSelectedQuote(null);
  };

  // Filter and sort quotes
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = quotes.filter(quote => {
        const quoteId = quote.offerId?.toLowerCase() || '';
        const requestCode = quote.requestCode?.toLowerCase() || '';
        const operator = quote.operatorUserCode?.toLowerCase() || '';
        const route = formatRoute(quote).toLowerCase();
        const aircraft = formatAircraft(quote).toLowerCase();
        const status = quote.offerStatus?.toLowerCase() || '';
        const price = quote.totalPrice?.toString() || '';
        
        let submittedDateStr = '';
        if (quote.createdAt) {
          try {
            const submittedDate = toJsDate(quote.createdAt);
            submittedDateStr = formatDateForSearch(submittedDate);
          } catch (error) {
            console.error('Error formatting submitted date:', error);
          }
        }
        
        // DEBUG: Log search terms for first few quotes
        if (search === 'qt-' || search.startsWith('qt-')) {
          console.log('DEBUG: Search terms for quote:', {
            search,
            quoteId,
            matches: quoteId.includes(search)
          });
        }
        
        return quoteId.includes(search) ||
               requestCode.includes(search) ||
               operator.includes(search) ||
               route.includes(search) ||
               aircraft.includes(search) ||
               status.includes(search) ||
               price.includes(search) ||
               submittedDateStr.includes(search);
      });
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortColumn) {
        case 'submitted':
          aValue = a.createdAt ? toJsDate(a.createdAt) : new Date(0);
          bValue = b.createdAt ? toJsDate(b.createdAt) : new Date(0);
          break;
        case 'quoteIdStatus':
          aValue = a.offerId || '';
          bValue = b.offerId || '';
          break;
        case 'flightDate':
          aValue = a.departureDate ? toJsDate(a.departureDate) : new Date(0);
          bValue = b.departureDate ? toJsDate(b.departureDate) : new Date(0);
          break;
        case 'operator':
          aValue = user?.role === 'operator' ? (a.clientUserCode || '') : (a.operatorUserCode || '');
          bValue = user?.role === 'operator' ? (b.clientUserCode || '') : (b.operatorUserCode || '');
          break;
        case 'route':
          aValue = formatRoute(a);
          bValue = formatRoute(b);
          break;
        case 'price':
          aValue = a.totalPrice || 0;
          bValue = b.totalPrice || 0;
          break;

        default:
          aValue = a.createdAt ? toJsDate(a.createdAt) : new Date(0);
          bValue = b.createdAt ? toJsDate(b.createdAt) : new Date(0);
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sorted;
  }, [quotes, searchTerm, sortColumn, sortDirection, user?.role]);

  // Paginate the filtered and sorted quotes
  const paginatedQuotes = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedQuotes.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedQuotes, page, rowsPerPage]);

  // Calculate unopened quotes count for the banner
  const unopenedQuotesCount = useMemo(() => {
    if (user?.role === 'operator') {
      // For operators: Count quotes with recent status changes (accepted or awaiting acknowledgement)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      return quotes.filter(quote => {
        const isRecent = quote.updatedAt && toJsDate(quote.updatedAt) >= threeDaysAgo;
        const hasStatusChange = quote.offerStatus === 'accepted-by-client' || quote.offerStatus === 'awaiting-acknowledgement';
        return isRecent && hasStatusChange;
      }).length;
    } else {
      // For clients: Count individual quotes that are pending client acceptance (unopened)
      return quotes.filter(quote => quote.offerStatus === 'pending-client-acceptance').length;
    }
  }, [quotes, user?.role]);

  const handleUnopenedQuotesBannerClick = () => {
    if (user?.role === 'operator') {
      // Filter to show only recent status changes
      setSearchTerm('');
      setSortColumn('quoteIdStatus');
      setSortDirection('desc');
    } else {
      // Filter to show only unopened quotes (pending status)
      setSearchTerm('pending');
      setSortColumn('quoteIdStatus');
      setSortDirection('desc');
    }
    setPage(0);
  };



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Quotes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {user?.role === 'operator' 
              ? 'View quotes you have submitted to clients'
              : 'View quotes from operators for your flight requests'
            }
          </Typography>
        </Box>
        <ProgressNav sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' }, maxWidth: 'none' }} />
      </Box>

      <Paper
        elevation={1}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          mb: 4,
          backgroundColor: 'transparent',
        }}
      >
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
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              sx={{ 
                width: { xs: '100%', md: '300px' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#e0e0e0',
                    boxShadow: 'none',
                  },
                  '&.Mui-focused': {
                    borderColor: '#e0e0e0',
                    boxShadow: 'none',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e0e0e0',
                    borderWidth: '1px',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                  borderWidth: '1px',
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
            <Button variant="outlined" startIcon={<RefreshCw />} onClick={fetchQuotes}>
              Refresh
            </Button>
          </Box>
                 </Box>

         {/* Unopened Quotes Alert Banner */}
         {unopenedQuotesCount > 0 && (
           <Box sx={{ px: { xs: 2, md: 4 }, mb: 3 }}>
             <Box 
               onClick={handleUnopenedQuotesBannerClick}
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
                 {unopenedQuotesCount}
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
                   {user?.role === 'operator' 
                     ? (unopenedQuotesCount === 1 
                         ? 'You have 1 quote status update!' 
                         : `You have ${unopenedQuotesCount} quote status updates!`)
                     : (unopenedQuotesCount === 1 
                         ? 'You have 1 unopened quote!' 
                         : `You have ${unopenedQuotesCount} unopened quotes!`)
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
                   {user?.role === 'operator' 
                     ? 'Click to view recent status changes'
                     : 'Click to view your unopened quotes'
                   }
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

          {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load quotes: {error}</Alert>}

          {!loading && !error && (
            <>
              {quotes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No quotes found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {user?.role === 'operator' 
                      ? 'You haven\'t submitted any quotes yet. Check the incoming requests to start quoting.'
                      : 'Submit a quote request to start receiving quotes from operators'
                    }
                  </Typography>
                  {user?.role !== 'operator' && (
                    <Button
                      variant="contained"
                      onClick={() => router.push('/dashboard/quotes/request')}
                    >
                      Submit New Request
                    </Button>
                  )}
                </Box>
              ) : (
                <Paper sx={{ overflow: 'hidden', backgroundColor: 'transparent' }}>
                  <TableContainer>
                    <MuiTable stickyHeader aria-label="quotes table">
                      <MuiTableHead>
                        <MuiTableRow sx={{ 
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
                          <MuiTableCell>
                            <TableSortLabel
                              active={sortColumn === 'submitted'}
                              direction={sortColumn === 'submitted' ? sortDirection : 'desc'}
                              onClick={() => handleSort('submitted')}
                            >
                              Submitted
                            </TableSortLabel>
                          </MuiTableCell>
                          <MuiTableCell>
                            <TableSortLabel
                              active={sortColumn === 'flightDate'}
                              direction={sortColumn === 'flightDate' ? sortDirection : 'desc'}
                              onClick={() => handleSort('flightDate')}
                            >
                              Flight Date
                            </TableSortLabel>
                          </MuiTableCell>
                          <MuiTableCell>
                            <TableSortLabel
                              active={sortColumn === 'route'}
                              direction={sortColumn === 'route' ? sortDirection : 'desc'}
                              onClick={() => handleSort('route')}
                            >
                              Route
                            </TableSortLabel>
                          </MuiTableCell>
                          <MuiTableCell>
                            <TableSortLabel
                              active={sortColumn === 'operator'}
                              direction={sortColumn === 'operator' ? sortDirection : 'desc'}
                              onClick={() => handleSort('operator')}
                            >
                              {user?.role === 'operator' ? 'Client' : 'Operator'}
                            </TableSortLabel>
                          </MuiTableCell>
                          <MuiTableCell>
                            Aircraft
                          </MuiTableCell>
                          <MuiTableCell>
                            <TableSortLabel
                              active={sortColumn === 'price'}
                              direction={sortColumn === 'price' ? sortDirection : 'desc'}
                              onClick={() => handleSort('price')}
                            >
                              Total Price
                            </TableSortLabel>
                          </MuiTableCell>
                          <MuiTableCell>
                            <TableSortLabel
                              active={sortColumn === 'quoteIdStatus'}
                              direction={sortColumn === 'quoteIdStatus' ? sortDirection : 'desc'}
                              onClick={() => handleSort('quoteIdStatus')}
                            >
                              Quote ID / Status
                            </TableSortLabel>
                          </MuiTableCell>
                        </MuiTableRow>
                      </MuiTableHead>
                      <MuiTableBody>
                        {paginatedQuotes.map((quote) => (
                          <MuiTableRow
                            hover
                            key={quote.id}
                            onClick={() => handleViewDetails(quote.requestId, quote)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <MuiTableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {quote.createdAt
                                  ? toJsDate(quote.createdAt).toLocaleDateString()
                                  : 'N/A'}
                              </Typography>
                            </MuiTableCell>
                            <MuiTableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {quote.departureDate
                                  ? toJsDate(quote.departureDate).toLocaleDateString()
                                  : 'N/A'}
                              </Typography>
                            </MuiTableCell>
                            <MuiTableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{ 
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    fontWeight: 'medium'
                                  }}
                                >
                                  {formatRoute(quote)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {quote.passengerCount ? `${quote.passengerCount} pax` : ''}
                                </Typography>
                              </Box>
                            </MuiTableCell>
                            <MuiTableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Building size={16} color="#666" />
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {user?.role === 'operator' 
                                    ? (quote.clientUserCode || 'N/A')
                                    : (quote.operatorUserCode || 'N/A')
                                  }
                                </Typography>
                              </Box>
                            </MuiTableCell>
                            <MuiTableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Plane size={16} color="#666" />
                                <Typography variant="body2" fontSize="0.875rem">
                                  {formatAircraft(quote)}
                                </Typography>
                              </Box>
                              {quote.aircraftDetails?.registration && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2.5 }}>
                                  {quote.aircraftDetails.registration}
                                </Typography>
                              )}
                            </MuiTableCell>
                            <MuiTableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {quote.totalPrice
                                    ? new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: quote.currency || 'USD',
                                      }).format(quote.totalPrice)
                                    : 'N/A'}
                                </Typography>
                                {quote.price && quote.commission && (
                                  <Typography variant="caption" color="text.secondary">
                                    Base: {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: quote.currency || 'USD',
                                    }).format(quote.price)} + {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: quote.currency || 'USD',
                                    }).format(quote.commission)}
                                  </Typography>
                                )}
                              </Box>
                            </MuiTableCell>
                            <MuiTableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                                <Box sx={{ minWidth: '200px', width: '100%' }}>
                                  <Chip
                                    label={getOfferStatusLabel(quote.offerStatus)}
                                    size="small"
                                    color={getStatusColor(quote.offerStatus)}
                                    variant="outlined"
                                    sx={{ 
                                      width: '100%',
                                      '& .MuiChip-label': {
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'center'
                                      }
                                    }}
                                  />
                                </Box>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    fontWeight: 'normal',
                                    width: '100%',
                                    minWidth: '200px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center'
                                  }}
                                >
                                  {quote.offerId || 'N/A'}
                                </Typography>
                              </Box>
                            </MuiTableCell>
                          </MuiTableRow>
                        ))}
                      </MuiTableBody>
                    </MuiTable>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredAndSortedQuotes.length}
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
      </Paper>

      {/* Quote Details Modal */}
      <Dialog 
        open={quoteModalOpen} 
        onClose={handleCloseQuoteModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            maxHeight: '90vh',
            m: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          pb: 1 
        }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Quote Details
            </Typography>
            {selectedQuote && (
              <Typography variant="caption" color="text.secondary">
                {selectedQuote.offerId}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseQuoteModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {selectedQuote && (
            <QuoteCard
              offer={{
                offerId: selectedQuote.offerId,
                operatorUserCode: selectedQuote.operatorUserCode,
                clientUserCode: selectedQuote.clientUserCode,
                price: selectedQuote.price,
                commission: selectedQuote.commission,
                totalPrice: selectedQuote.totalPrice,
                currency: selectedQuote.currency,
                notes: selectedQuote.notes,
                offerStatus: selectedQuote.offerStatus as any,
                createdAt: selectedQuote.createdAt,
                updatedAt: selectedQuote.updatedAt,
                responseTimeMinutes: selectedQuote.responseTimeMinutes,
                aircraftDetails: selectedQuote.aircraftDetails,
                attachments: []
              }}
              requestId={selectedQuote.requestId}
              isClientView={user?.role === 'passenger' || user?.role === 'agent'}
              showActions={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
