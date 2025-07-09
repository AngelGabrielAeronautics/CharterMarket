'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AircraftFormData, AircraftStatus, AircraftType } from '@/types/aircraft';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Alert,
  Avatar,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TablePagination,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import { Plus, Search, X, RefreshCw, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AircraftDetailsModal from '@/components/AircraftDetailsModal';

interface Aircraft extends AircraftFormData {
  id: string;
}

type SortableColumn = 'registration' | 'type' | 'makeModel' | 'year' | 'baseAirport' | 'status';
type SortDirection = 'asc' | 'desc';

const getStatusColor = (
  status: AircraftStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'MAINTENANCE':
      return 'warning';
    case 'INACTIVE':
      return 'error';
    default:
      return 'default';
  }
};

const getCustomStatusSx = (status: AircraftStatus) => {
  const baseStyle = {
    border: '1px solid',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    fontWeight: 500,
  };
  
  switch (status) {
    case 'ACTIVE':
      return {
        ...baseStyle,
        backgroundColor: '#e8f5e8',
        color: '#2e7d32',
        borderColor: '#4caf50',
      };
    case 'MAINTENANCE':
      return {
        ...baseStyle,
        backgroundColor: '#fff3e0',
        color: '#e65100',
        borderColor: '#ff9800',
      };
    case 'INACTIVE':
      return {
        ...baseStyle,
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderColor: '#ef5350',
      };
    default:
      return baseStyle;
  }
};

