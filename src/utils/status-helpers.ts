import { FlightStatus } from '@/types/flight';

export interface StatusDisplay {
  label: string;
  color: string;
  backgroundColor?: string;
  pulse?: boolean;
  description?: string;
}

/**
 * Get display information for quote request status from passenger/agent perspective
 */
export function getPassengerStatusDisplay(
  status: FlightStatus,
  hasUnviewedQuotes: boolean = false
): StatusDisplay {
  switch (status) {
    case 'submitted':
      return {
        label: 'Submitted',
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        description: 'Request submitted, waiting for operator quotes'
      };
      
    case 'quote-received':
      return {
        label: 'New Quote Received',
        color: '#ffffff',
        backgroundColor: '#1e40af', // Dark blue
        pulse: true,
        description: 'New quotes available - click to view'
      };
      
    case 'quotes-viewed':
      return {
        label: 'Quote(s) Received',
        color: '#1f2937',
        backgroundColor: '#e5e7eb',
        description: 'You have viewed all available quotes'
      };
      
    case 'accepted':
      return {
        label: 'Accepted',
        color: '#ffffff',
        backgroundColor: '#51727a', // Correct blue with white border
        description: 'Quote accepted successfully'
      };
      
    case 'rejected':
      return {
        label: 'Declined',
        color: '#ffffff',
        backgroundColor: '#6b7280', // Grey
        description: 'Quotes declined'
      };
      
    case 'expired':
      return {
        label: 'Expired',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        description: 'Request expired without decision'
      };
      
    default:
      return {
        label: 'Unknown',
        color: '#6b7280',
        backgroundColor: '#f3f4f6'
      };
  }
}

/**
 * Get display information for quote request status from operator perspective
 */
export function getOperatorStatusDisplay(
  status: FlightStatus,
  operatorUserCode: string,
  request: {
    operatorUserCodesWhoHaveQuoted?: string[];
    acceptedOperatorUserCode?: string;
  }
): StatusDisplay {
  const hasOperatorQuoted = request.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode);
  const operatorWon = request.acceptedOperatorUserCode === operatorUserCode;
  const someoneElseWon = request.acceptedOperatorUserCode && !operatorWon;

  switch (status) {
    case 'submitted':
      return {
        label: 'New Request',
        color: '#ffffff',
        backgroundColor: '#dc2626', // Red
        pulse: true,
        description: 'New quote request - respond quickly!'
      };
      
    case 'quote-received':
    case 'quotes-viewed':
      if (hasOperatorQuoted) {
        return {
          label: 'Quote Submitted',
          color: '#ffffff',
          backgroundColor: '#16a34a', // Light green
          description: 'Your quote submitted, awaiting client decision'
        };
      } else {
        return {
          label: 'New Request',
          color: '#ffffff',
          backgroundColor: '#dc2626', // Red  
          pulse: true,
          description: 'Quote request available - others have quoted'
        };
      }
      
    case 'accepted':
      if (operatorWon) {
        return {
          label: 'Quote Accepted',
          color: '#ffffff',
          backgroundColor: '#15803d', // Darker green
          description: 'Congratulations! Your quote was accepted'
        };
      } else if (hasOperatorQuoted) {
        return {
          label: 'Won by Competitor',
          color: '#ffffff',
          backgroundColor: '#991b1b', // Dark red
          description: 'Client chose a competitor\'s quote'
        };
      } else {
        return {
          label: 'Won by Competitor',
          color: '#ffffff',
          backgroundColor: '#991b1b', // Dark red
          description: 'Another operator won this request'
        };
      }
      
    case 'rejected':
      if (hasOperatorQuoted) {
        return {
          label: 'Client Rejected',
          color: '#ffffff',
          backgroundColor: '#4b5563', // Dark grey
          description: 'Client declined all quotes including yours'
        };
      } else {
        return {
          label: 'Client Rejected',
          color: '#ffffff',
          backgroundColor: '#4b5563', // Dark grey
          description: 'Client declined all operator quotes'
        };
      }
      
    case 'expired':
      return {
        label: 'Expired',
        color: '#9ca3af',
        backgroundColor: '#f9fafb',
        description: 'Request expired without client decision'
      };
      
    default:
      return {
        label: 'Unknown',
        color: '#6b7280',
        backgroundColor: '#f3f4f6'
      };
  }
}

/**
 * Get CSS classes for pulsing animation
 */
export function getPulseClasses(pulse: boolean = false): string {
  if (!pulse) return '';
  
  return 'animate-pulse shadow-lg';
}

/**
 * Determine if a request needs operator attention (for notifications/badges)
 */
export function needsOperatorAttention(
  status: FlightStatus,
  operatorUserCode: string,
  request: {
    operatorUserCodesWhoHaveQuoted?: string[];
    acceptedOperatorUserCode?: string;
  }
): boolean {
  const hasOperatorQuoted = request.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode);
  
  // New requests that operator hasn't quoted on need attention
  if (['submitted', 'quote-received', 'quotes-viewed'].includes(status) && !hasOperatorQuoted) {
    return true;
  }
  
  return false;
}

/**
 * Determine if a request needs passenger attention (for notifications/badges)  
 */
export function needsPassengerAttention(
  status: FlightStatus,
  hasUnviewedQuotes: boolean = false
): boolean {
  // New quotes that haven't been viewed need attention
  return status === 'quote-received' || hasUnviewedQuotes;
} 