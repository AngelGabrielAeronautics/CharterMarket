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
  // Potentially other fields an operator might submit for an offer,
  // like aircraft details or specific notes for this offer.
  // aircraftDetails?: string;
  // notes?: string;
}
