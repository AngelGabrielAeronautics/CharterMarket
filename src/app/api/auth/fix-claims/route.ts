import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { userCode } = await req.json();

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    if (userCode) {
      // Fix specific user
      return await fixUserClaims(userCode, adminAuth, adminDb);
    } else {
      // Fix all users without claims
      return await fixAllUserClaims(adminAuth, adminDb);
    }
  } catch (error: any) {
    console.error('Error fixing claims:', error);
    return NextResponse.json({ error: 'Failed to fix claims' }, { status: 500 });
  }
}

async function fixUserClaims(userCode: string, adminAuth: any, adminDb: any) {
  try {
    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(userCode).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: `User with code ${userCode} not found` }, { status: 404 });
    }

    const userData = userDoc.data();

    // Find the user in Firebase Auth by email
    try {
      const userRecord = await adminAuth.getUserByEmail(userData.email);

      // Set custom claims
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: userData.role,
        userCode: userData.userCode,
      });

      console.log(
        `Fixed claims for user ${userCode}: role=${userData.role}, userCode=${userData.userCode}`
      );

      return NextResponse.json({
        success: true,
        message: `Claims fixed for user ${userCode}`,
        fixed: 1,
      });
    } catch (authError) {
      console.error(`User ${userCode} not found in Firebase Auth:`, authError);
      return NextResponse.json(
        { error: `User ${userCode} not found in Firebase Auth` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`Error fixing claims for user ${userCode}:`, error);
    throw error;
  }
}

async function fixAllUserClaims(adminAuth: any, adminDb: any) {
  try {
    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    let fixed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userCode = doc.id;

      try {
        // Find the user in Firebase Auth by email
        const userRecord = await adminAuth.getUserByEmail(userData.email);

        // Check if they already have claims
        const existingClaims = userRecord.customClaims || {};
        const needsUpdate = !existingClaims.role || !existingClaims.userCode;

        if (needsUpdate) {
          // Set custom claims
          await adminAuth.setCustomUserClaims(userRecord.uid, {
            role: userData.role,
            userCode: userData.userCode,
          });

          console.log(
            `Fixed claims for user ${userCode}: role=${userData.role}, userCode=${userData.userCode}`
          );
          fixed++;
        } else {
          console.log(`User ${userCode} already has claims, skipping`);
        }
      } catch (authError) {
        console.error(`User ${userCode} not found in Firebase Auth:`, authError);
        errors++;
        errorDetails.push(`${userCode}: not found in Firebase Auth`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Claims fixing complete`,
      fixed,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
    });
  } catch (error) {
    console.error('Error fixing all claims:', error);
    throw error;
  }
}
