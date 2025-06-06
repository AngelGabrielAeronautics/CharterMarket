// @ts-nocheck
'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import {
  QuoteRequest,
  QuoteRequestFormData,
  FlightStatus,
  FlightRequest,
  FlightRequestFormData,
  FlightRouting,
} from '@/types/flight';
import { generateQuoteRequestCode } from '@/lib/serials';
import { getAirportByICAO } from '@/lib/airport';

export const createQuoteRequest = async (
  clientUserCode: string,
  data: QuoteRequestFormData
): Promise<string> => {
  let requestCode: string = '';
  try {
    console.log(`Creating quote request - Client UserCode: ${clientUserCode}`);

    const { returnDate, multiCityRoutes, ...restData } = data;
    requestCode = await generateQuoteRequestCode(clientUserCode);
    console.log(`Generated request code: ${requestCode}`);

    const expiresAt = new Timestamp(
      Timestamp.now().seconds + 24 * 60 * 60, // 24 hours from now
      0
    );

    // Create base request data
    const quoteRequestData: any = {
      ...restData,
      specialRequirements: restData.specialRequirements || null,
      requestCode,
      clientUserCode,
      status: 'draft' as FlightStatus,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt,
    };

    // Handle different trip types
    if (data.tripType === 'multiCity' && multiCityRoutes && multiCityRoutes.length > 0) {
      // For multi-city trips, store the routes array and fetch names for each leg
      quoteRequestData.multiCityRoutes = await Promise.all(
        multiCityRoutes.map(async (route) => {
          const [depAirportDetails, arrAirportDetails] = await Promise.all([
            getAirportByICAO(route.departureAirport),
            getAirportByICAO(route.arrivalAirport),
          ]);
          return {
            departureAirport: route.departureAirport,
            arrivalAirport: route.arrivalAirport,
            departureAirportName: depAirportDetails
              ? `${depAirportDetails.name} (${depAirportDetails.icao})`
              : null,
            arrivalAirportName: arrAirportDetails
              ? `${arrAirportDetails.name} (${arrAirportDetails.icao})`
              : null,
            departureDate: Timestamp.fromDate(route.departureDate),
            flexibleDate: route.flexibleDate,
          };
        })
      );

      // Also set the primary routing from the first leg for backwards compatibility
      // and add names for the primary routing display
      const firstLeg = quoteRequestData.multiCityRoutes[0];
      const lastLeg = quoteRequestData.multiCityRoutes[quoteRequestData.multiCityRoutes.length - 1];

      quoteRequestData.routing = {
        departureAirport: firstLeg.departureAirport,
        arrivalAirport: lastLeg.arrivalAirport,
        departureAirportName: firstLeg.departureAirportName,
        arrivalAirportName: lastLeg.arrivalAirportName,
        departureDate: firstLeg.departureDate,
        flexibleDates: data.flexibleDates,
      };
      // Add top-level airport names for the overall trip (first departure, last arrival)
      quoteRequestData.departureAirportName = firstLeg.departureAirportName;
      quoteRequestData.arrivalAirportName = lastLeg.arrivalAirportName;
    } else {
      // For one-way and return trips, use the standard routing object
      // and fetch airport names
      const [departureAirportDetails, arrivalAirportDetails] = await Promise.all([
        getAirportByICAO(data.departureAirport),
        getAirportByICAO(data.arrivalAirport),
      ]);

      quoteRequestData.routing = {
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        departureAirportName: departureAirportDetails
          ? `${departureAirportDetails.name} (${departureAirportDetails.icao})`
          : null,
        arrivalAirportName: arrivalAirportDetails
          ? `${arrivalAirportDetails.name} (${arrivalAirportDetails.icao})`
          : null,
        departureDate: Timestamp.fromDate(data.departureDate),
        returnDate: data.returnDate ? Timestamp.fromDate(data.returnDate) : null,
        flexibleDates: data.flexibleDates,
      };
      // Add top-level airport names
      quoteRequestData.departureAirportName = departureAirportDetails
        ? `${departureAirportDetails.name} (${departureAirportDetails.icao})`
        : null;
      quoteRequestData.arrivalAirportName = arrivalAirportDetails
        ? `${arrivalAirportDetails.name} (${arrivalAirportDetails.icao})`
        : null;
    }

    console.log(
      'Quote request data to be saved (with airport names):',
      JSON.stringify(quoteRequestData, null, 2)
    );
    console.log(`Attempting to create quote request with structured document ID: ${requestCode}`);

    const requestDocRef = doc(db, 'quoteRequests', requestCode);
    // Explicitly cast to QuoteRequest before saving, after all modifications
    await setDoc(requestDocRef, quoteRequestData as QuoteRequest);

    console.log(
      `Quote request created successfully with ID (structured requestCode): ${requestCode}`
    );
    return requestCode;
  } catch (error) {
    console.error('Error creating quote request:', error);
    if (error instanceof Error && error.message.includes('document already exists')) {
      console.error(`Document with ID ${requestCode} already exists.`);
      throw new Error('Duplicate quote request ID. Please try again.');
    }
    throw new Error('Failed to create quote request');
  }
};

