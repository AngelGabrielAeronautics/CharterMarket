'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientQuoteRequests } from '@/hooks/useFlights';
import { QuoteRequest } from '@/types/flight';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Grid,
  Tabs,
  Tab,
  Divider,
  Container,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { RefreshCw, PlusIcon, ListIcon } from 'lucide-react';
import QuoteRequestModal from '@/components/quotes/QuoteRequestModal';
import BookingForm from '@/components/BookingForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{ py: 3 }}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </Box>
  );
}

function getStatusColor(
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'submitted':
    case 'pending':
      return 'primary';
    case 'under-operator-review':
      return 'warning';
    case 'under-offer':
    case 'quoted':
      return 'info';
    case 'accepted':
    case 'booked':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

// Helper to parse Firestore Timestamp into JS Date
function toJsDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
}

export default function QuoteRequestsPage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const {
    requests: quoteRequests,
    loading,
    error,
    refreshRequests,
  } = useClientQuoteRequests(user?.userCode);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (id: string) => {
    setSelectedRequestId(id);
  };

  const handleCloseModal = () => {
    setSelectedRequestId(null);
  };

  const sortedRequests = useMemo(() => {
    return [...quoteRequests].sort((a, b) => {
      const timeA = a.createdAt?.toDate().getTime() ?? 0;
      const timeB = b.createdAt?.toDate().getTime() ?? 0;
      return timeB - timeA;
    });
  }, [quoteRequests]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Quote Requests
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          View your existing quote requests or submit a new one
        </Typography>
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
              label={`My Requests (${sortedRequests.length})`}
            />
            <Tab
              icon={<PlusIcon size={20} />}
              iconPosition="start"
              label="Submit New Request"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* My Requests Tab */}
          <Box sx={{ px: 3 }}>
            <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Grid>
                <Typography variant="h6" component="h2">
                  My Quote Requests
                </Typography>
              </Grid>
              <Grid>
                <Button variant="outlined" startIcon={<RefreshCw />} onClick={refreshRequests}>
                  Refresh
                </Button>
              </Grid>
            </Grid>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 3 }}>Failed to load quote requests: {error}</Alert>}

            {!loading && !error && (
              <>
                {sortedRequests.length === 0 ? (
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
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>Request ID</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>Route</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>Offers</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedRequests.map((request: QuoteRequest) => (
                          <TableRow
                            key={request.id}
                            hover
                            onClick={() => handleViewDetails(request.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              {request.requestCode || request.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {request.routing.departureAirport} → {request.routing.arrivalAirport}
                            </TableCell>
                            <TableCell>
                              {request.routing.departureDate
                                ? toJsDate(request.routing.departureDate).toLocaleDateString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={request.status || 'pending'}
                                size="small"
                                color={getStatusColor(request.status || 'pending')}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={request.offers?.length || 0}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Submit New Request Tab */}
          <Box sx={{ px: 3 }}>
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
