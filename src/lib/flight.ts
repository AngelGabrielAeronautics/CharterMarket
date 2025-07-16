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
import { sendOperatorQuoteNotifications, sendQuoteConfirmationEmail } from '@/lib/email';

export const createQuoteRequest = async (
  clientUserCode: string,
  data: QuoteRequestFormData
): Promise<string> => {
  let requestCode: string = '';
  try {
    console.log(`Creating quote request - Client UserCode: ${clientUserCode}`);

    const { returnDate, multiCityRoutes, ...restData } = data;
    requestCode = generateQuoteRequestCode(clientUserCode);
    console.log(`Generated request code: ${requestCode}`);

    // Create base request data
    const quoteRequestData: any = {
      ...restData,
      specialRequirements: restData.specialRequirements || null,
      requestCode,
      clientUserCode,
      status: 'submitted' as FlightStatus, // Use new initial status
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Removed expiresAt - quotes expire, not quote requests
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
            departureDate:
              route.departureDate instanceof Date
                ? Timestamp.fromDate(route.departureDate)
                : Timestamp.fromDate(new Date(route.departureDate)),
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
        departureDate:
          data.departureDate instanceof Date
            ? Timestamp.fromDate(data.departureDate)
            : Timestamp.fromDate(new Date(data.departureDate)),
        returnDate: data.returnDate
          ? data.returnDate instanceof Date
            ? Timestamp.fromDate(data.returnDate)
            : Timestamp.fromDate(new Date(data.returnDate))
          : null,
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

    // Remove undefined fields to prevent Firestore errors
    Object.keys(quoteRequestData).forEach((key) => {
      if (quoteRequestData[key] === undefined) {
        delete quoteRequestData[key];
      }
    });

    const requestDocRef = doc(db, 'quoteRequests', requestCode);
    // Explicitly cast to QuoteRequest before saving, after all modifications
    await setDoc(requestDocRef, quoteRequestData as QuoteRequest);

    console.log(
      `Quote request created successfully with ID (structured requestCode): ${requestCode}`
    );
    return requestCode;
  } catch (error) {
    console.error('Error creating quote request:', error);
    console.error('Failed request code:', requestCode);
    throw error;
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
      newRouting.returnDate = data.returnDate ? Timestamp.fromDate(data.returnDate) : null;
      needsRoutingUpdate = true;
    }
    if (data.flexibleDates !== undefined) {
      newRouting.flexibleDates = data.flexibleDates;
      needsRoutingUpdate = true;
    }

    if (needsRoutingUpdate) {
      updatePayload.routing = newRouting;
    }

    console.log('Updating quote request with payload:', updatePayload);
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

    const quoteRequestData = requestDoc.data() as QuoteRequest;

    // Fetch user profile to get email and name for notifications
    let userEmail: string = '';
    let userFirstName: string = '';
    
    try {
      console.log(`Fetching user profile for clientUserCode: ${quoteRequestData.clientUserCode}`);
      const userRef = doc(db, 'users', quoteRequestData.clientUserCode);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userEmail = userData.email || '';
        userFirstName = userData.firstName || '';
        console.log(`Retrieved user info - Email: ${userEmail}, FirstName: ${userFirstName}`);
      } else {
        console.warn(`User profile not found for userCode: ${quoteRequestData.clientUserCode}`);
      }
    } catch (userFetchError) {
      console.error('Error fetching user profile:', userFetchError);
      // Continue with submission even if user fetch fails
    }

    await updateDoc(requestRef, {
      status: 'submitted' as FlightStatus,
      updatedAt: Timestamp.now(),
    });
    console.log(`Quote request ${id} status updated to submitted`);

    // Send operator notifications
    try {
      console.log('Sending operator notifications for new quote request...');
      await sendOperatorQuoteNotifications(quoteRequestData);
      console.log('Operator notifications sent successfully');
    } catch (notificationError) {
      console.warn('Failed to send operator notifications:', notificationError);
      // Don't fail the entire submission if notifications fail
    }

    // Send quote confirmation email to passenger
    try {
      console.log('Sending quote confirmation email to passenger...');
      if (userEmail && userFirstName) {
        await sendQuoteConfirmationEmail(
          quoteRequestData,
          userEmail,
          userFirstName
        );
        console.log('Quote confirmation email sent successfully');
      } else {
        console.warn('Cannot send quote confirmation email - missing user email or firstName');
      }
    } catch (confirmationError) {
      console.warn('Failed to send quote confirmation email:', confirmationError);
      // Don't fail the entire submission if confirmation email fails
    }
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
 * Fetches quote requests for a given operator with comprehensive visibility logic
 *
 * VISIBILITY RULES:
 * 1. All operators can see open requests (submitted, under-operator-review, under-offer)
 * 2. Operators can see requests they've offered on (permanently, regardless of status)
 * 3. Operators can see requests they've won (accepted status with their userCode)
 * 4. Operators can see non-involved requests for 90 days (for reference)
 * 5. Requests expire after flight date passes (but remain visible to involved operators)
 *
 * @param operatorUserCode The operator's user code
 */
export const getOperatorQuoteRequests = async (
  operatorUserCode: string
): Promise<QuoteRequest[]> => {
  try {
    console.log(
      `Fetching quote requests for operator: ${operatorUserCode} with comprehensive visibility rules.`
    );

    // Status categories for different visibility rules
    const openStatuses = ['submitted', 'quote-received', 'quotes-viewed'];
    const activeStatuses = [...openStatuses, 'accepted', 'rejected', 'expired'];

    let combinedRequests: QuoteRequest[] = [];

    try {
      // Query 1: All open requests (any operator can see and potentially offer)
      const openQuery = query(
        collection(db, 'quoteRequests'),
        where('status', 'in', openStatuses),
        orderBy('createdAt', 'desc')
      );

      // Query 2: Requests where this operator has submitted quotes (permanent visibility)
      const offeredQuery = query(
        collection(db, 'quoteRequests'),
        where('operatorUserCodesWhoHaveQuoted', 'array-contains', operatorUserCode)
      );

      // Query 3: Requests won by this operator (permanent visibility)
      const wonQuery = query(
        collection(db, 'quoteRequests'),
        where('acceptedOperatorUserCode', '==', operatorUserCode)
      );

      // Execute all queries in parallel
      const [openSnap, offeredSnap, wonSnap] = await Promise.all([
        getDocs(openQuery),
        getDocs(offeredQuery),
        getDocs(wonQuery),
      ]);

      // Combine all results and deduplicate
      const allDocs = [...openSnap.docs, ...offeredSnap.docs, ...wonSnap.docs];
      const uniqueMap: Record<string, any> = {};

      allDocs.forEach((doc) => {
        uniqueMap[doc.id] = doc;
      });

      combinedRequests = Object.values(uniqueMap).map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuoteRequest[];

      // Additional filtering and logic
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      combinedRequests = combinedRequests.filter((request) => {
        const requestDate = request.createdAt?.toDate() || new Date(0);
        const flightDate = request.routing?.departureDate?.toDate() || new Date(0);

        // Check if operator is involved (has offered or won)
        const hasOffered =
          request.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) || false;
        const hasWon = request.acceptedOperatorUserCode === operatorUserCode;
        const isInvolved = hasOffered || hasWon;

        // Visibility rules:

        // 1. Always show if operator is involved (offered or won)
        if (isInvolved) {
          return true;
        }

        // 2. Show open requests (any operator can see and offer)
        if (openStatuses.includes(request.status)) {
          return true;
        }

        // 3. Show non-involved requests for 90 days (for reference/tracking)
        if (requestDate >= ninetyDaysAgo) {
          return true;
        }

        // 4. Hide everything else (old requests not involved in)
        return false;
      });

      // Sort by priority: involved requests first, then by date
      combinedRequests.sort((a, b) => {
        const aInvolved =
          a.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) ||
          a.acceptedOperatorUserCode === operatorUserCode
            ? 1
            : 0;
        const bInvolved =
          b.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) ||
          b.acceptedOperatorUserCode === operatorUserCode
            ? 1
            : 0;

        // First sort by involvement (involved requests first)
        if (aInvolved !== bInvolved) {
          return bInvolved - aInvolved;
        }

        // Then sort by creation date (newest first)
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(
        `Found ${combinedRequests.length} quote requests for operator ${operatorUserCode} with comprehensive visibility.`
      );
      return combinedRequests;
    } catch (indexError: any) {
      // Handle Firebase index errors gracefully
      if (
        indexError.message?.includes('The query requires an index') ||
        indexError.toString().includes('FirebaseError: The query requires an index')
      ) {
        console.warn(
          'Firebase index error detected for operator requests:',
          indexError.message || indexError.toString()
        );
        const indexUrlMatch = indexError.message?.match(
          /(https:\/\/console\.firebase\.google\.com\/[^\s]+)/
        );
        const indexUrl = indexUrlMatch ? indexUrlMatch[1] : null;
        const enhancedError = new Error('Firebase index being created for operator quote requests');
        (enhancedError as any).isIndexError = true;
        (enhancedError as any).indexUrl = indexUrl;
        throw enhancedError;
      }
      throw indexError;
    }
  } catch (error: any) {
    console.error(`Error fetching operator quote requests for ${operatorUserCode}:`, error);
    if ((error as any).isIndexError) {
      throw error;
    }
    throw new Error('Failed to fetch operator quote requests');
  }
};

