import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

// Status migration mapping
const STATUS_FIXES: Record<string, string> = {
  'under-offer': 'quote-received',
  'under-operator-review': 'quote-received', 
  'quoted': 'quote-received',
  'pending': 'submitted',
  'draft': 'submitted',
  'booked': 'accepted',
  'cancelled': 'rejected'
};

export async function fixDatabaseStatuses() {
  try {
    console.log('🚀 Starting status fix...');

    // Get all quote requests
    const snapshot = await getDocs(collection(db, 'quoteRequests'));
    
    if (snapshot.empty) {
      console.log('❌ No quote requests found');
      return { success: false, message: 'No data found' };
    }

    console.log(`📊 Found ${snapshot.size} quote requests`);

    // Find requests that need fixing
    const toFix: Array<{
      id: string;
      requestCode: string;
      oldStatus: string;
      newStatus: string;
    }> = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const currentStatus = data.status;
      const newStatus = STATUS_FIXES[currentStatus];
      
      if (newStatus) {
        toFix.push({
          id: doc.id,
          requestCode: data.requestCode || doc.id,
          oldStatus: currentStatus,
          newStatus
        });
      }
    });

    if (toFix.length === 0) {
      console.log('✅ No statuses need fixing!');
      return { success: true, message: 'All statuses are correct', fixed: 0 };
    }

    console.log(`🔧 Found ${toFix.length} requests needing fixes:`);
    toFix.forEach(item => {
      console.log(`  - ${item.requestCode}: "${item.oldStatus}" → "${item.newStatus}"`);
    });

    // Apply fixes
    let fixed = 0;
    for (const item of toFix) {
      try {
        const docRef = doc(db, 'quoteRequests', item.id);
        await updateDoc(docRef, {
          status: item.newStatus,
          statusFixedAt: new Date(),
          statusFixedFrom: item.oldStatus
        });
        
        console.log(`✅ Fixed ${item.requestCode}: ${item.oldStatus} → ${item.newStatus}`);
        fixed++;
      } catch (error) {
        console.error(`❌ Failed to fix ${item.requestCode}:`, error);
      }
    }

    console.log(`🎉 Successfully fixed ${fixed}/${toFix.length} quote requests!`);
    console.log('🔄 Refresh the page to see the updated statuses');

    return { 
      success: true, 
      message: `Fixed ${fixed}/${toFix.length} statuses`,
      fixed,
      total: toFix.length 
    };

  } catch (error) {
    console.error('💥 Status fix failed:', error);
    return { success: false, message: 'Fix failed', error };
  }
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).fixDatabaseStatuses = fixDatabaseStatuses;
} 