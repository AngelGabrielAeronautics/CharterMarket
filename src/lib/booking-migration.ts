import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import {
  Booking,
  LegacyBooking,
  BookingStatus,
  OperatorDetails,
  AircraftDetails,
  ClientPreferences,
  PaymentSummary,
  FlightDetails,
  BookingDocuments,
} from '@/types/booking';

/**
 * Migration utility to upgrade legacy bookings to comprehensive booking structure
 *
 * USAGE INSTRUCTIONS:
 *
 * 1. EXISTING BOOKINGS: Will continue to work with backward compatibility
 * 2. NEW BOOKINGS: Use createComprehensiveBooking() instead of createBooking()
 * 3. MIGRATION: Run migrateBookingToComprehensive() for individual bookings
 * 4. BULK MIGRATION: Run migrateLegacyBookings() to upgrade all old bookings
 *
 * KEY CHANGES:
 * - requestCode removed (duplication with requestId)
 * - operatorUserCode moved to operator.operatorUserCode
 * - New status system with detailed payment tracking
 * - Comprehensive aircraft, operator, and passenger data
 * - Embedded historical data for audit trail
 * - Document linking system for invoices, contracts, etc.
 */

/**
 * Check if a booking is using the legacy structure
 */
export function isLegacyBooking(booking: any): booking is LegacyBooking {
  return (
    'requestCode' in booking ||
    'operatorUserCode' in booking ||
    !('operator' in booking) ||
    !('aircraft' in booking) ||
    !('payment' in booking)
  );
}

/**
 * Map legacy booking status to new status system
 */
function mapLegacyStatus(legacyStatus: string): BookingStatus {
  switch (legacyStatus) {
    case 'pending':
      return 'pending-payment';
    case 'confirmed':
      return 'confirmed';
    case 'completed':
      return 'archived';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending-payment';
  }
}

/**
 * Fetch operator details for migration
 */
async function fetchOperatorDetailsForMigration(
  operatorUserCode: string
): Promise<OperatorDetails> {
  try {
    if (!operatorUserCode) {
      return {
        operatorUserCode: 'unknown',
        operatorName: 'Legacy Operator',
      };
    }

    const userDoc = await getDoc(doc(db, 'users', operatorUserCode));
    if (!userDoc.exists()) {
      return {
        operatorUserCode,
        operatorName: operatorUserCode,
      };
    }

    const userData = userDoc.data();
    return {
      operatorUserCode,
      operatorName: userData.company || `${userData.firstName} ${userData.lastName}`,
      contactPerson: `${userData.firstName} ${userData.lastName}`,
      contactEmail: userData.email,
    };
  } catch (error) {
    console.error('Error fetching operator details for migration:', error);
    return {
      operatorUserCode: operatorUserCode || 'unknown',
      operatorName: 'Legacy Operator',
    };
  }
}

/**
 * Fetch request data for migration
 */
async function fetchRequestDataForMigration(requestId: string): Promise<any> {
  try {
    if (!requestId) return null;

    const requestDoc = await getDoc(doc(db, 'quoteRequests', requestId));
    return requestDoc.exists() ? requestDoc.data() : null;
  } catch (error) {
    console.error('Error fetching request data for migration:', error);
    return null;
  }
}

/**
 * Migrate a single legacy booking to comprehensive structure
 */
