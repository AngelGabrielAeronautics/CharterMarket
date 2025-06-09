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
} from 'firebase/firestore';
import { Invoice, LegacyInvoice, InvoiceStatus } from '@/types/invoice';

/**
 * Migration utility to upgrade legacy invoices to comprehensive invoice structure
 *
 * USAGE INSTRUCTIONS:
 *
 * 1. EXISTING INVOICES: Will continue to work with backward compatibility
 * 2. NEW INVOICES: Use createComprehensiveInvoice() instead of createInvoice()
 * 3. MIGRATION: Run migrateInvoiceToComprehensive() for individual invoices
 * 4. BULK MIGRATION: Run migrateLegacyInvoices() to upgrade all old invoices
 *
 * KEY CHANGES:
 * - Added operatorUserCode field
 * - New status system (open, balance-due, paid)
 * - Payment tracking with amounts and payment history
 * - New shorter invoice ID format: INV-{offerId}-{4 random alphanumeric}
 * - Currency field and payment references
 */

/**
 * Check if an invoice is using the legacy structure
 */
export function isLegacyInvoice(invoice: any): invoice is LegacyInvoice {
  return (
    !('operatorUserCode' in invoice) ||
    !('status' in invoice) ||
    !('amountPaid' in invoice) ||
    !('payments' in invoice) ||
    !('currency' in invoice)
  );
}

/**
 * Map legacy invoice to new status system
 */
function getDefaultInvoiceStatus(): InvoiceStatus {
  return 'open'; // Default status for legacy invoices
}

/**
 * Fetch operator details for invoice migration
 */
async function fetchOperatorForInvoice(invoiceId: string, bookingId: string): Promise<string> {
  try {
    // Try to get operator from the booking
    if (bookingId) {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        // Check both old and new booking structures
        if (bookingData.operator?.operatorUserCode) {
          return bookingData.operator.operatorUserCode;
        } else if (bookingData.operatorUserCode) {
          return bookingData.operatorUserCode;
        }
      }
    }

    // Fallback: return a placeholder
    return 'LEGACY-UNKNOWN';
  } catch (error) {
    console.error('Error fetching operator for invoice migration:', error);
    return 'LEGACY-UNKNOWN';
  }
}

/**
 * Migrate a single legacy invoice to comprehensive structure
 */
export async function migrateInvoiceToComprehensive(invoiceId: string): Promise<void> {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const legacyInvoice = invoiceSnap.data() as LegacyInvoice;

    // Skip if already migrated
    if (!isLegacyInvoice(legacyInvoice)) {
      console.log(`Invoice ${invoiceId} already migrated`);
      return;
    }

    console.log(`Migrating invoice ${invoiceId} to comprehensive structure...`);

    // Fetch operator details
    const operatorUserCode = await fetchOperatorForInvoice(invoiceId, legacyInvoice.bookingId);

    // Create comprehensive invoice data
    const comprehensiveData: Partial<Invoice> = {
      // Add new required fields
      operatorUserCode,
      currency: 'USD',
      status: 'open' as InvoiceStatus,
      amountPaid: 0, // Assume unpaid for legacy invoices
      amountPending: legacyInvoice.amount,
      payments: [],

      // Add optional fields with defaults
      description: `Legacy flight service for booking ${legacyInvoice.bookingId}`,

      // Update timestamp
      updatedAt: Timestamp.now(),
    };

    // Remove undefined fields and update
    const cleanData = Object.fromEntries(
      Object.entries(comprehensiveData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(invoiceRef, cleanData);
    console.log(`Successfully migrated invoice ${invoiceId}`);
  } catch (error) {
    console.error(`Error migrating invoice ${invoiceId}:`, error);
    throw new Error(`Failed to migrate invoice ${invoiceId}: ${error}`);
  }
}

/**
 * Migrate all legacy invoices to comprehensive structure
 * USE WITH CAUTION - Run in batches for large datasets
 */
export async function migrateLegacyInvoices(batchSize: number = 10): Promise<void> {
  try {
    console.log('Starting bulk migration of legacy invoices...');

    // Get all invoices (we'll filter legacy ones in the loop)
    const snapshot = await getDocs(collection(db, 'invoices'));
    console.log(`Found ${snapshot.size} total invoices`);

    let migrated = 0;
    let errors = 0;
    let skipped = 0;

    // Process in batches
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = snapshot.docs.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (docSnap) => {
          try {
            const invoice = docSnap.data();
            if (isLegacyInvoice(invoice)) {
              await migrateInvoiceToComprehensive(docSnap.id);
              migrated++;
            } else {
              skipped++;
            }
          } catch (error) {
            console.error(`Error migrating invoice ${docSnap.id}:`, error);
            errors++;
          }
        })
      );

      console.log(
        `Processed batch ${Math.floor(i / batchSize) + 1}, migrated: ${migrated}, skipped: ${skipped}, errors: ${errors}`
      );

      // Add delay between batches to avoid overwhelming Firestore
      if (i + batchSize < snapshot.docs.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `Invoice migration completed. Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`
    );
  } catch (error) {
    console.error('Error during bulk invoice migration:', error);
    throw new Error(`Bulk invoice migration failed: ${error}`);
  }
}

/**
 * Get invoice migration status report
 */
export async function getInvoiceMigrationReport(): Promise<{
  total: number;
  legacy: number;
  comprehensive: number;
  migrationProgress: number;
}> {
  try {
    const snapshot = await getDocs(collection(db, 'invoices'));

    let legacyCount = 0;
    let comprehensiveCount = 0;

    snapshot.docs.forEach((doc) => {
      const invoice = doc.data();
      if (isLegacyInvoice(invoice)) {
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
    console.error('Error generating invoice migration report:', error);
    throw new Error('Failed to generate invoice migration report');
  }
}
