import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, limit } from 'firebase/firestore';

// Status migration mapping
const STATUS_MIGRATION_MAP: Record<string, string> = {
  'pending': 'submitted',
  'draft': 'submitted',
  'under-operator-review': 'quote-received',
  'under-offer': 'quote-received',
  'quoted': 'quote-received',
  'booked': 'accepted',
  'cancelled': 'rejected',
  // Valid statuses stay the same
  'submitted': 'submitted',
  'quote-received': 'quote-received',
  'quotes-viewed': 'quotes-viewed',
  'accepted': 'accepted',
  'rejected': 'rejected',
  'expired': 'expired'
};

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking quote request statuses...');

    // Get quote requests
    const quoteRequestsQuery = query(collection(db, 'quoteRequests'), limit(20));
    const snapshot = await getDocs(quoteRequestsQuery);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No quote requests found',
        data: []
      });
    }

    // Check statuses
    const statusCounts: Record<string, number> = {};
    const allRequests: Array<{
      id: string;
      requestCode: string;
      status: string;
      offersCount: number;
      needsFix: boolean;
      suggestedStatus?: string;
    }> = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentStatus = data.status || 'no-status';
      
      statusCounts[currentStatus] = (statusCounts[currentStatus] || 0) + 1;

      const suggestedStatus = STATUS_MIGRATION_MAP[currentStatus];
      const needsFix = suggestedStatus && suggestedStatus !== currentStatus;

      allRequests.push({
        id: doc.id,
        requestCode: data.requestCode || 'unknown',
        status: currentStatus,
        offersCount: data.offers?.length || 0,
        needsFix: Boolean(needsFix),
        suggestedStatus: needsFix ? suggestedStatus : undefined
      });
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRequests: allRequests.length,
        statusBreakdown: statusCounts,
        needingFix: allRequests.filter(r => r.needsFix).length
      },
      requests: allRequests,
      migrationMap: STATUS_MIGRATION_MAP
    });

  } catch (error: any) {
    console.error('Error checking quote statuses:', error);
    return NextResponse.json(
      {
        error: 'Failed to check quote statuses',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Fixing quote request statuses...');

    // Get quote requests that need fixing
    const quoteRequestsQuery = query(collection(db, 'quoteRequests'), limit(50));
    const snapshot = await getDocs(quoteRequestsQuery);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No quote requests found to fix',
        fixed: 0
      });
    }

    const toFix: Array<{ id: string; currentStatus: string; newStatus: string }> = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentStatus = data.status || 'no-status';
      const newStatus = STATUS_MIGRATION_MAP[currentStatus];
      
      if (newStatus && newStatus !== currentStatus) {
        toFix.push({
          id: doc.id,
          currentStatus,
          newStatus
        });
      }
    });

    if (toFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No quote requests need fixing',
        fixed: 0
      });
    }

    // Fix the statuses
    let fixed = 0;
    const results: Array<{ id: string; status: string; success: boolean; error?: string }> = [];

    for (const item of toFix) {
      try {
        const docRef = doc(db, 'quoteRequests', item.id);
        await updateDoc(docRef, {
          status: item.newStatus,
          statusMigratedAt: new Date(),
          statusMigratedFrom: item.currentStatus
        });
        
        results.push({
          id: item.id,
          status: `${item.currentStatus} → ${item.newStatus}`,
          success: true
        });
        fixed++;
      } catch (error: any) {
        results.push({
          id: item.id,
          status: `${item.currentStatus} → ${item.newStatus}`,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed}/${toFix.length} quote requests`,
      fixed,
      total: toFix.length,
      results
    });

  } catch (error: any) {
    console.error('Error fixing quote statuses:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix quote statuses',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 