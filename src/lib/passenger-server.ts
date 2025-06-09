import { getAdminDb } from '@/lib/firebase-admin';
import { generatePassengerId } from '@/lib/serials';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { Passenger, PassengerFormData } from '@/types/passenger';

/**
 * Create a new passenger record for a booking (server-side)
 */
export const createPassengerServer = async (
  bookingId: string,
  userCode: string,
  data: PassengerFormData
): Promise<string> => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error('Firebase Admin Database not available');
  }

  // Verify booking exists (admin read bypasses security rules)
  const bookingRef = adminDb.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) {
    throw new Error(`Booking not found: ${bookingId}`);
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

  // Add passenger using Admin SDK
  const docRef = await adminDb.collection('passengers').add(passengerData);
  // Also embed passenger in the parent booking document
  // This keeps a copy of the passenger within the booking manifest
  await bookingRef.update({
    passengers: FieldValue.arrayUnion(passengerData),
  });
  return docRef.id;
};
