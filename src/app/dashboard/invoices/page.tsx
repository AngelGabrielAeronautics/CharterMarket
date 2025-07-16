'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useClientInvoices } from '@/hooks/useBookings';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Paper,
  Container,
  TextField,
  InputAdornment,
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
import { EyeIcon, RefreshCw, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

// Helper to parse Firestore Timestamp, raw JSON object, or ISO string into JS Date
const toJsDate = (value: any): Date => {
  if (!value) return new Date(); // Or handle as an error/invalid date
  // Firestore Timestamp instance
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  // Raw Firestore JSON format: { seconds: number, nanoseconds: number }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  // Fallback for SDK v8 legacy JSON: { _seconds, _nanoseconds }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  // ISO string or timestamp number
  return new Date(value);
};

// Format date for searching
const formatDateForSearch = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${day}.${month}.${year} ${month}/${day}/${year}`;
};

type SortableColumn = 'invoiceId' | 'bookingId' | 'amount' | 'dateIssued';
type SortDirection = 'asc' | 'desc';

export default function ClientInvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { invoices, loading, error } = useClientInvoices(user?.userCode);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('dateIssued');
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

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter((invoice) => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const issuedDate = toJsDate(invoice.createdAt);
      
      return (
        invoice.invoiceId.toLowerCase().includes(searchLower) ||
        invoice.bookingId.toLowerCase().includes(searchLower) ||
        invoice.amount.toString().includes(searchLower) ||
        formatDateForSearch(issuedDate).includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortColumn) {
        case 'invoiceId':
          aValue = a.invoiceId;
          bValue = b.invoiceId;
          break;
        case 'bookingId':
          aValue = a.bookingId;
          bValue = b.bookingId;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'dateIssued':
          aValue = toJsDate(a.createdAt).getTime();
          bValue = toJsDate(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchTerm, sortColumn, sortDirection]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedInvoices.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedInvoices, page, rowsPerPage]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Invoices & Payments
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            View your invoices and payment status
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
              placeholder="Search invoices..."
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
            <Button variant="outlined" startIcon={<RefreshCw />} onClick={() => window.location.reload()}>
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

          {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load invoices: {error}</Alert>}

          {!loading && !error && (
            <>
              {invoices.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No invoices found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your invoices will appear here when generated
                  </Typography>
                </Box>
              ) : (
                <Paper sx={{ overflow: 'hidden' }}>
                  <TableContainer>
                    <Table stickyHeader aria-label="invoices table">
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
                              active={sortColumn === 'invoiceId'}
                              direction={sortColumn === 'invoiceId' ? sortDirection : 'desc'}
                              onClick={() => handleSort('invoiceId')}
                            >
                              Invoice ID
                            </TableSortLabel>
                          </TableCell>
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
                              active={sortColumn === 'amount'}
                              direction={sortColumn === 'amount' ? sortDirection : 'desc'}
                              onClick={() => handleSort('amount')}
                            >
                              Amount
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={sortColumn === 'dateIssued'}
                              direction={sortColumn === 'dateIssued' ? sortDirection : 'desc'}
                              onClick={() => handleSort('dateIssued')}
                            >
                              Date Issued
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </MuiTableHead>
                      <TableBody>
                        {paginatedInvoices.map((invoice) => (
                          <TableRow
                            hover
                            key={invoice.id}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Link href={`/dashboard/invoices/${invoice.id}`} passHref>
                                <Typography
                                  color="primary"
                                  sx={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 'medium' }}
                                >
                                  {invoice.invoiceId}
                                </Typography>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {invoice.bookingId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                ${invoice.amount.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {format(toJsDate(invoice.createdAt), 'dd MMM yyyy, HH:mm')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Invoice Details">
                                <Link href={`/dashboard/invoices/${invoice.id}`} passHref>
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
                    count={filteredAndSortedInvoices.length}
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
