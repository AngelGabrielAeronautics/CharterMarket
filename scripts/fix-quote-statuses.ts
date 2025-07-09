import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, limit } from 'firebase/firestore';

// Firebase config - you'll need to add your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Status migration mapping
const STATUS_MIGRATION_MAP: Record<string, string> = {
  'pending': 'submitted',
  'draft': 'submitted',
  'under-operator-review': 'quote-received',
  'under-offer': 'quote-received',
  'quoted': 'quote-received',
  'booked': 'accepted',
  'cancelled': 'rejected',
  // Valid statuses stay the same
  'submitted': 'submitted',
  'quote-received': 'quote-received',
  'quotes-viewed': 'quotes-viewed',
  'accepted': 'accepted',
  'rejected': 'rejected',
  'expired': 'expired'
};

async function fixQuoteStatuses() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('🔍 Checking quote request statuses...');

    // Get all quote requests
    const quoteRequestsQuery = query(collection(db, 'quoteRequests'), limit(50));
    const snapshot = await getDocs(quoteRequestsQuery);

    if (snapshot.empty) {
      console.log('❌ No quote requests found');
      return;
    }

    console.log(`📊 Found ${snapshot.size} quote requests`);

    // Check statuses
    const statusCounts: Record<string, number> = {};
    const toFix: Array<{ id: string; currentStatus: string; newStatus: string }> = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentStatus = data.status || 'no-status';
      
      statusCounts[currentStatus] = (statusCounts[currentStatus] || 0) + 1;

      const newStatus = STATUS_MIGRATION_MAP[currentStatus];
      if (newStatus && newStatus !== currentStatus) {
        toFix.push({
          id: doc.id,
          currentStatus,
          newStatus
        });
      }
    });

    console.log('\n📈 Current status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    if (toFix.length === 0) {
      console.log('\n✅ All statuses are already correct!');
      return;
    }

    console.log(`\n🔧 Need to fix ${toFix.length} quote requests:`);
    toFix.forEach(item => {
      console.log(`  ${item.id}: ${item.currentStatus} → ${item.newStatus}`);
    });

    // Fix the statuses
    console.log('\n🚀 Applying fixes...');
    let fixed = 0;

    for (const item of toFix) {
      try {
        const docRef = doc(db, 'quoteRequests', item.id);
        await updateDoc(docRef, {
          status: item.newStatus,
          statusMigratedAt: new Date(),
          statusMigratedFrom: item.currentStatus
        });
        console.log(`✅ Fixed ${item.id}: ${item.currentStatus} → ${item.newStatus}`);
        fixed++;
      } catch (error) {
        console.error(`❌ Failed to fix ${item.id}:`, error);
      }
    }

    console.log(`\n🎉 Migration complete! Fixed ${fixed}/${toFix.length} quote requests`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixQuoteStatuses();
}

export { fixQuoteStatuses }; 