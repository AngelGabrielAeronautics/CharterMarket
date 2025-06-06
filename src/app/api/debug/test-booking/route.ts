import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId') || 'BK-OP-FLYW-FNLU-20250605-BIFO';

    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin Auth not available' }, { status: 500 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin Database not available' }, { status: 500 });
    }

    // Verify the token and get user claims
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Test direct Firestore access using admin SDK
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    const bookingData = bookingSnap.exists ? bookingSnap.data() : null;

    const response = {
      testResults: {
        authentication: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          customClaims: {
            role: decodedToken.role,
            userCode: decodedToken.userCode,
          },
        },
        bookingTest: {
          bookingId: bookingId,
          documentExists: bookingSnap.exists,
          data: bookingData
            ? {
                id: bookingSnap.id,
                ...bookingData,
              }
            : null,
        },
        permissionTest: {
          userCode: decodedToken.userCode,
          userRole: decodedToken.role,
          canAccessAsClient: bookingData ? bookingData.clientId === decodedToken.userCode : false,
          canAccessAsOperator: bookingData
            ? bookingData.operatorId === decodedToken.userCode
            : false,
          canAccessAsAdmin: ['admin', 'superAdmin'].includes(decodedToken.role),
        },
        firestoreRulesNote:
          "This test bypasses Firestore rules. If this works but the booking page doesn't, the Firestore rules need to be deployed.",
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in test booking endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to test booking access',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