export async function migrateBookingToComprehensive(bookingId: string): Promise<void> {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const legacyBooking = bookingSnap.data() as LegacyBooking;

    // Skip if already migrated
    if (!isLegacyBooking(legacyBooking)) {
      console.log(`Booking ${bookingId} already migrated`);
      return;
    }

    console.log(`Migrating booking ${bookingId} to comprehensive structure...`);

    // Fetch additional data needed for comprehensive structure
    const [operatorDetails, requestData] = await Promise.all([
      fetchOperatorDetailsForMigration(legacyBooking.operatorUserCode || ''),
      fetchRequestDataForMigration(legacyBooking.requestId),
    ]);

    // Map legacy status to new status system
    const newStatus = mapLegacyStatus(legacyBooking.status);

    // Create update data (mixing type-safe updates and field deletions)
    const comprehensiveData: any = {
      // Remove deprecated fields using deleteField()
      requestCode: deleteField(),
      operatorUserCode: deleteField(),
      price: deleteField(),
      totalPrice: deleteField(),
      isPaid: deleteField(),
      operatorName: deleteField(),
      flightNumber: deleteField(),

      // Update status system
      status: newStatus,

      // Add comprehensive operator details
      operator: operatorDetails,

      // Add basic aircraft details (placeholder until real data available)
      aircraft: {
        id: 'legacy-unknown',
        registration: legacyBooking.flightNumber || 'TBD',
        make: 'TBD',
        model: 'TBD',
        maxPassengers: legacyBooking.passengerCount,
        category: 'TBD',
      },

      // Add client preferences extracted from request
      clientPreferences: {
        specialRequirements: requestData?.specialRequirements,
        twinEngineMin: requestData?.twinEngineMin,
        preferredCabinClass: legacyBooking.cabinClass,
      },

      // Initialize empty passengers array
      passengers: [],

      // Create payment summary from legacy data
      payment: {
        subtotal: legacyBooking.price || 0,
        commission: (legacyBooking.totalPrice || 0) - (legacyBooking.price || 0),
        totalAmount: legacyBooking.totalPrice || 0,
        amountPaid: legacyBooking.isPaid ? legacyBooking.totalPrice || 0 : 0,
        amountPending: legacyBooking.isPaid ? 0 : legacyBooking.totalPrice || 0,
        currency: 'USD',
      },

      // Initialize flight details
      flightDetails: {
        flightNumber: legacyBooking.flightNumber,
      },

      // Initialize documents
      documents: {} as BookingDocuments,

      // Add historical data for audit trail
      originalRequest: {
        requestCode: legacyBooking.requestCode || 'LEGACY-' + legacyBooking.requestId,
        submittedAt: requestData?.createdAt || legacyBooking.createdAt,
        specialRequirements: requestData?.specialRequirements,
        flexibleDates: requestData?.routing?.flexibleDates || false,
      },

      acceptedQuote: {
        offerId: legacyBooking.quoteId,
        submittedAt: legacyBooking.createdAt,
      },

      // Initialize checklists
      checklistsCompleted: {
        operatorChecklist: false,
        clientChecklist: false,
        documentChecklist: false,
        paymentChecklist: legacyBooking.isPaid || false,
      },

      // Update timestamp
      updatedAt: Timestamp.now(),
    };

    await updateDoc(bookingRef, comprehensiveData);
    console.log(`Successfully migrated booking ${bookingId}`);
  } catch (error) {
    console.error(`Error migrating booking ${bookingId}:`, error);
    throw new Error('Failed to migrate booking: ' + bookingId);
  }
}

/**
 * Migrate all legacy bookings to comprehensive structure
 * USE WITH CAUTION - Run in batches for large datasets
 */
export async function migrateLegacyBookings(batchSize: number = 10): Promise<void> {
  try {
    console.log('Starting bulk migration of legacy bookings...');

    // Find bookings that might be legacy (have requestCode field)
    const legacyQuery = query(collection(db, 'bookings'), where('requestCode', '!=', null));

    const snapshot = await getDocs(legacyQuery);
    console.log(`Found ${snapshot.size} potential legacy bookings`);

    let migrated = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = snapshot.docs.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (docSnap) => {
          try {
            const booking = docSnap.data();
            if (isLegacyBooking(booking)) {
              await migrateBookingToComprehensive(docSnap.id);
              migrated++;
            }
          } catch (error) {
            console.error(`Error migrating booking ${docSnap.id}:`, error);
            errors++;
          }
        })
      );

      console.log(
        `Processed batch ${Math.floor(i / batchSize) + 1}, migrated: ${migrated}, errors: ${errors}`
      );

      // Add delay between batches to avoid overwhelming Firestore
      if (i + batchSize < snapshot.docs.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Migration completed. Migrated: ${migrated}, Errors: ${errors}`);
  } catch (error) {
    console.error('Error during bulk migration:', error);
    throw new Error('Bulk migration failed');
  }
}

/**
 * Get migration status report
 */
export async function getMigrationReport(): Promise<{
  total: number;
  legacy: number;
  comprehensive: number;
  migrationProgress: number;
}> {
  try {
    const snapshot = await getDocs(collection(db, 'bookings'));

    let legacyCount = 0;
    let comprehensiveCount = 0;

    snapshot.docs.forEach((doc) => {
      const booking = doc.data();
      if (isLegacyBooking(booking)) {
        legacyCount++;
      } else {
        comprehensiveCount++;
      }
    });

    const total = snapshot.size;
    const migrationProgress = total > 0 ? (comprehensiveCount / total) * 100 : 0;

    return {
      total,
      legacy: legacyCount,
      comprehensive: comprehensiveCount,
      migrationProgress: Math.round(migrationProgress * 100) / 100,
    };
  } catch (error) {
    console.error('Error generating migration report:', error);
    throw new Error('Failed to generate migration report');
  }
}
