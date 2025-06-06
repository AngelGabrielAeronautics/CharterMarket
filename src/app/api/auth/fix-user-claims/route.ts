import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

export async function POST(req: NextRequest) {
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
    const adminDb = getAdminDb();

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin Auth not available' }, { status: 500 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin Database not available' }, { status: 500 });
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found in token' }, { status: 400 });
    }

    // Find user in Firestore by email
    const usersQuery = await adminDb
      .collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      return NextResponse.json({ error: 'User not found in Firestore' }, { status: 404 });
    }

    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    const userCode = userData.userCode;
    const role = userData.role;

    if (!userCode || !role) {
      return NextResponse.json(
        { error: 'User missing required fields (userCode or role)' },
        { status: 400 }
      );
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(userId, {
      role: role,
      userCode: userCode,
    });

    console.log(`Fixed custom claims for user ${userCode}: role=${role}, userCode=${userCode}`);

    return NextResponse.json({
      success: true,
      message: 'Custom claims updated successfully',
      userCode: userCode,
      role: role,
    });
  } catch (error: any) {
    console.error('Error fixing user claims:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix user claims',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
