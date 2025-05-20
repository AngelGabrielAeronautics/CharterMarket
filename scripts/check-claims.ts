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
    console.error('Usage: ts-node scripts/check-claims.ts <user-email>');
    process.exit(1);
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Custom claims for ${email}:`, userRecord.customClaims);
  } catch (err: any) {
    console.error('Error fetching user claims:', err);
    process.exit(1);
  }
}

main();
