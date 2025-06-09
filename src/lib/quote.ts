// @ts-nocheck
'use client';

/**
 * HYBRID QUOTE SYSTEM
 *
 * This module implements a hybrid approach for managing quotes:
 *
 * 1. STANDALONE QUOTES COLLECTION (/quotes/{quoteId})
 *    - Full quote documents with detailed information
 *    - Better for querying, analytics, and management
 *    - Supports rich quote data (aircraft details, terms, etc.)
 *
 * 2. EMBEDDED REFERENCES (/quoteRequests/{requestId}/offers[])
 *    - Simplified quote references in quote request documents
 *    - Maintains backward compatibility
 *    - Enables quick access to basic quote info
 *
 * BENEFITS:
 * - Best of both worlds: detailed standalone docs + quick embedded access
 * - Backward compatibility with existing code
 * - Better data normalization and querying capabilities
 * - Future-proof for complex quote management features
 *
 * SYNC STRATEGY:
 * - Creation: Both locations created atomically in transaction
 * - Updates: Status changes sync both locations
 * - Details: Only update standalone collection (embedded refs stay simple)
 */

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  doc,
  Timestamp,
  getDoc,
  runTransaction,
  orderBy,
  arrayUnion,
  setDoc,
} from 'firebase/firestore';
import { generateQuoteId } from '@/lib/serials';
import { QuoteFormData } from '@/types/quote';
import { Offer, OfferStatus, QuoteRequest, FlightStatus } from '@/types/flight';

/**
 * Submit an operator's offer for a specific quote request.
 * Creates a standalone quote document AND adds a reference to the QuoteRequest's 'offers' array.
 * HYBRID APPROACH: Best of both worlds!
 *
 * The generated quote ID will have the same last 4 characters as the originating request ID for easy linking.
 */
