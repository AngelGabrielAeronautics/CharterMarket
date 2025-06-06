import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin Auth not available' }, { status: 500 });
    }

    // Verify the token to get user info
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Force revoke all refresh tokens for this user
    // This will force them to get a new token with updated rules
    await adminAuth.revokeRefreshTokens(decodedToken.uid);

    return NextResponse.json({
      success: true,
      message: 'Token refresh forced. Please reload the page and log in again.',
      uid: decodedToken.uid,
      tokensValidAfter: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error forcing token refresh:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
