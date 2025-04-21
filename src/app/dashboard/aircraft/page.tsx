'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AircraftFormData, AircraftStatus, AircraftType } from '@/types/aircraft';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Filter, ChevronDown, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Aircraft Management</h1>
        <Button onClick={() => router.push('/dashboard/aircraft/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Aircraft
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            label="Search aircraft"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          label="Aircraft Type"
          name="aircraftType"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as AircraftType)}
          options={[{ value: '', label: 'All Types' }, ...aircraftTypes]}
        />
        <Select
          label="Status"
          name="status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as AircraftStatus)}
          options={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
        />
        <Button
          variant="outline"
          onClick={resetFilters}
          className="h-[42px] self-end"
          disabled={!searchTerm && !selectedType && !selectedStatus}
        >
          <X className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Make & Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredAircraft.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No aircraft found
                </TableCell>
              </TableRow>
            ) : (
              filteredAircraft.map((ac) => (
                <TableRow key={ac.id}>
                  <TableCell>
                    <div className="relative w-16 h-16">
                      {ac.images && ac.images.length > 0 ? (
                        <Image
                          src={ac.images[0]}
                          alt={`${ac.make} ${ac.model}`}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{ac.registration}</TableCell>
                  <TableCell>{ac.type}</TableCell>
                  <TableCell>{ac.make} {ac.model}</TableCell>
                  <TableCell>{ac.year}</TableCell>
                  <TableCell>{ac.baseAirport}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ac.status)}>
                      {ac.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/aircraft/${ac.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/aircraft/${ac.id}/edit`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 