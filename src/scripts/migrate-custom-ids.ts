#!/usr/bin/env ts-node

/**
 * Migration script to move existing bookings and invoices from auto-generated document IDs
 * to custom booking/invoice IDs as document references.
 *
 * This script should be run once after deploying the new code.
 *
 * Run with: npx ts-node src/scripts/migrate-custom-ids.ts
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';

// Firebase config (you may need to adjust this)
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Add other config as needed
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateBookings() {
  console.log('Starting booking migration...');

  const bookingsRef = collection(db, 'bookings');
  const snapshot = await getDocs(bookingsRef);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const currentDocId = docSnap.id;
    const bookingId = data.bookingId;

    // Skip if the document ID is already the bookingId
    if (currentDocId === bookingId) {
      console.log(`Booking ${bookingId} already uses custom ID, skipping`);
      skippedCount++;
      continue;
    }

    // Skip if bookingId is missing
    if (!bookingId) {
      console.warn(`Booking ${currentDocId} missing bookingId field, skipping`);
      skippedCount++;
      continue;
    }

    try {
      // Create new document with custom ID
      const newDocRef = doc(db, 'bookings', bookingId);
      await setDoc(newDocRef, data);

      // Delete old document
      await deleteDoc(docSnap.ref);

      console.log(`Migrated booking: ${currentDocId} -> ${bookingId}`);
      migratedCount++;
    } catch (error) {
      console.error(`Error migrating booking ${currentDocId}:`, error);
    }
  }

  console.log(`Booking migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
}

async function migrateInvoices() {
  console.log('Starting invoice migration...');

  const invoicesRef = collection(db, 'invoices');
  const snapshot = await getDocs(invoicesRef);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const currentDocId = docSnap.id;
    const invoiceId = data.invoiceId;

    // Skip if the document ID is already the invoiceId
    if (currentDocId === invoiceId) {
      console.log(`Invoice ${invoiceId} already uses custom ID, skipping`);
      skippedCount++;
      continue;
    }

    // Skip if invoiceId is missing
    if (!invoiceId) {
      console.warn(`Invoice ${currentDocId} missing invoiceId field, skipping`);
      skippedCount++;
      continue;
    }

    try {
      // Create new document with custom ID
      const newDocRef = doc(db, 'invoices', invoiceId);
      await setDoc(newDocRef, data);

      // Delete old document
      await deleteDoc(docSnap.ref);

      console.log(`Migrated invoice: ${currentDocId} -> ${invoiceId}`);
      migratedCount++;
    } catch (error) {
      console.error(`Error migrating invoice ${currentDocId}:`, error);
    }
  }

  console.log(`Invoice migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
}

async function main() {
  try {
    console.log('Starting document ID migration...');

    await migrateBookings();
    await migrateInvoices();

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}
