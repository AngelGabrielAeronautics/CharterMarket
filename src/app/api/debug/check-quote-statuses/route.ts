import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    console.log('Checking quote request statuses...');

    // Get recent quote requests
    const quoteRequestsQuery = query(
      collection(db, 'quoteRequests'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(quoteRequestsQuery);
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No quote requests found',
        data: []
      });
    }

    const statusSummary: Record<string, number> = {};
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      const status = data.status || 'no-status';
      
      // Count status occurrences
      statusSummary[status] = (statusSummary[status] || 0) + 1;
      
      return {
        id: doc.id,
        requestCode: data.requestCode,
        status: data.status,
        offersCount: data.offers?.length || 0,
        operatorCodes: data.operatorUserCodesWhoHaveQuoted || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || 'no-date'
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRequests: requests.length,
        statusBreakdown: statusSummary
      },
      recentRequests: requests
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