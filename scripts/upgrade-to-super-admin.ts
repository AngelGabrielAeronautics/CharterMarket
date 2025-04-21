import * as admin from 'firebase-admin';
import { UserRole } from '../src/lib/utils';

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function upgradeToSuperAdmin(userCode: string) {
  try {
    // Get the user document from Firestore
    const usersRef = admin.firestore().collection('users');
    const userQuery = await usersRef.where('userCode', '==', userCode).get();
    
    if (userQuery.empty) {
      throw new Error(`No user found with userCode: ${userCode}`);
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userAuth = await admin.auth().getUserByEmail(userData.email);

    // Generate new super admin userCode
    const newUserCode = `AD-SUPE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Set custom claims in Firebase Auth
    await admin.auth().setCustomUserClaims(userAuth.uid, {
      role: 'superAdmin',
      userCode: newUserCode
    });

    // Update the user document in Firestore
    await userDoc.ref.update({
      role: 'superAdmin' as UserRole,
      userCode: newUserCode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      permissions: {
        userManagement: true,
        bookingManagement: true,
        financialAccess: true,
        systemConfig: true,
        contentManagement: true
      }
    });

    console.log('Successfully upgraded user to super admin:', {
      oldUserCode: userCode,
      newUserCode: newUserCode,
      email: userData.email
    });
    process.exit(0);
  } catch (error) {
    console.error('Error upgrading to super admin:', error);
    process.exit(1);
  }
}

// Get userCode from command line argument
const userCode = process.argv[2];
if (!userCode) {
  console.error('Please provide a userCode as a command line argument');
  process.exit(1);
}

upgradeToSuperAdmin(userCode); 