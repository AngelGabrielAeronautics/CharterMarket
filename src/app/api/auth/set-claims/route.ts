import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid, role, userCode } = await req.json();

    if (!uid || !role || !userCode) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, role, userCode' },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();

    // Set custom claims for the user
    await adminAuth.setCustomUserClaims(uid, {
      role,
      userCode,
    });

    console.log(`Custom claims set for user ${uid}: role=${role}, userCode=${userCode}`);

    return NextResponse.json({
      success: true,
      message: 'Custom claims set successfully',
    });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: 'Failed to set custom claims' }, { status: 500 });
  }
}
