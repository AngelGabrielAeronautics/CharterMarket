import React from 'react';
import { Card } from '@/components/ui/Card';
import { QuoteRequest } from '@/types/flight';

interface QuoteRequestDetailsProps {
  request: QuoteRequest;
}

const QuoteRequestDetails: React.FC<QuoteRequestDetailsProps> = ({ request }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Request Details</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">From:</span>
          <span className="font-medium">{request.routing.departureAirportName || request.routing.departureAirport}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">To:</span>
          <span className="font-medium">{request.routing.arrivalAirportName || request.routing.arrivalAirport}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{request.routing.departureDate.toDate().toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Passengers:</span>
          <span className="font-medium">{request.passengerCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Type:</span>
          <span className="font-medium capitalize">{request.tripType}</span>
        </div>
        {request.additionalNotes && (
          <div className="mt-4">
            <span className="text-gray-600 block mb-2">Notes:</span>
            <p className="text-sm text-gray-700">{request.additionalNotes}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuoteRequestDetails; 