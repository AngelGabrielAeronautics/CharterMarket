import { Timestamp } from 'firebase/firestore';

// Quote and QuoteStatus are now superseded by Offer and OfferStatus in src/types/flight.ts
// export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

// export interface Quote {
//   id: string;
//   quoteId: string;
//   requestId: string;
//   operatorId: string;
//   price: number;
//   commission: number;
//   totalPrice: number;
//   status: QuoteStatus;
//   createdAt: Timestamp;
//   updatedAt: Timestamp;
// }

/**
 * Represents the data submitted by an operator when creating an offer (previously a quote).
 */
export interface QuoteFormData {
  price: number;
  currency?: string; // Quote currency
  notes?: string; // Additional notes from operator
  attachments?: { // Array of uploaded PDF attachments (up to 5)
    url: string;
    fileName: string;
    uploadedAt: Date;
  }[];
  // Legacy fields for backward compatibility
  attachmentUrl?: string; // @deprecated - use attachments array instead
  attachmentFileName?: string; // @deprecated - use attachments array instead
  // Potentially other fields an operator might submit for an offer,
  // like aircraft details or specific notes for this offer.
  // aircraftDetails?: string;
  aircraftId?: string; // Selected aircraft from operator's fleet
}
