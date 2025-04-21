import * as admin from 'firebase-admin';
import { UserRole } from '../src/lib/utils';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createSuperAdmin() {
  try {
    // Create the user
    const userRecord = await admin.auth().createUser({
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      displayName: 'Dylan Coppard',
      emailVerified: true
    });

    // Generate a proper super admin userCode
    const userCode = 'AD-COPP-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Set custom claims for super admin role
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'superAdmin',
      userCode
    });

    // Create the user document in Firestore
    await admin.firestore().collection('users').doc(userCode).set({
      uid: userRecord.uid,
      email: userRecord.email,
      firstName: 'Dylan',
      lastName: 'Coppard',
      role: 'superAdmin' as UserRole,
      userCode,
      company: 'Angel Gabriel Aeronautics',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: true,
      lastReminderSent: null,
      reminderCount: 0,
      profileIncompleteDate: null,
      permissions: {
        userManagement: true,
        bookingManagement: true,
        financialAccess: true,
        systemConfig: true,
        contentManagement: true
      }
    });

    console.log('Successfully created super admin user:', {
      uid: userRecord.uid,
      email: userRecord.email,
      userCode
    });
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin(); 