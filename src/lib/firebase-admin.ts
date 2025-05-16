import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Remove top-level initialization and exports
// Provide helper to initialize admin SDK on demand
function initFirebaseAdmin() {
  const apps = getApps();
  if (!apps.length) {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('Firebase Admin credentials not found, skipping initialization');
    }
  }
}

export function getAdminAuth() {
  try {
    initFirebaseAdmin();
    return getAuth();
  } catch (err) {
    console.warn('Error initializing Firebase Admin auth:', err);
    // Return stub to prevent import errors; generateEmailVerificationLink will throw
    return { generateEmailVerificationLink: async () => { throw err; } } as any;
  }
}

export function getAdminDb() {
  try {
    initFirebaseAdmin();
    return getFirestore();
  } catch (err) {
    console.warn('Error initializing Firebase Admin db:', err);
    return null;
  }
} 