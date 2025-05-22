// @ts-nocheck
'use client';

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
} from 'firebase/firestore';
import { generateQuoteId } from '@/lib/serials';
import { QuoteFormData } from '@/types/quote';
import { Offer, OfferStatus, QuoteRequest, FlightStatus } from '@/types/flight';

/**
 * Submit an operator's offer for a specific quote request.
 * Adds the offer to the QuoteRequest's 'offers' array and updates its status.
 */
export const createQuote = async (
  requestId: string,
  operatorId: string,
  data: QuoteFormData
): Promise<string> => {
  const quoteRequestRef = doc(db, 'quoteRequests', requestId);
  const offerId = generateQuoteId(operatorId);

  const commission = parseFloat((data.price * 0.03).toFixed(2));
  const totalPrice = parseFloat((data.price + commission).toFixed(2));

  const newOffer: Offer = {
    offerId,
    operatorId,
    price: data.price,
    commission,
    totalPrice,
    offerStatus: 'pending-client-acceptance' as OfferStatus,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    await runTransaction(db, async (transaction) => {
      const quoteRequestSnap = await transaction.get(quoteRequestRef);
      if (!quoteRequestSnap.exists()) {
        throw new Error(`QuoteRequest with ID ${requestId} not found. Cannot submit offer.`);
      }

      const quoteRequestData = quoteRequestSnap.data() as QuoteRequest;

      if (quoteRequestData.status !== 'pending' && quoteRequestData.status !== 'quoted') {
        console.warn(
          `Attempting to submit an offer to a QuoteRequest (${requestId}) that is not in 'pending' or 'quoted' state (current: ${quoteRequestData.status}).`
        );
      }

      if (quoteRequestData.offers?.some((o) => o.operatorId === operatorId)) {
        console.warn(
          `Operator ${operatorId} has already submitted an offer for QuoteRequest ${requestId}.`
        );
        throw new Error(`Operator ${operatorId} has already submitted an offer for this request.`);
      }

      transaction.update(quoteRequestRef, {
        offers: arrayUnion(newOffer),
        operatorIdsWhoHaveQuoted: arrayUnion(operatorId),
        status: 'quoted' as FlightStatus,
        updatedAt: Timestamp.now(),
      });
    });

    console.log(
      `Successfully submitted offer ${offerId} by operator ${operatorId} for QuoteRequest ${requestId}.`
    );
    return offerId;
  } catch (error) {
    console.error('Error in submitOffer (createQuote) transaction:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to submit offer: ${error.message}`);
    }
    throw new Error('Failed to submit offer due to an unexpected error.');
  }
};

/**
 * Fetch all quotes for a given quote request
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

      if (quoteRequestData.status === 'booked' || quoteRequestData.status === 'cancelled') {
        throw new Error(`QuoteRequest ${requestId} has already been booked or is cancelled.`);
      }

      let acceptedOperatorId: string | undefined = undefined;
      let offerFoundAndPending = false;

      const updatedOffers = quoteRequestData.offers?.map((offer) => {
        if (offer.offerId === acceptedOfferId) {
          if (offer.offerStatus !== 'pending-client-acceptance') {
            throw new Error(
              `Offer ${acceptedOfferId} is not in 'pending-client-acceptance' state (current: ${offer.offerStatus}).`
            );
          }
          acceptedOperatorId = offer.operatorId;
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
      if (!acceptedOperatorId) {
        throw new Error(`Could not determine operatorId for accepted offer ${acceptedOfferId}.`);
      }

      transaction.update(quoteRequestRef, {
        offers: updatedOffers,
        status: 'booked' as FlightStatus,
        acceptedOfferId: acceptedOfferId,
        acceptedOperatorId: acceptedOperatorId,
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
export const getOperatorSubmittedQuotes = async (operatorId: string): Promise<Offer[]> => {
  if (!operatorId) {
    console.warn('Operator ID is required to fetch submitted offers.');
    return [];
  }
  try {
    const q = query(
      collection(db, 'quoteRequests'),
      where('operatorIdsWhoHaveQuoted', 'array-contains', operatorId)
    );
    const snapshot = await getDocs(q);

    const allMatchingOffers: Offer[] = [];
    snapshot.docs.forEach((doc) => {
      const quoteRequestData = doc.data() as QuoteRequest;
      quoteRequestData.offers?.forEach((offer) => {
        if (offer.operatorId === operatorId) {
          allMatchingOffers.push({ ...offer, requestId: doc.id });
        }
      });
    });

    allMatchingOffers.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return allMatchingOffers;
  } catch (error) {
    console.error(`Error fetching submitted offers for operator ${operatorId}:`, error);
    throw new Error('Failed to fetch submitted offers');
  }
};
