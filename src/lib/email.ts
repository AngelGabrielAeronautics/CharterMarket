import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
export async function sendWelcomeEmail(email: string, userId: string, userCode: string, firstName: string) {
  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName }),
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