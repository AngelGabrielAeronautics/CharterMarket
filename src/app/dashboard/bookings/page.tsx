'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useClientBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';
import { format } from 'date-fns';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  TableContainer,
  Table,
  TableHead as MuiTableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  TableSortLabel,
  Chip,
  Tooltip,
} from '@mui/material';
import ProgressNav from '@/components/dashboard/ProgressNav';
import { RefreshCw, Search, X, EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Helper to parse Firestore Timestamp or raw JSON into JS Date
function toJsDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  return new Date(value);
}

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
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'error';
    case 'completed':
      return 'primary';
    default:
      return 'default';
  }
};

type SortableColumn = 'bookingId' | 'route' | 'flightDate' | 'status' | 'totalPrice';
type SortDirection = 'asc' | 'desc';

export default function BookingsPage() {
  const { user } = useAuth();
  const { bookings, loading, error, refreshBookings } = useClientBookings(user?.userCode);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('flightDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter((booking) => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const flightDate = toJsDate(booking.routing.departureDate);
      
      return (
        booking.bookingId.toLowerCase().includes(searchLower) ||
        booking.status.toLowerCase().includes(searchLower) ||
        booking.routing.departureAirport.toLowerCase().includes(searchLower) ||
        booking.routing.arrivalAirport.toLowerCase().includes(searchLower) ||
        `${booking.routing.departureAirport} → ${booking.routing.arrivalAirport}`.toLowerCase().includes(searchLower) ||
        formatDateForSearch(flightDate).includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortColumn) {
        case 'bookingId':
          aValue = a.bookingId;
          bValue = b.bookingId;
          break;
        case 'route':
          aValue = `${a.routing.departureAirport} → ${a.routing.arrivalAirport}`;
          bValue = `${b.routing.departureAirport} → ${b.routing.arrivalAirport}`;
          break;
        case 'flightDate':
          aValue = toJsDate(a.routing.departureDate).getTime();
          bValue = toJsDate(b.routing.departureDate).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'totalPrice':
          aValue = (a as any).totalPrice || a.payment?.totalAmount || 0;
          bValue = (b as any).totalPrice || b.payment?.totalAmount || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bookings, searchTerm, sortColumn, sortDirection]);

  const paginatedBookings = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedBookings.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedBookings, page, rowsPerPage]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Bookings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            View and manage your bookings
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
              placeholder="Search bookings..."
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
            <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshBookings}>
              Refresh
            </Button>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load bookings: {error}</Alert>}

          {!loading && !error && (
            <>
              {bookings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No bookings found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your booked flights will appear here
                  </Typography>
                </Box>
              ) : (
                <Paper sx={{ overflow: 'hidden' }}>
                  <TableContainer>
                    <Table stickyHeader aria-label="bookings table">
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
                              active={sortColumn === 'bookingId'}
                              direction={sortColumn === 'bookingId' ? sortDirection : 'desc'}
                              onClick={() => handleSort('bookingId')}
                            >
                              Booking ID
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
                              active={sortColumn === 'flightDate'}
                              direction={sortColumn === 'flightDate' ? sortDirection : 'desc'}
                              onClick={() => handleSort('flightDate')}
                            >
                              Flight Date
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'status'}
                              direction={sortColumn === 'status' ? sortDirection : 'desc'}
                              onClick={() => handleSort('status')}
                            >
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'totalPrice'}
                              direction={sortColumn === 'totalPrice' ? sortDirection : 'desc'}
                              onClick={() => handleSort('totalPrice')}
                            >
                              Total Price
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </MuiTableHead>
                      <TableBody>
                        {paginatedBookings.map((booking) => (
                          <TableRow
                            hover
                            key={booking.id}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {booking.bookingId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                  fontWeight: 'medium'
                                }}
                              >
                                {booking.routing.departureAirport} → {booking.routing.arrivalAirport}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {format(toJsDate(booking.routing.departureDate), 'dd MMM yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={booking.status}
                                size="small"
                                color={getStatusColor(booking.status)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                ${((booking as any).totalPrice || booking.payment?.totalAmount || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Booking Details">
                                <Link href={`/dashboard/bookings/${booking.id}`} passHref>
                                  <IconButton size="small" color="primary">
                                    <EyeIcon className="h-5 w-5" />
                                  </IconButton>
                                </Link>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredAndSortedBookings.length}
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
    </Container>
  );
}