// For backward compatibility
export const createFlightRequest = createQuoteRequest;

export const updateQuoteRequest = async (
  id: string,
  data: Partial<QuoteRequest>
): Promise<void> => {
  try {
    const requestRef = doc(db, 'quoteRequests', id);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Quote request not found for update');
    }

    const existingData = requestSnap.data() as QuoteRequest;
    const updatePayload: { [key: string]: any } = {
      // Using a more flexible type for Firestore update
      updatedAt: Timestamp.now(),
    };

    // Directly map top-level fields from QuoteRequestFormData if they exist in data
    if (data.tripType !== undefined) updatePayload.tripType = data.tripType;
    if (data.passengerCount !== undefined) updatePayload.passengerCount = data.passengerCount;
    if (data.cabinClass !== undefined) updatePayload.cabinClass = data.cabinClass;
    if (data.specialRequirements !== undefined)
      updatePayload.specialRequirements = data.specialRequirements;
    if (data.twinEngineMin !== undefined) updatePayload.twinEngineMin = data.twinEngineMin;

    // Add handling for status field from QuoteRequest
    if (data.status !== undefined) updatePayload.status = data.status;

    // Handle routing updates carefully
    let needsRoutingUpdate = false;
    const newRouting: Partial<FlightRouting> = { ...existingData.routing };

    if (data.departureAirport !== undefined) {
      newRouting.departureAirport = data.departureAirport;
      needsRoutingUpdate = true;
    }
    if (data.arrivalAirport !== undefined) {
      newRouting.arrivalAirport = data.arrivalAirport;
      needsRoutingUpdate = true;
    }
    if (data.departureDate !== undefined) {
      newRouting.departureDate = Timestamp.fromDate(data.departureDate);
      needsRoutingUpdate = true;
    }
    if (data.returnDate !== undefined) {
      // Can be null to remove return date
      newRouting.returnDate = data.returnDate ? Timestamp.fromDate(data.returnDate) : undefined;
      needsRoutingUpdate = true;
    } else if (
      Object.prototype.hasOwnProperty.call(data, 'returnDate') &&
      data.returnDate === undefined
    ) {
      // Explicitly removing returnDate
      newRouting.returnDate = undefined;
      needsRoutingUpdate = true;
    }

    if (data.flexibleDates !== undefined) {
      newRouting.flexibleDates = data.flexibleDates;
      needsRoutingUpdate = true;
    }

    if (needsRoutingUpdate) {
      updatePayload.routing = newRouting;
    }

    // If other top-level fields specific to QuoteRequest (not in QuoteRequestFormData) were intended
    // to be updatable through this function, they'd need explicit handling here.
    // For now, focusing on QuoteRequestFormData fields and preserving existing structure.

    await updateDoc(requestRef, updatePayload);
  } catch (error) {
    console.error('Error updating quote request:', error);
    throw new Error('Failed to update quote request');
  }
};

// For backward compatibility
export const updateFlightRequest = updateQuoteRequest;

export const getQuoteRequest = async (id: string): Promise<QuoteRequest | null> => {
  try {
    const requestRef = doc(db, 'quoteRequests', id);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      return null;
    }

    return {
      id: requestDoc.id,
      ...requestDoc.data(),
    } as QuoteRequest;
  } catch (error) {
    console.error('Error getting quote request:', error);
    throw new Error('Failed to get quote request');
  }
};

// For backward compatibility
export const getFlightRequest = getQuoteRequest;

