import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { sendRegistrationReminderEmail } from '@/lib/email';
import { sendAdminNotification } from '@/lib/email';
import { operatorHasAircraft } from '@/lib/aircraft';

// Helper function to determine next step
async function getNextStep(profile: any): Promise<string> {
  if (!profile.emailVerified) {
    return 'Verify your email address';
  }
  if (!profile.isProfileComplete) {
    return 'Complete your profile information';
  }
  if (profile.role === 'operator') {
    const hasAircraft = await operatorHasAircraft(profile.userCode);
    if (!hasAircraft) {
      return 'Add your first aircraft';
    }
  }
  return 'Complete your registration';
}

export async function GET(request: Request) {
  try {
    const now = new Date();
    const usersRef = collection(db, 'users');

    // Get incomplete registrations
    const incompleteQuery = query(usersRef, where('profileIncompleteDate', '!=', null));
    const snapshot = await getDocs(incompleteQuery);

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const incompleteDate = userData.profileIncompleteDate.toDate();
      const hoursSinceRegistration = (now.getTime() - incompleteDate.getTime()) / (1000 * 60 * 60);
      const nextStep = await getNextStep(userData);

      // Determine which reminder to send based on time elapsed
      let reminderNumber = 0;
      if (hoursSinceRegistration >= 168) {
        // 7 days
        // Mark as dormant and notify admin
        await updateDoc(doc(db, 'users', userDoc.id), {
          status: 'dormant',
          dormantDate: now,
          profileIncompleteDate: null,
        });

        // Notify admin about dormant account
        await sendAdminNotification(
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.role,
          userData.userCode,
          userData.company
        );

        continue;
      } else if (hoursSinceRegistration >= 72 && userData.reminderCount === 2) {
        // 3 days
        reminderNumber = 3;
      } else if (hoursSinceRegistration >= 24 && userData.reminderCount === 1) {
        // 24 hours
        reminderNumber = 2;
      } else if (hoursSinceRegistration >= 1 && userData.reminderCount === 0) {
        // 1 hour
        reminderNumber = 1;
      }

      // Send reminder if needed
      if (reminderNumber > 0) {
        try {
          await sendRegistrationReminderEmail(
            userData.email,
            userData.firstName,
            userDoc.id,
            userData.userCode,
            userData.role,
            reminderNumber,
            nextStep
          );

          // Update reminder count
          await updateDoc(doc(db, 'users', userDoc.id), {
            reminderCount: reminderNumber,
            lastReminderSent: now,
          });
        } catch (error) {
          console.error(`Failed to send reminder ${reminderNumber} to ${userData.email}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing registration reminders:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}
