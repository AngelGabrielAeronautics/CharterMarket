#!/usr/bin/env ts-node
import 'dotenv/config';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

// Initialize Firebase Admin SDK
const app = !getApps().length
  ? (() => {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        return initializeApp({ credential: cert(serviceAccount) });
      }
      // Fallback to manual env vars
      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
    })()
  : getApp();

const auth = getAuth(app);

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: ts-node scripts/set-claims.ts <user-email>');
    process.exit(1);
  }

  const claims = {
    role: 'superAdmin',
    permissions: {
      userManagement: true,
      bookingManagement: true,
      financialAccess: true,
      systemConfig: true,
      contentManagement: true,
    },
  };

  try {
    const userRecord = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(userRecord.uid, claims);
    console.log(`Custom claims set for ${email}`);
  } catch (err: any) {
    console.error('Error setting custom claims:', err);
    process.exit(1);
  }
}

main();