export const getClientQuoteRequests = async (clientUserCode: string): Promise<QuoteRequest[]> => {
  try {
    const requestsQuery = query(
      collection(db, 'quoteRequests'),
      where('clientUserCode', '==', clientUserCode)
    );

    const querySnapshot = await getDocs(requestsQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as QuoteRequest[];
  } catch (error) {
    console.error('Error getting client quote requests:', error);
    throw new Error('Failed to get client quote requests');
  }
};

// For backward compatibility
export const getClientFlightRequests = getClientQuoteRequests;

export const submitQuoteRequest = async (id: string): Promise<void> => {
  try {
    console.log(`Submitting quote request ID: ${id}`);
    const requestRef = doc(db, 'quoteRequests', id);

    // First check if the request exists
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      console.error(`Request with ID ${id} not found`);
      throw new Error('Quote request not found');
    }

    await updateDoc(requestRef, {
      status: 'pending' as FlightStatus,
      updatedAt: Timestamp.now(),
    });
    console.log(`Quote request ${id} status updated to pending`);
  } catch (error) {
    console.error('Error submitting quote request:', error);
    throw new Error('Failed to submit quote request');
  }
};

// For backward compatibility
export const submitFlightRequest = submitQuoteRequest;

export const cancelQuoteRequest = async (id: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'quoteRequests', id);
    await updateDoc(requestRef, {
      status: 'cancelled' as FlightStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error cancelling quote request:', error);
    throw new Error('Failed to cancel quote request');
  }
};

// For backward compatibility
export const cancelFlightRequest = cancelQuoteRequest;

/**
 * Fetches quote requests for a given operator
 * @param operatorId The operator's user code
 */
export const getOperatorQuoteRequests = async (operatorId: string): Promise<QuoteRequest[]> => {
  try {
    console.log(
      `Fetching PENDING quote requests for operator: ${operatorId} to potentially quote on.`
    );
    // operatorId is passed for logging/context but not strictly used in the query filter here
    // as any operator can see pending requests. If it were for requests *assigned* to an operator,
    // then operatorId would be in a where() clause.

    const pendingQuery = query(
      collection(db, 'quoteRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    let pendingRequests: QuoteRequest[] = [];

    try {
      const pendingSnapshot = await getDocs(pendingQuery);
      pendingRequests = pendingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuoteRequest[];
      console.log(`Found ${pendingRequests.length} PENDING quote requests.`);

      return pendingRequests;
    } catch (indexError: any) {
      if (
        indexError.message?.includes('The query requires an index') ||
        indexError.toString().includes('FirebaseError: The query requires an index')
      ) {
        console.warn(
          'Firebase index error detected for PENDING operator requests:',
          indexError.message || indexError.toString()
        );
        const indexUrlMatch = indexError.message?.match(
          /(https:\/\/console\.firebase\.google\.com\/[^\s]+)/
        );
        const indexUrl = indexUrlMatch ? indexUrlMatch[1] : null;
        const enhancedError = new Error('Firebase index being created for PENDING operator view');
        (enhancedError as any).isIndexError = true;
        (enhancedError as any).indexUrl = indexUrl;
        throw enhancedError;
      }
      throw indexError; // Rethrow other errors
    }
  } catch (error: any) {
    console.error(`Error fetching PENDING operator quote requests for ${operatorId}:`, error);
    if ((error as any).isIndexError) {
      throw error;
    }
    throw new Error('Failed to fetch PENDING operator quote requests');
  }
};

/**
 * Fallback method to fetch quote requests for an operator without sorting
 * This also now focuses only on 'pending' requests as the main function does.
 */
export const getOperatorQuoteRequestsFallback = async (
  operatorId: string
): Promise<QuoteRequest[]> => {
  try {
    console.log(
      `Using fallback method to fetch PENDING quote requests (operator: ${operatorId} is viewing)`
    );

    const q = query(
      collection(db, 'quoteRequests'),
      where('status', '==', 'pending')
      // No orderBy to avoid needing a composite index for the fallback
    );

    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} PENDING quote requests using fallback query.`);

    const results = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as QuoteRequest[];

    // Client-side sort if needed, as fallback doesn't sort via query
    return results.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0); // Use createdAt for pending requests
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error(`Error in fallback PENDING query for operator ${operatorId}:`, error);
    return []; // Return empty on error for fallback
  }
};
