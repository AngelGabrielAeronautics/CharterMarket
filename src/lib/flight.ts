import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { FlightRequest, FlightRequestFormData, FlightStatus } from '@/types/flight';
import { generateFlightRequestCode } from '@/lib/serials';

export const createFlightRequest = async (
  clientId: string,
  operatorId: string,
  data: FlightRequestFormData
): Promise<string> => {
  try {
    const requestCode = await generateFlightRequestCode(operatorId);
    const expiresAt = new Timestamp(
      Timestamp.now().seconds + 24 * 60 * 60, // 24 hours from now
      0
    );

    const flightRequestData = {
      ...data,
      requestCode,
      clientId,
      status: 'draft' as FlightStatus,
      routing: {
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        departureDate: Timestamp.fromDate(data.departureDate),
        returnDate: data.returnDate ? Timestamp.fromDate(data.returnDate) : null,
        flexibleDates: data.flexibleDates,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt,
    };

    const requestRef = await addDoc(collection(db, 'flightRequests'), flightRequestData);
    return requestRef.id;
  } catch (error) {
    console.error('Error creating flight request:', error);
    throw new Error('Failed to create flight request');
  }
};

export const updateFlightRequest = async (
  id: string,
  data: Partial<FlightRequestFormData>
): Promise<void> => {
  try {
    const requestRef = doc(db, 'flightRequests', id);
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    if (data.departureDate) {
      updateData.routing = {
        departureDate: Timestamp.fromDate(data.departureDate),
      };
    }
    if (data.returnDate) {
      updateData.routing = {
        ...updateData.routing,
        returnDate: Timestamp.fromDate(data.returnDate),
      };
    }

    await updateDoc(requestRef, updateData);
  } catch (error) {
    console.error('Error updating flight request:', error);
    throw new Error('Failed to update flight request');
  }
};

export const getFlightRequest = async (id: string): Promise<FlightRequest | null> => {
  try {
    const requestRef = doc(db, 'flightRequests', id);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      return null;
    }

    return {
      id: requestDoc.id,
      ...requestDoc.data(),
    } as FlightRequest;
  } catch (error) {
    console.error('Error getting flight request:', error);
    throw new Error('Failed to get flight request');
  }
};

export const getClientFlightRequests = async (clientId: string): Promise<FlightRequest[]> => {
  try {
    const requestsQuery = query(
      collection(db, 'flightRequests'),
      where('clientId', '==', clientId)
    );
    
    const querySnapshot = await getDocs(requestsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FlightRequest[];
  } catch (error) {
    console.error('Error getting client flight requests:', error);
    throw new Error('Failed to get client flight requests');
  }
};

export const submitFlightRequest = async (id: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'flightRequests', id);
    await updateDoc(requestRef, {
      status: 'pending' as FlightStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error submitting flight request:', error);
    throw new Error('Failed to submit flight request');
  }
};

export const cancelFlightRequest = async (id: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'flightRequests', id);
    await updateDoc(requestRef, {
      status: 'cancelled' as FlightStatus,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error cancelling flight request:', error);
    throw new Error('Failed to cancel flight request');
  }
}; 