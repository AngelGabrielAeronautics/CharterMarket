import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

// Mapping from old statuses to new statuses
const STATUS_MIGRATION_MAP: Record<string, string> = {
  // Legacy statuses -> new statuses
  'pending': 'submitted',
  'draft': 'submitted',
  'under-operator-review': 'quote-received',
  'under-offer': 'quote-received',
  'quoted': 'quote-received',
  'booked': 'accepted',
  'cancelled': 'rejected',
  // Current statuses that stay the same
  'submitted': 'submitted',
  'quote-received': 'quote-received',
  'quotes-viewed': 'quotes-viewed',
  'accepted': 'accepted',
  'rejected': 'rejected',
  'expired': 'expired'
};

export async function POST(req: NextRequest) {
  try {
    console.log('Starting quote request status migration...');

    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token and check permissions
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.role || !['admin', 'superAdmin'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all quote requests
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    const quoteRequestsSnapshot = await adminDb.collection('quoteRequests').get();
    
    if (quoteRequestsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No quote requests found to migrate',
        migrated: 0,
        skipped: 0
      });
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const migrations: Array<{
      id: string;
      oldStatus: string;
      newStatus: string;
    }> = [];

    // Process in batches to avoid overwhelming Firestore
    const batch = adminDb.batch();
    let batchCount = 0;
    const BATCH_SIZE = 100;

    for (const doc of quoteRequestsSnapshot.docs) {
      try {
        const data = doc.data();
        const currentStatus = data.status;

        if (!currentStatus) {
          console.warn(`Quote request ${doc.id} has no status, skipping`);
          skipped++;
          continue;
        }

        const newStatus = STATUS_MIGRATION_MAP[currentStatus];

        if (!newStatus) {
          console.warn(`Unknown status "${currentStatus}" for quote request ${doc.id}, skipping`);
          skipped++;
          continue;
        }

        if (currentStatus === newStatus) {
          // Status is already correct
          skipped++;
          continue;
        }

        // Update the status
        batch.update(doc.ref, { 
          status: newStatus,
          statusMigratedAt: new Date(),
          statusMigratedFrom: currentStatus
        });

        migrations.push({
          id: doc.id,
          oldStatus: currentStatus,
          newStatus: newStatus
        });

        migrated++;
        batchCount++;

        // Commit batch if it reaches size limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }

      } catch (error) {
        console.error(`Error processing quote request ${doc.id}:`, error);
        errors++;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log(`Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Quote request status migration completed successfully`,
      summary: {
        totalProcessed: quoteRequestsSnapshot.size,
        migrated,
        skipped,
        errors
      },
      migrations: migrations.slice(0, 20), // Return first 20 migrations as examples
      statusMappings: STATUS_MIGRATION_MAP
    });

  } catch (error: any) {
    console.error('Error during quote request status migration:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 