export default function AircraftPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AircraftType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<AircraftStatus | ''>('');
  const [sortColumn, setSortColumn] = useState<SortableColumn>('registration');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchAircraft();
    }
  }, [user]);

  const fetchAircraft = async () => {
    try {
      setLoading(true);
      if (!user?.userCode) {
        throw new Error('User code is required');
      }
      
      const q = query(
        collection(db, 'operators', user.userCode, 'aircraft'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const aircraftData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aircraft[];
      
      setAircraft(aircraftData);
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    } finally {
      setLoading(false);
    }
  };

  const aircraftTypes: { value: AircraftType; label: string }[] = [
    { value: AircraftType.LIGHT_JET, label: 'Light Jet' },
    { value: AircraftType.MIDSIZE_JET, label: 'Midsize Jet' },
    { value: AircraftType.SUPER_MIDSIZE_JET, label: 'Super Midsize Jet' },
    { value: AircraftType.HEAVY_JET, label: 'Heavy Jet' },
    { value: AircraftType.ULTRA_LONG_RANGE_JET, label: 'Ultra Long Range Jet' },
    { value: AircraftType.TURBOPROP, label: 'Turboprop' },
    { value: AircraftType.HELICOPTER, label: 'Helicopter' }
  ];

  const statusOptions: { value: AircraftStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'INACTIVE', label: 'Inactive' }
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
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

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setPage(0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAircraft(null);
  };

  const filteredAndSortedAircraft = useMemo(() => {
    let filtered = aircraft;
    
    // Apply filters
    filtered = aircraft.filter(ac => {
      const matchesSearch = 
        ac.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ac.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ac.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ac.baseAirport.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType ? ac.type === selectedType : true;
      const matchesStatus = selectedStatus ? ac.status === selectedStatus : true;
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    // Sort by selected column and direction
    return [...filtered].sort((a, b) => {
      let valueA: any = '';
      let valueB: any = '';
      
      switch (sortColumn) {
        case 'registration':
          valueA = a.registration;
          valueB = b.registration;
          break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        case 'makeModel':
          valueA = `${a.make} ${a.model}`;
          valueB = `${b.make} ${b.model}`;
          break;
        case 'year':
          valueA = a.year;
          valueB = b.year;
          break;
        case 'baseAirport':
          valueA = a.baseAirport;
          valueB = b.baseAirport;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
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
  }, [aircraft, searchTerm, selectedType, selectedStatus, sortColumn, sortDirection]);

  // Calculate pagination
  const paginatedAircraft = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedAircraft.slice(startIndex, endIndex);
  }, [filteredAndSortedAircraft, page, rowsPerPage]);

  // Calculate fleet statistics
  const fleetStats = useMemo(() => {
    const total = aircraft.length;
    const active = aircraft.filter(ac => ac.status === 'ACTIVE').length;
    const maintenance = aircraft.filter(ac => ac.status === 'MAINTENANCE').length;
    const inactive = aircraft.filter(ac => ac.status === 'INACTIVE').length;
    const avgYear = aircraft.length > 0 ? Math.round(aircraft.reduce((sum, ac) => sum + ac.year, 0) / aircraft.length) : 0;
    
    return { total, active, maintenance, inactive, avgYear };
  }, [aircraft]);

  return (
    <Box>
      {/* Header Section */}
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
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
            Aircraft Management
          </Typography>
        </Box>
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '300px' } }}>
          <TextField
            fullWidth
            placeholder="Search aircraft..."
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshCw />} onClick={fetchAircraft}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Plus />} onClick={() => router.push('/dashboard/aircraft/new')}>
            Add Aircraft
          </Button>
        </Box>
      </Box>

      {/* Fleet Overview Analytics */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Fleet Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">{fleetStats.total}</Typography>
              <Typography variant="body2">Total Aircraft</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">{fleetStats.active}</Typography>
              <Typography variant="body2">Active</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">{fleetStats.maintenance}</Typography>
              <Typography variant="body2">Maintenance</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">{fleetStats.inactive}</Typography>
              <Typography variant="body2">Inactive</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
              <Typography variant="h4" fontWeight="bold">{fleetStats.avgYear}</Typography>
              <Typography variant="body2">Avg Year</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Filters */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label="Aircraft Type"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as AircraftType);
                setPage(0);
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              {aircraftTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label="Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as AircraftStatus);
                setPage(0);
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button
              variant="outlined"
              onClick={resetFilters}
              startIcon={<X />}
              fullWidth
              disabled={!searchTerm && !selectedType && !selectedStatus}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Table */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'registration'}
                      direction={sortColumn === 'registration' ? sortDirection : 'asc'}
                      onClick={() => handleSort('registration')}
                    >
                      Registration
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'type'}
                      direction={sortColumn === 'type' ? sortDirection : 'asc'}
                      onClick={() => handleSort('type')}
                    >
                      Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'makeModel'}
                      direction={sortColumn === 'makeModel' ? sortDirection : 'asc'}
                      onClick={() => handleSort('makeModel')}
                    >
                      Make & Model
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'year'}
                      direction={sortColumn === 'year' ? sortDirection : 'asc'}
                      onClick={() => handleSort('year')}
                    >
                      Year
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'baseAirport'}
                      direction={sortColumn === 'baseAirport' ? sortDirection : 'asc'}
                      onClick={() => handleSort('baseAirport')}
                    >
                      Base
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'status'}
                      direction={sortColumn === 'status' ? sortDirection : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 2 }}>Loading aircraft...</Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedAircraft.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Plane size={48} style={{ color: '#ccc' }} />
                      <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                        {filteredAndSortedAircraft.length === 0 && aircraft.length > 0 
                          ? 'No aircraft match your filters' 
                          : 'No aircraft found'}
                      </Typography>
                      {aircraft.length === 0 && (
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                          Add your first aircraft to get started
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAircraft.map((ac) => (
                    <TableRow 
                      key={ac.id} 
                      hover 
                      onClick={() => {
                        setSelectedAircraft(ac);
                        setIsModalOpen(true);
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Avatar
                          src={ac.images && ac.images.length > 0 && typeof ac.images[0] === 'string' ? ac.images[0] : undefined}
                          alt={`${ac.make} ${ac.model}`}
                          variant="rounded"
                          sx={{ width: 64, height: 64, bgcolor: 'background.default' }}
                        >
                          <Plane size={24} />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">{ac.registration}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ac.type.replace(/_/g, ' ')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ac.make} {ac.model}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ac.year}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ac.baseAirport}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ac.status}
                          color={getStatusColor(ac.status)}
                          size="small"
                          sx={getCustomStatusSx(ac.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredAndSortedAircraft.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Aircraft Details Modal */}
      <AircraftDetailsModal
        aircraft={selectedAircraft}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </Box>
  );
} 