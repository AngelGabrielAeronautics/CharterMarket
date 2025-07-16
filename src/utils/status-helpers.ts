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
        color: '#2e7d32', // Dark green text to match banner text
        backgroundColor: '#e8f5e8', // Light green background to match banner
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
        color: '#9e9e9e',
        backgroundColor: '#eeeeee',
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

// ========================================
// CENTRALIZED OPERATOR STATUS FUNCTIONS
// Used across operator pages for consistency
// ========================================

/**
 * Get the operator-specific status for a quote request
 */
export const getOperatorSpecificStatus = (
  request: any, 
  operatorUserCode: string | undefined
): string => {
  if (!operatorUserCode) return request.status || 'pending';
  
  // Check if operator has submitted a quote for this request
  const operatorOffer = request.offers?.find((offer: any) => offer.operatorUserCode === operatorUserCode);
  
  if (operatorOffer) {
    // Operator has submitted a quote, return based on their quote status
    switch (operatorOffer.offerStatus) {
      case 'pending-client-acceptance':
        return 'quote submitted';
      case 'accepted-by-client':
        return 'accepted';
      case 'rejected-by-client':
        return 'rejected';
      case 'expired':
        return 'expired';
      default:
        return operatorOffer.offerStatus;
    }
  } else {
    // Operator hasn't submitted a quote yet, return overall request status
    return request.status || 'pending';
  }
};

/**
 * Map database status to operator-friendly display names
 */
export const getOperatorStatusDisplayLabel = (status: string): string => {
  switch (status) {
    case 'submitted':
    case 'pending':
      return 'new request';
    case 'under-operator-review':
      return 'under review';
    case 'under-offer':
    case 'quoted':
    case 'quote submitted':
      return 'quote submitted';
    case 'accepted':
    case 'booked':
      return 'accepted!';
    case 'cancelled':
    case 'rejected':
      return 'Client Rejected';
    case 'expired':
      return 'expired';
    // Custom statuses for operator perspective
    case 'won by competitor':
      return 'won by competitor';
    default:
      return status;
  }
};

/**
 * Get custom styling for operator quote request status chips
 */
export const getOperatorCustomStatusSx = (status: string) => {
  const displayStatus = getOperatorStatusDisplayLabel(status);
  
  // Base styling with border for all statuses
  const baseStyle = {
    border: '1px solid',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  };
  
  switch (displayStatus) {
    case 'new request':
      return {
        ...baseStyle,
        backgroundColor: '#ffebee', // Light red background
        color: '#c62828', // Dark red text
        borderColor: '#ef5350', // Red border
      };
    case 'under review':
      return {
        ...baseStyle,
        backgroundColor: '#fff3e0', // Light orange background
        color: '#e65100', // Orange text
        borderColor: '#ff9800', // Orange border
      };
    case 'quote submitted':
      return {
        ...baseStyle,
        backgroundColor: '#e8f5e8', // Light green background
        color: '#2e7d32', // Green text
        borderColor: '#4caf50', // Green border
      };
    case 'accepted!':
      return {
        ...baseStyle,
        backgroundColor: '#51727a', // Charter blue background
        color: '#ffffff', // White text
        borderColor: '#ffffff', // White border
        fontWeight: 'bold'
      };
    case 'Client Rejected':
      return {
        ...baseStyle,
        backgroundColor: '#6b7280', // Dark grey background (matches passenger declined)
        color: '#ffffff', // White text (matches passenger declined)
        borderColor: '#6b7280', // Dark grey border
      };
    case 'won by competitor':
      return {
        ...baseStyle,
        backgroundColor: '#b71c1c', // Dark red background
        color: '#ffffff', // White text
        borderColor: '#d32f2f', // Red border
      };
    case 'expired':
      return {
        ...baseStyle,
        backgroundColor: '#eeeeee', // Grey background
        color: '#9e9e9e', // Light grey text
        borderColor: '#bdbdbd', // Light grey border
      };
    default:
      return baseStyle;
  }
};

/**
 * Get Material-UI color for operator quote request status
 */
export const getOperatorStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  // Operator perspective status colors
  switch (status) {
    case 'new request':
    case 'submitted':
    case 'pending':
      return 'error'; // Pulsing red hue
    case 'quote submitted':
    case 'under-offer':
    case 'quoted':
      return 'success'; // Light green hue
    case 'accepted!':
    case 'accepted':
    case 'booked':
      return 'primary'; // Darker green hue (we'll customize this)
    case 'rejected':
      return 'default'; // Dark grey hue
    case 'won by competitor':
      return 'error'; // Dark red hue
    case 'expired':
    case 'cancelled':
      return 'secondary'; // Greyed out
    default:
      return 'default';
  }
};

// ========================================
// AIRCRAFT STATUS FUNCTIONS
// ========================================

/**
 * Get custom styling for aircraft status chips
 */
export const getAircraftStatusSx = (status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE') => {
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

/**
 * Get Material-UI color for aircraft status
 */
export const getAircraftStatusColor = (
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'
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

// ========================================
// FLIGHT STATUS FUNCTIONS
// ========================================

/**
 * Get Material-UI color for flight status
 */
export const getFlightStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'scheduled':
      return 'primary';
    case 'in-progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// ========================================
// OFFER STATUS FUNCTIONS
// ========================================

/**
 * Get display label for offer status
 */
export const getOfferStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending-client-acceptance':
      return 'Pending Client Acceptance';
    case 'awaiting-acknowledgement':
      return 'Awaiting Acknowledgement';
    case 'accepted-by-client':
      return 'Accepted by Client';
    case 'rejected-by-client':
      return 'Rejected by Client';
    case 'expired':
      return 'Expired';
    default:
      return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

/**
 * Get Material-UI color for offer status
 */
export const getOfferStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'pending-client-acceptance':
      return 'warning';
    case 'accepted-by-client':
      return 'success';
    case 'rejected-by-client':
      return 'error';
    case 'expired':
      return 'default';
    case 'awaiting-acknowledgement':
      return 'info';
    default:
      return 'default';
  }
};