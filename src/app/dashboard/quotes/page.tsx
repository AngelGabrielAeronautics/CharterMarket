'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useClientQuoteRequests } from '@/hooks/useFlights';
import { QuoteRequest } from '@/types/flight';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlusIcon, Loader2, ListIcon, GridIcon } from 'lucide-react';
import SearchIconMui from '@mui/icons-material/Search';
import FlightIconMui from '@mui/icons-material/Flight';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  TextField as MuiTextField,
  Dialog,
  DialogContent,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
  type GridProps,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

// Define the GridItem component props type for Material UI v7
interface GridItemProps extends GridProps {
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  children?: React.ReactNode;
}

// Create a custom GridItem component to work with Material UI v7
const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => (
  <Grid component="div" item {...props}>
    {children}
  </Grid>
);

export default function QuoteRequestsPage() {
  const { user } = useAuth();
  const { requests, loading, error } = useClientQuoteRequests(user?.userCode);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchParams.get('submitted') === 'true') {
      setShowSearchModal(true);
      // Remove the query param so modal doesn't show on refresh/navigation
      router.replace('/dashboard/quotes', { scroll: false });
      const timer = setTimeout(() => {
        setShowSearchModal(false);
      }, 5000); // Close modal after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return requests;
    return requests.filter(
      (req) =>
        req.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.routing.departureAirport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.routing.arrivalAirport.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSearchModal = () => (
    <Dialog
      open={showSearchModal}
      onClose={() => setShowSearchModal(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogContent sx={{ textAlign: 'center', p: 4 }}>
        <SearchIconMui sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Searching for Quotes...
        </Typography>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography
            variant="body1"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
          >
            <FlightIconMui sx={{ mr: 1, opacity: 0.7 }} /> Searching operators...
          </Typography>
          <LinearProgress variant="indeterminate" sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="body1"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
          >
            <FlightIconMui sx={{ mr: 1, opacity: 0.7 }} /> Searching empty legs...
          </Typography>
          <LinearProgress
            variant="indeterminate"
            color="secondary"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My quote requests</h1>
        <div className="flex items-center space-x-2">
          <MuiTextField
            variant="outlined"
            size="small"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIconMui />
                </InputAdornment>
              ),
            }}
            sx={{ width: '250px' }}
          />
          <Tooltip title="List View">
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Card View">
            <IconButton
              onClick={() => setViewMode('card')}
              color={viewMode === 'card' ? 'primary' : 'default'}
            >
              <GridIcon />
            </IconButton>
          </Tooltip>
          <Link href="/dashboard/quotes/request">
            <Button className="flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>New Request</span>
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Code</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.requestCode}</TableCell>
                  <TableCell>
                    {request.routing.departureAirport} → {request.routing.arrivalAirport}
                  </TableCell>
                  <TableCell>
                    {format(request.routing.departureDate.toDate(), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{request.passengerCount}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/quotes/${request.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {searchTerm
                      ? `No requests found for "${searchTerm}"`
                      : 'No quote requests found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <GridItem xs={12} sm={6} md={4} key={request.id}>
              <Card className="h-full flex flex-col">
                <CardContent className="flex-grow">
                  <Typography variant="h6" gutterBottom>
                    {request.requestCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {request.routing.departureAirport} → {request.routing.arrivalAirport}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {format(request.routing.departureDate.toDate(), 'dd MMM yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passengers: {request.passengerCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status:{' '}
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </Typography>
                </CardContent>
                <CardActions>
                  <Link href={`/dashboard/quotes/${request.id}`} passHref>
                    <Button size="small" variant="text">
                      View Details
                    </Button>
                  </Link>
                </CardActions>
              </Card>
            </GridItem>
          ))}
          {filteredRequests.length === 0 && (
            <GridItem xs={12}>
              <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                {searchTerm ? `No requests found for "${searchTerm}"` : 'No quote requests found.'}
              </Typography>
            </GridItem>
          )}
        </Grid>
      )}
      {renderSearchModal()}
    </div>
  );
}
