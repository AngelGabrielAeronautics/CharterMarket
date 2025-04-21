'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEventLogs, searchEventLogs } from '@/lib/events';
import { EventLog, EventCategory, EventType, EventSeverity } from '@/types/event';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';

const defaultFilters = {
  category: '',
  severity: '',
  startDate: '',
  endDate: '',
  searchTerm: '',
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const loadEvents = async () => {
    if (!user?.userCode) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (filters.searchTerm) {
        const searchResults = await searchEventLogs(filters.searchTerm);
        setEvents(searchResults);
        setTotalEvents(searchResults.length);
        setTotalPages(Math.ceil(searchResults.length / 10));
      } else {
        const { events: fetchedEvents, total } = await getEventLogs({
          userCode: user.userCode,
          category: filters.category ? filters.category as EventCategory : undefined,
          severity: filters.severity ? filters.severity as EventSeverity : undefined,
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
          limit: 10,
          offset: (page - 1) * 10
        });
        
        setEvents(fetchedEvents);
        setTotalEvents(total);
        setTotalPages(Math.ceil(total / 10));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user, filters, page]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    toast.success('Filters reset');
  };

  const handleExport = async () => {
    try {
      const csvContent = [
        ['Timestamp', 'Category', 'Type', 'Severity', 'Description', 'User Code', 'User Role'],
        ...events.map(event => [
          format(event.timestamp.toDate(), 'PPpp'),
          event.category,
          event.type,
          event.severity,
          event.description,
          event.userCode,
          event.userRole
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `events_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast.success('Events exported successfully');
    } catch (err) {
      toast.error('Failed to export events');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="container mx-auto p-4 max-w-[1400px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Event Logs</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            Export to CSV
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search events..."
              value={filters.searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="w-[150px]">
            <Select
              label="Category"
              name="category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={[
                { value: '', label: 'All Categories' },
                ...Object.values(EventCategory).map(category => ({
                  value: category,
                  label: category
                }))
              ]}
            />
          </div>

          <div className="w-[150px]">
            <Select
              label="Severity"
              name="severity"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              options={[
                { value: '', label: 'All Severities' },
                ...Object.values(EventSeverity).map(severity => ({
                  value: severity,
                  label: severity
                }))
              ]}
            />
          </div>

          <div className="flex gap-2">
            <div className="w-[150px]">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                placeholder="Start Date"
              />
            </div>
            <div className="w-[150px]">
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                placeholder="End Date"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button 
              onClick={handleResetFilters} 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User Code</TableHead>
              <TableHead>User Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{format(event.timestamp.toDate(), 'PPpp')}</TableCell>
                  <TableCell>{event.category}</TableCell>
                  <TableCell>{event.type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      event.severity === EventSeverity.CRITICAL ? 'bg-red-100 text-red-800' :
                      event.severity === EventSeverity.HIGH ? 'bg-orange-100 text-orange-800' :
                      event.severity === EventSeverity.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                      event.severity === EventSeverity.LOW ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {event.severity}
                    </span>
                  </TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell>{event.userCode}</TableCell>
                  <TableCell>{event.userRole}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {events.length} of {totalEvents} events
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 