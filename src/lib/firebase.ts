import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.storageBucket) {
  console.error('Firebase Storage Bucket is not configured. Please check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
} else {
  console.log(`Firebase Storage Bucket configured: ${firebaseConfig.storageBucket}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize storage with proper error handling
const storage = (() => {
  try {
    const storageInstance = getStorage(app);
    console.log('Firebase Storage initialized successfully');
    return storageInstance;
  } catch (error) {
    console.error('Error initializing Firebase Storage:', error);
    throw new Error('Failed to initialize Firebase Storage. Please check your configuration.');
  }
})();

export { auth, db, storage }; 