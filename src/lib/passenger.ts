import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { Passenger, PassengerFormData } from '@/types/passenger';
import { generatePassengerId } from '@/lib/serials';
import { getBookingById } from '@/lib/booking';

/**
 * Create a new passenger record for a booking
 */
export const createPassenger = async (
  bookingId: string,
  userCode: string,
  data: PassengerFormData
): Promise<string> => {
  try {
    // First ensure the booking exists
    const booking = await getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const passengerId = generatePassengerId(userCode);
    const passengerData: Omit<Passenger, 'id'> = {
      passengerId,
      bookingId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: Timestamp.fromDate(data.dateOfBirth),
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      passportExpiry: Timestamp.fromDate(data.passportExpiry),
      specialRequirements: data.specialRequirements,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'passengers'), passengerData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating passenger:', error);
    throw new Error('Failed to create passenger record');
  }
};

/**
 * Update an existing passenger record
 */
export const updatePassenger = async (
  passengerId: string,
  data: Partial<PassengerFormData>
): Promise<void> => {
  try {
    const passengerRef = doc(db, 'passengers', passengerId);
    const passengerSnap = await getDoc(passengerRef);

    if (!passengerSnap.exists()) {
      throw new Error('Passenger record not found');
    }

    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    };

    // Only update fields that are provided
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.dateOfBirth) updateData.dateOfBirth = Timestamp.fromDate(data.dateOfBirth);
    if (data.nationality) updateData.nationality = data.nationality;
    if (data.passportNumber) updateData.passportNumber = data.passportNumber;
    if (data.passportExpiry) updateData.passportExpiry = Timestamp.fromDate(data.passportExpiry);
    if (data.specialRequirements !== undefined)
      updateData.specialRequirements = data.specialRequirements;
    if (data.contactEmail) updateData.contactEmail = data.contactEmail;
    if (data.contactPhone) updateData.contactPhone = data.contactPhone;
    if (data.emergencyContactName !== undefined)
      updateData.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined)
      updateData.emergencyContactPhone = data.emergencyContactPhone;

    await updateDoc(passengerRef, updateData);
  } catch (error) {
    console.error('Error updating passenger:', error);
    throw new Error('Failed to update passenger record');
  }
};

/**
 * Get a single passenger by ID
 */
export const getPassengerById = async (passengerId: string): Promise<Passenger | null> => {
  try {
    const passengerRef = doc(db, 'passengers', passengerId);
    const passengerSnap = await getDoc(passengerRef);

    if (!passengerSnap.exists()) {
      return null;
    }

    return { id: passengerSnap.id, ...passengerSnap.data() } as Passenger;
  } catch (error) {
    console.error('Error fetching passenger:', error);
    throw new Error('Failed to fetch passenger');
  }
};

/**
 * Get all passengers for a booking
 */
export const getPassengersForBooking = async (bookingId: string): Promise<Passenger[]> => {
  try {
    const passengersQuery = query(
      collection(db, 'passengers'),
      where('bookingId', '==', bookingId),
      orderBy('lastName', 'asc')
    );

    const snapshot = await getDocs(passengersQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Passenger);
  } catch (error) {
    console.error('Error fetching passengers for booking:', error);
    throw new Error('Failed to fetch passengers');
  }
};

/**
 * Delete a passenger record
 */
export const deletePassenger = async (passengerId: string): Promise<void> => {
  try {
    const passengerRef = doc(db, 'passengers', passengerId);
    await deleteDoc(passengerRef);
  } catch (error) {
    console.error('Error deleting passenger:', error);
    throw new Error('Failed to delete passenger');
  }
};
