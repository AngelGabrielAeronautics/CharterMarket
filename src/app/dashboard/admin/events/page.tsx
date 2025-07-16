'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EventLog, EventCategory, EventType, EventSeverity, EventLogFilter } from '@/types/event';
import { getEventLogs, searchEventLogs } from '@/utils/eventLogger';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function EventLogsPage() {
  const { user } = useAuth();
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventLogFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role === 'superAdmin') {
      fetchEventLogs();
    }
  }, [user, filter]);

  const fetchEventLogs = async () => {
    try {
      setLoading(true);
      const response = await getEventLogs(filter);
      setEventLogs(response.events);
    } catch (error) {
      console.error('Error fetching event logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const logs = await searchEventLogs(searchTerm);
      setEventLogs(logs);
    } catch (error) {
      console.error('Error searching event logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: EventSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Logs</h1>
        <Button onClick={fetchEventLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="bg-transparent rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            endAdornment={<Search className="h-4 w-4" />}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Select
            label="Category"
            name="category"
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value as EventCategory })}
            options={Object.values(EventCategory).map(category => ({
              value: category,
              label: category.replace('_', ' ')
            }))}
          />
          <Select
            label="Type"
            name="type"
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value as EventType })}
            options={Object.values(EventType).map(type => ({
              value: type,
              label: type.replace('_', ' ')
            }))}
          />
          <Select
            label="Severity"
            name="severity"
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value as EventSeverity })}
            options={Object.values(EventSeverity).map(severity => ({
              value: severity,
              label: severity
            }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={filter.startDate}
            onChange={(date) => setFilter({ ...filter, startDate: date })}
          />
          <DatePicker
            label="End Date"
            value={filter.endDate}
            onChange={(date) => setFilter({ ...filter, endDate: date })}
          />
        </div>
      </div>

      <div className="bg-transparent rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : eventLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              eventLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>{log.category}</TableCell>
                  <TableCell>{log.type}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.userCode}</span>
                      <span className="text-sm text-gray-500">{log.userRole}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // TODO: Implement details modal
                        console.log(log.data);
                      }}
                    >
                      View
                    </Button>
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