'use client';

/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AircraftFormData, AircraftStatus, AircraftType } from '@/types/aircraft';
import { Button, Box, Typography, Paper, Stack, Grid, TextField, MenuItem, Alert, Avatar } from '@mui/material';
import { Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Aircraft extends AircraftFormData {
  id: string;
}

export default function AircraftPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AircraftType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<AircraftStatus | ''>('');

  useEffect(() => {
    if (user?.email) {
      console.log('User authenticated:', user);
      fetchAircraft();
    } else {
      console.log('User not authenticated');
    }
  }, [user]);

  const fetchAircraft = async () => {
    try {
      if (!user?.userCode) {
        console.error('User code is missing:', user);
        throw new Error('User code is required');
      }
      console.log('Fetching aircraft for user:', user.userCode);
      const q = query(
        collection(db, 'operators', user.userCode, 'aircraft'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot:', querySnapshot.size, 'documents found');
      const aircraftData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Aircraft[];
      console.log('Aircraft data:', aircraftData);
      setAircraft(aircraftData);
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAircraft = aircraft.filter(ac => {
    const matchesSearch = 
      ac.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ac.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ac.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType ? ac.type === selectedType : true;
    const matchesStatus = selectedStatus ? ac.status === selectedStatus : true;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: AircraftStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'MAINTENANCE':
        return 'bg-yellow-500';
      case 'INACTIVE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Aircraft Management
        </Typography>
        <Button variant="contained" onClick={() => router.push('/dashboard/aircraft/new')} startIcon={<Plus />}>
          Add Aircraft
        </Button>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Search aircraft"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <Search style={{ marginRight: 8, color: 'grey' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Aircraft Type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AircraftType)}
            fullWidth
          >
            <MenuItem value="">All Types</MenuItem>
            {aircraftTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            label="Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AircraftStatus)}
            fullWidth
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
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
      <Paper sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ width: 100, p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Image</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Registration</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Type</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Make & Model</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Year</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Base</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Status</Box>
                <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'medium', color: 'text.secondary' }}>Actions</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {loading ? (
                <Box component="tr">
                  <Box component="td" colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography>Loading...</Typography>
                  </Box>
                </Box>
              ) : filteredAircraft.length === 0 ? (
                <Box component="tr">
                  <Box component="td" colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography>No aircraft found</Typography>
                  </Box>
                </Box>
              ) : (
                filteredAircraft.map((ac) => (
                  <Box component="tr" key={ac.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box component="td" sx={{ p: 2 }}>
                      <Box sx={{ width: 64, height: 64, position: 'relative' }}>
                        {ac.images && ac.images.length > 0 ? (
                          <Avatar
                            src={ac.images[0]}
                            alt={`${ac.make} ${ac.model}`}
                            variant="rounded"
                            sx={{ width: 64, height: 64, bgcolor: 'background.default' }}
                          />
                        ) : (
                          <Box sx={{ width: 64, height: 64, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                            <Typography color="text.disabled" variant="caption">No Image</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box component="td" sx={{ p: 2, fontWeight: 'medium' }}>{ac.registration}</Box>
                    <Box component="td" sx={{ p: 2 }}>{ac.type}</Box>
                    <Box component="td" sx={{ p: 2 }}>{ac.make} {ac.model}</Box>
                    <Box component="td" sx={{ p: 2 }}>{ac.year}</Box>
                    <Box component="td" sx={{ p: 2 }}>{ac.baseAirport}</Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Box sx={{ display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1, bgcolor: ac.status === 'ACTIVE' ? 'success.light' : ac.status === 'MAINTENANCE' ? 'warning.light' : 'error.light', color: ac.status === 'ACTIVE' ? 'success.dark' : ac.status === 'MAINTENANCE' ? 'warning.dark' : 'error.dark', fontWeight: 500, fontSize: 13 }}>
                        {ac.status}
                      </Box>
                    </Box>
                    <Box component="td" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="text"
                          onClick={() => router.push(`/dashboard/aircraft/${ac.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => router.push(`/dashboard/aircraft/${ac.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 