export const createQuote = async (
  requestId: string,
  operatorUserCode: string,
  data: QuoteFormData
): Promise<string> => {
  const quoteRequestRef = doc(db, 'quoteRequests', requestId);
  const offerId = generateQuoteId(operatorUserCode, requestId);
  const quoteRef = doc(db, 'quotes', offerId);

  const commission = parseFloat((data.price * 0.03).toFixed(2));
  const totalPrice = parseFloat((data.price + commission).toFixed(2));

  try {
    let finalQuoteData: any;
    let finalEmbeddedOffer: any;

    await runTransaction(db, async (transaction) => {
      const quoteRequestSnap = await transaction.get(quoteRequestRef);
      if (!quoteRequestSnap.exists()) {
        throw new Error(`QuoteRequest with ID ${requestId} not found. Cannot submit offer.`);
      }

      const quoteRequestData = quoteRequestSnap.data() as QuoteRequest;

      // Updated status check for new flow
      const allowedStatuses = [
        'submitted',
        'under-operator-review',
        'under-offer',
        'pending',
        'quoted',
      ];
      if (!allowedStatuses.includes(quoteRequestData.status)) {
        throw new Error(
          `Cannot submit offer: Request status is '${quoteRequestData.status}'. ` +
            `Offers can only be submitted when status is: ${allowedStatuses.join(', ')}.`
        );
      }

      // Check if request is already accepted by another operator
      if (quoteRequestData.status === 'accepted' || quoteRequestData.status === 'booked') {
        throw new Error(`This request has already been accepted by another operator.`);
      }

      // More robust duplicate offer check
      const existingOperatorCodes = quoteRequestData.operatorUserCodesWhoHaveQuoted || [];
      if (existingOperatorCodes.includes(operatorUserCode)) {
        throw new Error(`You have already submitted an offer for this request.`);
      }

      // Also check the offers array for additional safety
      if (quoteRequestData.offers?.some((o) => o.operatorUserCode === operatorUserCode)) {
        throw new Error(`You have already submitted an offer for this request.`);
      }

      // Extract clientUserCode from the quote request
      const clientUserCode = quoteRequestData.clientUserCode;

      // Full quote document for the quotes collection
      finalQuoteData = {
        offerId,
        operatorUserCode,
        clientUserCode, // Include the originating client's userCode
        requestId,
        price: data.price,
        commission,
        totalPrice,
        currency: 'USD', // Default currency
        validUntil: null, // Can be updated later
        notes: null, // Can be updated later
        aircraftType: null, // Can be updated later
        aircraftRegistration: null, // Can be updated later
        departureTime: null, // Can be updated later
        estimatedFlightTime: null, // Can be updated later
        includedServices: [], // Can be updated later
        excludedServices: [], // Can be updated later
        termsAndConditions: null, // Can be updated later
        cancellationPolicy: null, // Can be updated later
        offerStatus: 'pending-client-acceptance' as OfferStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Simplified offer object for embedded reference in quoteRequest
      finalEmbeddedOffer = {
        offerId,
        operatorUserCode,
        clientUserCode, // Include in embedded offer for consistency
        price: data.price,
        commission,
        totalPrice,
        offerStatus: 'pending-client-acceptance' as OfferStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // 1. Create the standalone quote document
      transaction.set(quoteRef, finalQuoteData);

      // 2. Add embedded reference to the quoteRequest and update tracking
      transaction.update(quoteRequestRef, {
        offers: arrayUnion(finalEmbeddedOffer),
        operatorUserCodesWhoHaveQuoted: arrayUnion(operatorUserCode),
        status: 'under-offer' as FlightStatus,
        updatedAt: Timestamp.now(),
      });
    });

    console.log(
      `Successfully created quote ${offerId} for client ${finalQuoteData.clientUserCode} in quotes collection and added reference to QuoteRequest ${requestId}.`
    );
    return offerId;
  } catch (error) {
    console.error('Error in createQuote transaction:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to submit offer: ${error.message}`);
    }
    throw new Error('Failed to submit offer due to an unexpected error.');
  }
};

/**
 * Get detailed quotes for a specific request from the standalone quotes collection
 * This provides more information than the embedded offers array
 */
export const getDetailedQuotesForRequest = async (requestId: string) => {
  try {
    return await getAllQuotes({ requestId });
  } catch (error) {
    console.error(`Error fetching detailed quotes for request ${requestId}:`, error);
    throw new Error('Failed to fetch detailed quotes for request');
  }
};

/**
 * Fetch all quotes for a given quote request (LEGACY - uses embedded approach)
 * For detailed quote information, use getDetailedQuotesForRequest instead
 */
export const getQuotesForRequest = async (requestId: string): Promise<Offer[]> => {
  try {
    const quoteRequestRef = doc(db, 'quoteRequests', requestId);
    const quoteRequestSnap = await getDoc(quoteRequestRef);
    if (!quoteRequestSnap.exists()) {
      console.error(`QuoteRequest with ID ${requestId} not found.`);
      return [];
    }
    const data = quoteRequestSnap.data() as QuoteRequest;
    return data.offers || [];
  } catch (error) {
    console.error('Error fetching offers for request:', error);
    throw new Error('Failed to fetch offers for request');
  }
};

/**
 * Update the status of a quote
 */
export const updateQuoteStatus = async (
  quoteDocId: string,
  requestId: string,
  status: OfferStatus
): Promise<void> => {
  try {
    const quoteRequestRef = doc(db, 'quoteRequests', requestId);
    await runTransaction(db, async (transaction) => {
      const quoteRequestSnap = await transaction.get(quoteRequestRef);
      if (!quoteRequestSnap.exists()) {
        throw new Error(`QuoteRequest with ID ${requestId} not found.`);
      }
      const quoteRequestData = quoteRequestSnap.data() as QuoteRequest;
      const offers = quoteRequestData.offers?.map((offer) => {
        if (offer.offerId === quoteDocId) {
          return { ...offer, offerStatus: status, updatedAt: Timestamp.now() };
        }
        return offer;
      });
      if (!offers?.some((o) => o.offerId === quoteDocId)) {
        throw new Error(`Offer with ID ${quoteDocId} not found in request ${requestId}.`);
      }
      transaction.update(quoteRequestRef, { offers, updatedAt: Timestamp.now() });
    });
    console.log(`Updated offer ${quoteDocId} in request ${requestId} to status ${status}`);
  } catch (error) {
    console.error('Error updating offer status:', error);
    throw new Error('Failed to update offer status');
  }
};

/**
 * Handles a client accepting a specific operator's quote.
 * Updates the accepted Offer's status within the QuoteRequest and the parent QuoteRequest status.
 */
export const acceptOperatorQuote = async (
  requestId: string,
  acceptedOfferId: string
): Promise<void> => {
  const quoteRequestRef = doc(db, 'quoteRequests', requestId);

  try {
    await runTransaction(db, async (transaction) => {
      const quoteRequestSnap = await transaction.get(quoteRequestRef);
      if (!quoteRequestSnap.exists()) {
        throw new Error(`QuoteRequest with ID ${requestId} not found.`);
      }
      const quoteRequestData = quoteRequestSnap.data() as QuoteRequest;

      if (
        quoteRequestData.status === 'booked' ||
        quoteRequestData.status === 'accepted' ||
        quoteRequestData.status === 'cancelled'
      ) {
        throw new Error(
          `QuoteRequest ${requestId} has already been booked/accepted or is cancelled.`
        );
      }

      let acceptedOperatorUserCode: string | undefined = undefined;
      let offerFoundAndPending = false;

      const updatedOffers = quoteRequestData.offers?.map((offer) => {
        if (offer.offerId === acceptedOfferId) {
          if (offer.offerStatus !== 'pending-client-acceptance') {
            throw new Error(
              `Offer ${acceptedOfferId} is not in 'pending-client-acceptance' state (current: ${offer.offerStatus}).`
            );
          }
          acceptedOperatorUserCode = offer.operatorUserCode;
          offerFoundAndPending = true;
          return {
            ...offer,
            offerStatus: 'accepted-by-client' as OfferStatus,
            updatedAt: Timestamp.now(),
          };
        }
        return offer;
      });

      if (!offerFoundAndPending) {
        throw new Error(
          `Offer with ID ${acceptedOfferId} not found or not in a state to be accepted in QuoteRequest ${requestId}.`
        );
      }
      if (!acceptedOperatorUserCode) {
        throw new Error(
          `Could not determine operatorUserCode for accepted offer ${acceptedOfferId}.`
        );
      }

      transaction.update(quoteRequestRef, {
        offers: updatedOffers,
        status: 'accepted' as FlightStatus,
        acceptedOfferId: acceptedOfferId,
        acceptedOperatorUserCode: acceptedOperatorUserCode,
        updatedAt: Timestamp.now(),
      });
    });

    console.log(`Successfully accepted Offer ${acceptedOfferId} within QuoteRequest ${requestId}.`);
  } catch (error) {
    console.error('Error in acceptOperatorQuote transaction:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to accept offer: ${error.message}`);
    }
    throw new Error('Failed to accept offer due to an unexpected error.');
  }
};

/**
 * Fetches all quotes submitted by a specific operator.
 * This will now query QuoteRequests and filter offers internally.
 */
export const getOperatorSubmittedQuotes = async (operatorUserCode: string): Promise<Offer[]> => {
  if (!operatorUserCode) {
    console.warn('Operator user code is required to fetch submitted offers.');
    return [];
  }
  try {
    const q = query(
      collection(db, 'quoteRequests'),
      where('operatorUserCodesWhoHaveQuoted', 'array-contains', operatorUserCode)
    );
    const snapshot = await getDocs(q);

    const allMatchingOffers: Offer[] = [];
    snapshot.docs.forEach((doc) => {
      const quoteRequestData = doc.data() as QuoteRequest;
      quoteRequestData.offers?.forEach((offer) => {
        if (offer.operatorUserCode === operatorUserCode) {
          allMatchingOffers.push({ ...offer, requestId: doc.id });
        }
      });
    });

    allMatchingOffers.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return allMatchingOffers;
  } catch (error) {
    console.error(`Error fetching submitted offers for operator ${operatorUserCode}:`, error);
    throw new Error('Failed to fetch submitted offers');
  }
};

/**
 * Get a specific quote by its ID from the quotes collection
 */
export const getQuoteById = async (quoteId: string) => {
  try {
    const quoteRef = doc(db, 'quotes', quoteId);
    const quoteSnap = await getDoc(quoteRef);

    if (!quoteSnap.exists()) {
      throw new Error(`Quote with ID ${quoteId} not found`);
    }

    return {
      id: quoteSnap.id,
      ...quoteSnap.data(),
    };
  } catch (error) {
    console.error('Error fetching quote by ID:', error);
    throw new Error('Failed to fetch quote');
  }
};

/**
 * Get all quotes from the quotes collection (with optional filtering)
 */
export const getAllQuotes = async (filters?: {
  operatorUserCode?: string;
  requestId?: string;
  status?: OfferStatus;
}) => {
  try {
    let q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));

    if (filters?.operatorUserCode) {
      q = query(q, where('operatorUserCode', '==', filters.operatorUserCode));
    }

    if (filters?.requestId) {
      q = query(q, where('requestId', '==', filters.requestId));
    }

    if (filters?.status) {
      q = query(q, where('offerStatus', '==', filters.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw new Error('Failed to fetch quotes');
  }
};

/**
 * Update a quote status in both the standalone quotes collection AND the embedded reference
 * HYBRID SYNC: Keeps both locations in sync
 */
export const updateQuoteStatusHybrid = async (
  quoteId: string,
  newStatus: OfferStatus
): Promise<void> => {
  try {
    const quoteRef = doc(db, 'quotes', quoteId);

    await runTransaction(db, async (transaction) => {
      // 1. Get the standalone quote to find the requestId
      const quoteSnap = await transaction.get(quoteRef);
      if (!quoteSnap.exists()) {
        throw new Error(`Quote with ID ${quoteId} not found`);
      }

      const quoteData = quoteSnap.data();
      const requestId = quoteData.requestId;

      // 2. Update the standalone quote document
      transaction.update(quoteRef, {
        offerStatus: newStatus,
        updatedAt: Timestamp.now(),
      });

      // 3. Update the embedded reference in the quoteRequest
      const quoteRequestRef = doc(db, 'quoteRequests', requestId);
      const quoteRequestSnap = await transaction.get(quoteRequestRef);

      if (quoteRequestSnap.exists()) {
        const quoteRequestData = quoteRequestSnap.data() as QuoteRequest;
        const updatedOffers = quoteRequestData.offers?.map((offer) => {
          if (offer.offerId === quoteId) {
            return { ...offer, offerStatus: newStatus, updatedAt: Timestamp.now() };
          }
          return offer;
        });

        transaction.update(quoteRequestRef, {
          offers: updatedOffers,
          updatedAt: Timestamp.now(),
        });
      }
    });

    console.log(`Updated quote ${quoteId} status to ${newStatus} in both collections`);
  } catch (error) {
    console.error('Error updating quote status:', error);
    throw new Error('Failed to update quote status');
  }
};

/**
 * Get all quotes for a specific operator from the standalone quotes collection
 * This provides more detailed quote information than the embedded approach
 */
export const getOperatorQuotesDetailed = async (operatorUserCode: string) => {
  try {
    return await getAllQuotes({ operatorUserCode });
  } catch (error) {
    console.error(`Error fetching detailed quotes for operator ${operatorUserCode}:`, error);
    throw new Error('Failed to fetch operator quotes');
  }
};

/**
 * Update quote details in the standalone quotes collection
 */
export const updateQuoteDetails = async (
  quoteId: string,
  updates: {
    notes?: string;
    aircraftType?: string;
    aircraftRegistration?: string;
    departureTime?: Date;
    estimatedFlightTime?: string;
    includedServices?: string[];
    excludedServices?: string[];
    termsAndConditions?: string;
    cancellationPolicy?: string;
    validUntil?: Date;
  }
): Promise<void> => {
  try {
    const quoteRef = doc(db, 'quotes', quoteId);

    // Convert Date objects to Timestamps
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.departureTime) {
      updateData.departureTime = Timestamp.fromDate(updates.departureTime);
    }

    if (updates.validUntil) {
      updateData.validUntil = Timestamp.fromDate(updates.validUntil);
    }

    await updateDoc(quoteRef, updateData);
    console.log(`Updated quote ${quoteId} details`);
  } catch (error) {
    console.error('Error updating quote details:', error);
    throw new Error('Failed to update quote details');
  }
};

// Keep the existing functions for backward compatibility
