"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useOperatorFlightRequests } from '@/hooks/useFlights';
import { FlightRequest } from '@/types/flight';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function IncomingRequestsPage() {
  const { user } = useAuth();
  const { requests, loading, error } = useOperatorFlightRequests(user?.userCode);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Incoming Flight Requests</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request Code</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Passengers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.requestCode}</TableCell>
                <TableCell>{format(req.routing.departureDate.toDate(), 'dd MMM yyyy')}</TableCell>
                <TableCell>{req.passengerCount}</TableCell>
                <TableCell>{req.status}</TableCell>
                <TableCell className="text-center">
                  <Link href={`/dashboard/flights/incoming/${req.id}`}>                  
                    <Button size="small" variant="outlined">Quote</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No incoming requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 