'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useClientFlightRequests } from '@/hooks/useFlights';
import { FlightRequest } from '@/types/flight';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlusIcon, Loader2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function FlightRequestsPage() {
  const { user } = useAuth();
  const { requests, loading, error } = useClientFlightRequests(user?.uid);

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

  const getStatusColor = (status: FlightRequest['status']) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Flight Requests</h1>
        <Link href="/dashboard/flights/request">
          <Button className="flex items-center space-x-2">
            <PlusIcon className="h-5 w-5" />
            <span>New Request</span>
          </Button>
        </Link>
      </div>

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
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.requestCode}</TableCell>
                <TableCell>{request.routing.departureAirport} → {request.routing.arrivalAirport}</TableCell>
                <TableCell>{format(request.routing.departureDate.toDate(), 'dd MMM yyyy')}</TableCell>
                <TableCell>{request.passengerCount}</TableCell>
                <TableCell>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/flights/${request.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No flight requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 