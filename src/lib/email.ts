import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// Types for notifications
export interface EmailNotification {
  userId: string;
  userCode: string;
  type: 'verification' | 'welcome' | 'password_reset' | 'quote_request' | 'booking_confirmation' | 'admin_invitation' | 'admin_approval' | 'admin_suspension' | 'admin_permissions' | 'admin_notification' | 'registration_reminder' | 'message_notification' | 'conversation_started' | 'message_digest';
  emailType: string;
  sentTo: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
  reminderNumber?: number;
}

// Function to store email notification in Firestore
async function storeEmailNotification(notification: Partial<EmailNotification>) {
  try {
    if (!notification.userCode) {
      throw new Error('userCode is required for storing email notifications');
    }
    
    const notificationData = {
      ...notification,
      sentAt: serverTimestamp(),
    };

    // Create reference to the emails subcollection for this user
    const emailsCollectionRef = collection(db, 'notifications', notification.userCode, 'emails');
    await addDoc(emailsCollectionRef, notificationData);
  } catch (error) {
    console.error('Error storing email notification:', error);
  }
}

// Function to send verification email
export async function sendVerificationEmail(email: string, userId: string, userCode: string) {
  try {
    const response = await fetch('/api/email/verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }

    // Store notification
    await storeEmailNotification({
      userId,
      userCode,
      type: 'verification',
      emailType: 'VERIFICATION_EMAIL',
      sentTo: email,
      status: 'sent',
    });

  } catch (error) {
    // Store failed notification
    await storeEmailNotification({
      userId,
      userCode,
      type: 'verification',
      emailType: 'VERIFICATION_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send welcome email
export async function sendWelcomeEmail(email: string, userId: string, userCode: string, firstName: string, role?: string, company?: string) {
  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        firstName, 
        userCode, 
        role: role || 'passenger',
        company: company || null
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send welcome email');
    }

    // Store notification
    await storeEmailNotification({
      userId,
      userCode,
      type: 'welcome',
      emailType: 'WELCOME_EMAIL',
      sentTo: email,
      status: 'sent',
    });

  } catch (error) {
    // Store failed notification
    await storeEmailNotification({
      userId,
      userCode,
      type: 'welcome',
      emailType: 'WELCOME_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send admin invitation email
export async function sendAdminInvitationEmail(email: string, firstName: string, invitationId: string, userId: string, userCode: string) {
  try {
    const response = await fetch('/api/email/admin-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName, invitationId }),
    });

    if (!response.ok) {
      throw new Error('Failed to send admin invitation email');
    }

    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_invitation',
      emailType: 'ADMIN_INVITATION_EMAIL',
      sentTo: email,
      status: 'sent',
    });
  } catch (error) {
    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_invitation',
      emailType: 'ADMIN_INVITATION_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send admin approval email
export async function sendAdminApprovalEmail(email: string, firstName: string, userId: string, userCode: string) {
  try {
    const response = await fetch('/api/email/admin-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName }),
    });

    if (!response.ok) {
      throw new Error('Failed to send admin approval email');
    }

    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_approval',
      emailType: 'ADMIN_APPROVAL_EMAIL',
      sentTo: email,
      status: 'sent',
    });
  } catch (error) {
    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_approval',
      emailType: 'ADMIN_APPROVAL_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send admin suspension email
export async function sendAdminSuspensionEmail(email: string, firstName: string, reason: string, userId: string, userCode: string) {
  try {
    const response = await fetch('/api/email/admin-suspension', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName, reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to send admin suspension email');
    }

    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_suspension',
      emailType: 'ADMIN_SUSPENSION_EMAIL',
      sentTo: email,
      status: 'sent',
    });
  } catch (error) {
    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_suspension',
      emailType: 'ADMIN_SUSPENSION_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send admin permissions update email
export async function sendAdminPermissionsUpdateEmail(email: string, firstName: string, userId: string, userCode: string) {
  try {
    const response = await fetch('/api/email/admin-permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName }),
    });

    if (!response.ok) {
      throw new Error('Failed to send admin permissions update email');
    }

    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_permissions',
      emailType: 'ADMIN_PERMISSIONS_EMAIL',
      sentTo: email,
      status: 'sent',
    });
  } catch (error) {
    await storeEmailNotification({
      userId,
      userCode,
      type: 'admin_permissions',
      emailType: 'ADMIN_PERMISSIONS_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send operator notifications for new quote requests
export async function sendOperatorQuoteNotifications(quoteRequest: any) {
  try {
    console.log('🔍 Starting operator notification process...');
    console.log('📄 Quote request data:', JSON.stringify(quoteRequest, null, 2));
    
    // Get all active operators from Firestore
    const operatorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'operator'),
      where('status', '==', 'active')
    );
    
    console.log('🔍 Querying for active operators...');
    const operatorsSnapshot = await getDocs(operatorsQuery);
    console.log(`📊 Found ${operatorsSnapshot.docs.length} documents matching operator criteria`);
    
    // Also check all operators regardless of status for debugging
    const allOperatorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'operator')
    );
    const allOperatorsSnapshot = await getDocs(allOperatorsQuery);
    console.log(`🔍 Total operators in database: ${allOperatorsSnapshot.docs.length}`);
    
    if (allOperatorsSnapshot.docs.length > 0) {
      console.log('📋 All operators statuses:');
      allOperatorsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.firstName} ${data.lastName} (${data.email}) - Status: ${data.status}`);
      });
    }
    
    const operators = operatorsSnapshot.docs.map(doc => ({
      userCode: doc.id,
      ...doc.data()
    })) as Array<{
      userCode: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      status: string;
    }>;

    console.log(`✅ Found ${operators.length} active operators to notify`);
    if (operators.length > 0) {
      console.log('👥 Active operators:', operators.map(op => ({ userCode: op.userCode, email: op.email, firstName: op.firstName })));
    }

    // Send notification to each operator
    for (const operator of operators) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (typeof window === 'undefined'
            ? process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : 'http://localhost:3000'
            : '');

        const response = await fetch(`${baseUrl}/api/email/operator-quote-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operatorEmail: operator.email,
            operatorFirstName: operator.firstName,
            quoteRequestCode: quoteRequest.requestCode,
            departureAirport: quoteRequest.routing?.departureAirport || quoteRequest.departureAirport,
            arrivalAirport: quoteRequest.routing?.arrivalAirport || quoteRequest.arrivalAirport,
            departureDate: quoteRequest.routing?.departureDate || quoteRequest.departureDate,
            passengerCount: quoteRequest.passengerCount,
            tripType: quoteRequest.tripType,
            requestId: quoteRequest.id || quoteRequest.requestCode,
          }),
        });

        if (response.ok) {
          // Store successful notification
          await storeEmailNotification({
            userId: operator.userCode,
            userCode: operator.userCode,
            type: 'quote_request',
            emailType: 'OPERATOR_QUOTE_NOTIFICATION',
            sentTo: operator.email,
            status: 'sent',
          });
          console.log(`Quote request notification sent to operator: ${operator.email}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        // Store failed notification
        await storeEmailNotification({
          userId: operator.userCode,
          userCode: operator.userCode,
          type: 'quote_request',
          emailType: 'OPERATOR_QUOTE_NOTIFICATION',
          sentTo: operator.email,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`Failed to send notification to operator ${operator.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending operator quote notifications:', error);
    throw error;
  }
}

// Function to send quote confirmation email to passenger
export async function sendQuoteConfirmationEmail(
  quoteRequest: any,
  passengerEmail: string,
  passengerFirstName: string
) {
  try {
    console.log('📧 Sending quote confirmation email to passenger...');
    
    const response = await fetch('/api/email/quote-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        passengerEmail,
        passengerFirstName,
        quoteRequestCode: quoteRequest.requestCode,
        departureAirport: quoteRequest.routing?.departureAirport || quoteRequest.departureAirport,
        arrivalAirport: quoteRequest.routing?.arrivalAirport || quoteRequest.arrivalAirport,
        departureDate: quoteRequest.routing?.departureDate || quoteRequest.departureDate,
        returnDate: quoteRequest.routing?.returnDate || quoteRequest.returnDate,
        passengerCount: quoteRequest.passengerCount,
        tripType: quoteRequest.tripType,
        additionalInfo: quoteRequest.additionalInfo,
        requestId: quoteRequest.id || quoteRequest.requestCode,
      }),
    });

    if (response.ok) {
      console.log('✅ Quote confirmation email sent successfully');
      
      // Store successful notification
      await storeEmailNotification({
        userId: 'system',
        userCode: 'system',
        type: 'quote_request',
        emailType: 'QUOTE_CONFIRMATION_EMAIL',
        sentTo: passengerEmail,
        status: 'sent',
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Failed to send quote confirmation email:', error);
    
    // Store failed notification
    await storeEmailNotification({
      userId: 'system',
      userCode: 'system',
      type: 'quote_request',
      emailType: 'QUOTE_CONFIRMATION_EMAIL',
      sentTo: passengerEmail,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send admin notification for new user registration
export async function sendAdminNotification(
  newUserEmail: string,
  newUserFirstName: string,
  newUserLastName: string,
  newUserRole: string,
  newUserCode: string,
  company?: string | null
) {
  try {
    const response = await fetch('/api/email/admin-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newUserEmail,
        newUserFirstName,
        newUserLastName,
        newUserRole,
        newUserCode,
        company
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send admin notification');
    }

    // Store notification
    await storeEmailNotification({
      userId: 'system',
      userCode: 'system',
      type: 'admin_notification',
      emailType: 'ADMIN_NOTIFICATION_EMAIL',
      sentTo: 'noreply@chartermarket.app',
      status: 'sent',
    });

  } catch (error) {
    // Store failed notification
    await storeEmailNotification({
      userId: 'system',
      userCode: 'system',
      type: 'admin_notification',
      emailType: 'ADMIN_NOTIFICATION_EMAIL',
      sentTo: 'noreply@chartermarket.app',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Function to send registration reminder email
export async function sendRegistrationReminderEmail(
  email: string,
  firstName: string,
  userId: string,
  userCode: string,
  role: string,
  reminderNumber: number,
  nextStep: string
) {
  try {
    const response = await fetch('/api/email/registration-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName,
        role,
        reminderNumber,
        nextStep
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send registration reminder email');
    }

    // Store notification
    await storeEmailNotification({
      userId,
      userCode,
      type: 'registration_reminder',
      emailType: 'REGISTRATION_REMINDER_EMAIL',
      sentTo: email,
      status: 'sent',
      reminderNumber
    });

  } catch (error) {
    // Store failed notification
    await storeEmailNotification({
      userId,
      userCode,
      type: 'registration_reminder',
      emailType: 'REGISTRATION_REMINDER_EMAIL',
      sentTo: email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      reminderNumber
    });
    throw error;
  }
} 