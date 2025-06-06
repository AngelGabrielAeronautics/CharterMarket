import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

export async function GET(req: NextRequest) {
  try {
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

    // Verify the token and get user claims
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Get the user record to see all custom claims
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    const response = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      customClaims: userRecord.customClaims || {},
      tokenClaims: {
        role: decodedToken.role,
        userCode: decodedToken.userCode,
      },
      firebaseTokenClaims: decodedToken,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error checking user claims:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify user claims',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