/**
 * Enhanced fallback method with the same comprehensive visibility logic
 */
export const getOperatorQuoteRequestsFallback = async (
  operatorUserCode: string
): Promise<QuoteRequest[]> => {
  try {
    console.log(`Using fallback method to fetch quote requests for operator: ${operatorUserCode}`);

    // Simpler queries for fallback
    const openStatuses = ['submitted', 'quote-received', 'quotes-viewed'];

    // Query all relevant requests without complex ordering
    const [openQ, offeredQ, wonQ] = [
      query(collection(db, 'quoteRequests'), where('status', 'in', openStatuses)),
      query(
        collection(db, 'quoteRequests'),
        where('operatorUserCodesWhoHaveQuoted', 'array-contains', operatorUserCode)
      ),
      query(
        collection(db, 'quoteRequests'),
        where('acceptedOperatorUserCode', '==', operatorUserCode)
      ),
    ];

    const [openSnap, offeredSnap, wonSnap] = await Promise.all([
      getDocs(openQ),
      getDocs(offeredQ),
      getDocs(wonQ),
    ]);

    // Combine and deduplicate
    const allDocs = [...openSnap.docs, ...offeredSnap.docs, ...wonSnap.docs];
    const uniqueMap: Record<string, any> = {};
    allDocs.forEach((doc) => {
      uniqueMap[doc.id] = doc;
    });

    const results = Object.values(uniqueMap).map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as QuoteRequest[];

    // Apply the same filtering logic as main method
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const filteredResults = results.filter((request) => {
      const requestDate = request.createdAt?.toDate() || new Date(0);
      const hasOffered =
        request.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) || false;
      const hasWon = request.acceptedOperatorUserCode === operatorUserCode;
      const isInvolved = hasOffered || hasWon;

      if (isInvolved) return true;
      if (openStatuses.includes(request.status)) return true;
      if (requestDate >= ninetyDaysAgo) return true;
      return false;
    });

    // Client-side sort since fallback doesn't use complex ordering
    filteredResults.sort((a, b) => {
      const aInvolved =
        a.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) ||
        a.acceptedOperatorUserCode === operatorUserCode
          ? 1
          : 0;
      const bInvolved =
        b.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) ||
        b.acceptedOperatorUserCode === operatorUserCode
          ? 1
          : 0;

      if (aInvolved !== bInvolved) {
        return bInvolved - aInvolved;
      }

      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(
      `Fallback method found ${filteredResults.length} quote requests for operator ${operatorUserCode}`
    );
    return filteredResults;
  } catch (error) {
    console.error(`Error in fallback query for operator ${operatorUserCode}:`, error);
    return [];
  }
};

