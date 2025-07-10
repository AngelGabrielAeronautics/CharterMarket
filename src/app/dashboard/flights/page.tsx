'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFlights } from '@/hooks/useFlights';
import { Flight } from '@/types/flight';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Container,
  TableContainer,
  Table,
  TableHead as MuiTableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  TableSortLabel,
} from '@mui/material';
import ProgressNav from '@/components/dashboard/ProgressNav';
import {
  Search,
  RefreshCw,
  EyeIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Flight status colors
const getFlightStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'scheduled':
      return 'primary';
    case 'in-progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// Format date for searching
const formatDateForSearch = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${day}.${month}.${year} ${month}/${day}/${year}`;
};

// Format route for display
const formatRouteForDisplay = (flight: Flight): string => {
  if (flight.legs && flight.legs.length > 0) {
    if (flight.legs.length === 1) {
      return `${flight.legs[0].departureAirport} → ${flight.legs[0].arrivalAirport}`;
    } else {
      const firstLeg = flight.legs[0];
      const lastLeg = flight.legs[flight.legs.length - 1];
      return `${firstLeg.departureAirport} → ${lastLeg.arrivalAirport} (+${flight.legs.length - 1} stops)`;
    }
  }
  return 'N/A';
};

type SortableColumn = 'flightGroupId' | 'operator' | 'route' | 'status' | 'created' | 'legs';
type SortDirection = 'asc' | 'desc';

export default function FlightsPage() {
  const { user } = useAuth();
  const { flights, loading, error, refreshFlights } = useFlights(user?.userCode);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleManualRefresh = async () => {
    await refreshFlights();
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

  // Filter and sort flights
  const filteredAndSortedFlights = useMemo(() => {
    let filtered = flights.filter((flight) => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const createdDate = flight.createdAt.toDate();
      const routeDisplay = formatRouteForDisplay(flight);
      
      return (
        flight.flightGroupId.toLowerCase().includes(searchLower) ||
        flight.status.toLowerCase().includes(searchLower) ||
        flight.operatorUserCode.toLowerCase().includes(searchLower) ||
        flight.aircraftId.toLowerCase().includes(searchLower) ||
        routeDisplay.toLowerCase().includes(searchLower) ||
        formatDateForSearch(createdDate).includes(searchLower) ||
        flight.legs.some(leg => 
          leg.departureAirport.toLowerCase().includes(searchLower) ||
          leg.arrivalAirport.toLowerCase().includes(searchLower)
        )
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortColumn) {
        case 'flightGroupId':
          aValue = a.flightGroupId;
          bValue = b.flightGroupId;
          break;
        case 'operator':
          aValue = a.operatorUserCode;
          bValue = b.operatorUserCode;
          break;
        case 'route':
          aValue = formatRouteForDisplay(a);
          bValue = formatRouteForDisplay(b);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created':
          aValue = a.createdAt.toDate().getTime();
          bValue = b.createdAt.toDate().getTime();
          break;
        case 'legs':
          aValue = a.totalLegs;
          bValue = b.totalLegs;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [flights, searchTerm, sortColumn, sortDirection]);

  const paginatedFlights = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedFlights.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedFlights, page, rowsPerPage]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Flights
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            View and manage your flight operations
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
              placeholder="Search flights..."
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
            <Button variant="outlined" startIcon={<RefreshCw />} onClick={handleManualRefresh}>
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

          {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load flights: {error}</Alert>}

          {!loading && !error && (
            <>
              {flights.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No flights found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Your flights will appear here once created'}
                  </Typography>
                </Box>
              ) : (
                <Paper sx={{ overflow: 'hidden' }}>
                  <TableContainer>
                    <Table stickyHeader aria-label="flights table">
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
                              active={sortColumn === 'flightGroupId'}
                              direction={sortColumn === 'flightGroupId' ? sortDirection : 'desc'}
                              onClick={() => handleSort('flightGroupId')}
                            >
                              Flight Group ID
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'operator'}
                              direction={sortColumn === 'operator' ? sortDirection : 'desc'}
                              onClick={() => handleSort('operator')}
                            >
                              Operator
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
                              Status
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'legs'}
                              direction={sortColumn === 'legs' ? sortDirection : 'desc'}
                              onClick={() => handleSort('legs')}
                            >
                              Legs
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'created'}
                              direction={sortColumn === 'created' ? sortDirection : 'desc'}
                              onClick={() => handleSort('created')}
                            >
                              Created
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Aircraft</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </MuiTableHead>
                      <TableBody>
                        {paginatedFlights.map((flight) => (
                          <TableRow
                            hover
                            key={flight.id}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {flight.flightGroupId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {flight.operatorUserCode}
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
                                {formatRouteForDisplay(flight)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={flight.status} 
                                size="small" 
                                color={getFlightStatusColor(flight.status)} 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {flight.totalLegs}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {format(flight.createdAt.toDate(), 'dd MMM yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {flight.aircraftId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Flight Details">
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => {
                                    // Handle flight details view - you can implement this
                                    console.log('View flight details:', flight.id);
                                  }}
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </IconButton>
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
                    count={filteredAndSortedFlights.length}
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
