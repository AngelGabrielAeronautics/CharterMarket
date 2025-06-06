import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId') || 'BK-OP-FLYW-FNLU-20250605-BIFO';
    const clientId = url.searchParams.get('clientId') || 'PA-PAX-XSOX';

    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin Auth not available' }, { status: 500 });
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);

    const testResults: any = {
      userInfo: {
        userCode: decodedToken.userCode,
        role: decodedToken.role,
        email: decodedToken.email,
      },
      tests: {},
    };

    // Test 1: Direct booking access (what the booking detail page does)
    try {
      console.log('Testing direct booking access...');
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);

      testResults.tests.directBookingAccess = {
        success: true,
        bookingExists: bookingSnap.exists(),
        data: bookingSnap.exists()
          ? {
              id: bookingSnap.id,
              clientId: bookingSnap.data()?.clientId,
              operatorId: bookingSnap.data()?.operatorId,
              bookingId: bookingSnap.data()?.bookingId,
            }
          : null,
      };
    } catch (error) {
      testResults.tests.directBookingAccess = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
      };
    }

    // Test 2: Client bookings query (what the bookings list does)
    try {
      console.log('Testing client bookings query...');
      const bookingsQuery = query(collection(db, 'bookings'), where('clientId', '==', clientId));
      const snapshot = await getDocs(bookingsQuery);

      testResults.tests.clientBookingsQuery = {
        success: true,
        bookingsFound: snapshot.docs.length,
        bookingIds: snapshot.docs.map((doc) => doc.id),
      };
    } catch (error) {
      testResults.tests.clientBookingsQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
      };
    }

    // Test 3: Invoice access (what the invoice tab does)
    try {
      console.log('Testing invoice query...');
      const invoicesQuery = query(collection(db, 'invoices'), where('bookingId', '==', bookingId));
      const invoiceSnapshot = await getDocs(invoicesQuery);

      testResults.tests.invoiceQuery = {
        success: true,
        invoicesFound: invoiceSnapshot.docs.length,
        invoiceIds: invoiceSnapshot.docs.map((doc) => doc.id),
      };
    } catch (error) {
      testResults.tests.invoiceQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
      };
    }

    // Test 4: Check what the actual rules see
    testResults.rulesDebugInfo = {
      note: "If any test fails with 'permission-denied', the Firestore rules are blocking access",
      expectedBehavior: {
        directBookingAccess: 'Should work if clientId matches userCode or user is admin',
        clientBookingsQuery: "Should work if querying for user's own clientId",
        invoiceQuery: 'Should work if user has access to the booking',
      },
      troubleshooting: {
        permissionDenied: 'Rules are blocking - check field names and logic',
        indexRequired: 'Need to create composite index',
        networkError: 'Firebase connection issue',
      },
    };

    return NextResponse.json({
      testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in rules test endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to test Firestore rules',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