export const markQuoteRequestAsViewed = async (requestId: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'quoteRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Quote request not found');
    }

    const requestData = requestSnap.data() as QuoteRequest;

    // Only update status if it's still in 'submitted' status
    if (requestData.status === 'submitted') {
      await updateDoc(requestRef, {
        status: 'quotes-viewed' as FlightStatus,
        updatedAt: Timestamp.now(),
      });
      console.log(`Quote request ${requestId} marked as quotes viewed`);
    }
  } catch (error) {
    console.error('Error marking quote request as viewed:', error);
    throw new Error('Failed to mark quote request as viewed');
  }
};

/**
 * Expires quote requests that have passed their flight date without being accepted
 * This should be run periodically (e.g., daily via a cron job or cloud function)
 */
export const expireOldQuoteRequests = async (): Promise<void> => {
  try {
    console.log('Starting quote request expiry process...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query for requests that haven't been accepted and have flight dates in the past
    const expirableStatuses = [
      'submitted',
      'quote-received',
      'quotes-viewed',
    ];

    const expiredQuery = query(
      collection(db, 'quoteRequests'),
      where('status', 'in', expirableStatuses),
      where('routing.departureDate', '<=', Timestamp.fromDate(yesterday))
    );

    const expiredSnapshot = await getDocs(expiredQuery);
    const expiredRequests = expiredSnapshot.docs;

    console.log(`Found ${expiredRequests.length} quote requests to expire`);

    // Update expired requests
    const updatePromises = expiredRequests.map(async (doc) => {
      const requestData = doc.data() as QuoteRequest;

      // Only expire if not already accepted/booked
      if (!['accepted', 'booked', 'cancelled', 'expired'].includes(requestData.status)) {
        await updateDoc(doc.ref, {
          status: 'expired' as FlightStatus,
          expiredAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        console.log(`Expired quote request ${doc.id} (${requestData.requestCode})`);
      }
    });

    await Promise.all(updatePromises);
    console.log('Quote request expiry process completed');
  } catch (error) {
    console.error('Error expiring old quote requests:', error);
    throw new Error('Failed to expire old quote requests');
  }
};

/**
 * Archives old completed/cancelled/expired requests to reduce query load
 * Moves old non-active requests to an archived collection
 */
export const archiveOldQuoteRequests = async (olderThanDays: number = 365): Promise<void> => {
  try {
    console.log(`Starting quote request archival process (older than ${olderThanDays} days)...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Query for old completed/cancelled/expired requests
    const archivableStatuses = ['expired', 'cancelled', 'completed'];

    const archiveQuery = query(
      collection(db, 'quoteRequests'),
      where('status', 'in', archivableStatuses),
      where('createdAt', '<=', Timestamp.fromDate(cutoffDate))
    );

    const archiveSnapshot = await getDocs(archiveQuery);
    const requestsToArchive = archiveSnapshot.docs;

    console.log(`Found ${requestsToArchive.length} quote requests to archive`);

    // Archive requests (copy to archived collection and delete from main)
    const archivePromises = requestsToArchive.map(async (doc) => {
      // Copy to archived collection
      const archivedRef = doc(db, 'archivedQuoteRequests', doc.id);
      await setDoc(archivedRef, {
        ...doc.data(),
        archivedAt: Timestamp.now(),
      });

      // Delete from main collection
      await deleteDoc(doc.ref);

      console.log(`Archived quote request ${doc.id}`);
    });

    await Promise.all(archivePromises);
    console.log('Quote request archival process completed');
  } catch (error) {
    console.error('Error archiving old quote requests:', error);
    throw new Error('Failed to archive old quote requests');
  }
};

/**
 * Gets comprehensive quote request statistics for an operator
 */
export const getOperatorQuoteRequestStats = async (operatorUserCode: string) => {
  try {
    const requests = await getOperatorQuoteRequests(operatorUserCode);

    const stats = {
      total: requests.length,
      byStatus: {} as Record<string, number>,
      involved: 0,
      won: 0,
      offered: 0,
      newOpportunities: 0,
      recentActivity: 0, // Last 7 days
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    requests.forEach((request) => {
      // Count by status
      stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1;

      // Check involvement
      const hasOffered =
        request.operatorUserCodesWhoHaveQuoted?.includes(operatorUserCode) || false;
      const hasWon = request.acceptedOperatorUserCode === operatorUserCode;

      if (hasOffered || hasWon) {
        stats.involved++;
      }

      if (hasWon) {
        stats.won++;
      }

      if (hasOffered) {
        stats.offered++;
      }

      // New opportunities (can still submit offers)
      if (
        ['submitted', 'quote-received', 'quotes-viewed'].includes(request.status) &&
        !hasOffered
      ) {
        stats.newOpportunities++;
      }

      // Recent activity
      const requestDate = request.createdAt?.toDate() || new Date(0);
      if (requestDate >= sevenDaysAgo) {
        stats.recentActivity++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting operator quote request stats:', error);
    throw new Error('Failed to get operator stats');
  }
};

/**
 * ADMIN UTILITY: Fixes data inconsistencies in quote requests
 * This should be run manually by admins to clean up any data corruption
 */
export const fixQuoteRequestDataConsistency = async (): Promise<void> => {
  try {
    console.log('Starting quote request data consistency fix...');

    // Get all quote requests
    const allRequestsQuery = query(collection(db, 'quoteRequests'));
    const allRequestsSnapshot = await getDocs(allRequestsQuery);

    let fixedCount = 0;
    const fixPromises = allRequestsSnapshot.docs.map(async (doc) => {
      const data = doc.data() as QuoteRequest;
      let needsUpdate = false;
      const updates: any = {};

      // Initialize operatorUserCodesWhoHaveQuoted if missing
      if (!data.operatorUserCodesWhoHaveQuoted) {
        updates.operatorUserCodesWhoHaveQuoted = [];
        needsUpdate = true;
      }

      // Extract operator codes from offers array and ensure consistency
      if (data.offers && data.offers.length > 0) {
        const operatorCodesFromOffers = [
          ...new Set(data.offers.map((offer) => offer.operatorUserCode)),
        ];
        const existingCodes = data.operatorUserCodesWhoHaveQuoted || [];

        // Check if all operator codes from offers are in the tracking array
        const missingCodes = operatorCodesFromOffers.filter(
          (code) => !existingCodes.includes(code)
        );

        if (missingCodes.length > 0) {
          updates.operatorUserCodesWhoHaveQuoted = [...existingCodes, ...missingCodes];
          needsUpdate = true;
          console.log(
            `Fixed missing operator codes for request ${doc.id}: ${missingCodes.join(', ')}`
          );
        }
      }

      // Ensure status consistency
      if (data.offers && data.offers.length > 0 && data.status === 'submitted') {
        updates.status = 'quote-received';
        needsUpdate = true;
        console.log(`Fixed status for request ${doc.id}: submitted -> quote-received`);
      }

      // Update if needed
      if (needsUpdate) {
        await updateDoc(doc.ref, {
          ...updates,
          updatedAt: Timestamp.now(),
        });
        fixedCount++;
      }
    });

    await Promise.all(fixPromises);
    console.log(`Quote request data consistency fix completed. Fixed ${fixedCount} requests.`);
  } catch (error) {
    console.error('Error fixing quote request data consistency:', error);
    throw new Error('Failed to fix quote request data consistency');
  }
};

/**
 * ADMIN UTILITY: Validates quote request data integrity
 * Returns a report of any inconsistencies found
 */
export const validateQuoteRequestDataIntegrity = async () => {
  try {
    console.log('Starting quote request data integrity validation...');

    const allRequestsQuery = query(collection(db, 'quoteRequests'));
    const allRequestsSnapshot = await getDocs(allRequestsQuery);

    const issues = {
      missingOperatorCodes: [] as string[],
      statusInconsistencies: [] as string[],
      orphanedOffers: [] as string[],
      duplicateOperatorCodes: [] as string[],
    };

    allRequestsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as QuoteRequest;
      const requestId = doc.id;

      // Check for missing operatorUserCodesWhoHaveQuoted
      if (data.offers && data.offers.length > 0 && !data.operatorUserCodesWhoHaveQuoted) {
        issues.missingOperatorCodes.push(requestId);
      }

      // Check for status inconsistencies
      if (data.offers && data.offers.length > 0 && data.status === 'submitted') {
        issues.statusInconsistencies.push(requestId);
      }

      // Check for operator codes not matching offers
      if (data.offers && data.operatorUserCodesWhoHaveQuoted) {
        const operatorCodesFromOffers = [
          ...new Set(data.offers.map((offer) => offer.operatorUserCode)),
        ];
        const missingInTracking = operatorCodesFromOffers.filter(
          (code) => !data.operatorUserCodesWhoHaveQuoted.includes(code)
        );

        if (missingInTracking.length > 0) {
          issues.orphanedOffers.push(requestId);
        }
      }

      // Check for duplicate operator codes
      if (data.operatorUserCodesWhoHaveQuoted) {
        const uniqueCodes = [...new Set(data.operatorUserCodesWhoHaveQuoted)];
        if (uniqueCodes.length !== data.operatorUserCodesWhoHaveQuoted.length) {
          issues.duplicateOperatorCodes.push(requestId);
        }
      }
    });

    console.log('Data integrity validation completed:', issues);
    return issues;
  } catch (error) {
    console.error('Error validating quote request data integrity:', error);
    throw new Error('Failed to validate quote request data integrity');
  }
};
