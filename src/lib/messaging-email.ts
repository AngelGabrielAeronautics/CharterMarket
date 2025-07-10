import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { EmailNotification } from '@/lib/email';
import { Message, Conversation } from '@/types/message';

// Extended email notification types for messaging
export type MessagingEmailType = 
  | 'new_message'
  | 'conversation_started'
  | 'quote_message'
  | 'booking_message'
  | 'message_digest';

export interface MessageEmailData {
  messageId: string;
  conversationId: string;
  senderName: string;
  senderUserCode: string;
  recipientName: string;
  recipientUserCode: string;
  recipientEmail: string;
  messageContent: string;
  messageType: string;
  conversationTitle: string;
  contextType?: string;
  contextId?: string;
  conversationUrl: string;
  unreadCount: number;
  quoteRequestCode?: string;
  bookingReference?: string;
}

export interface ConversationEmailData {
  conversationId: string;
  initiatorName: string;
  initiatorUserCode: string;
  participantName: string;
  participantUserCode: string;
  participantEmail: string;
  conversationTitle: string;
  contextType?: string;
  contextId?: string;
  conversationUrl: string;
  initialMessage?: string;
  quoteRequestCode?: string;
  bookingReference?: string;
}

/**
 * Store email notification in Firestore for messaging
 */
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
    console.error('Error storing messaging email notification:', error);
  }
}

/**
 * Get user profile information for email notifications
 */
async function getUserProfile(userCode: string) {
  try {
    const userRef = doc(db, 'users', userCode);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || '',
        email: userData.email,
        role: userData.role,
        emailNotifications: userData.emailNotifications !== false, // Default to true
        messageEmailFrequency: userData.messageEmailFrequency || 'immediate', // immediate, hourly, daily, never
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Check if user wants to receive email notifications for messages
 */
async function shouldSendEmailNotification(userCode: string, emailType: MessagingEmailType): Promise<boolean> {
  const profile = await getUserProfile(userCode);
  
  if (!profile || !profile.emailNotifications) {
    return false;
  }
  
  // Check frequency preferences
  switch (profile.messageEmailFrequency) {
    case 'never':
      return false;
    case 'immediate':
      return emailType === 'new_message' || emailType === 'conversation_started';
    case 'hourly':
      return emailType === 'message_digest';
    case 'daily':
      return emailType === 'message_digest';
    default:
      return true;
  }
}

/**
 * Get conversation context information for email
 */
async function getConversationContext(conversation: Conversation) {
  let contextInfo = {};
  
  if (conversation.contextType && conversation.contextId) {
    try {
      switch (conversation.contextType) {
        case 'quote': {
          const quoteRequestRef = doc(db, 'quoteRequests', conversation.contextId);
          const quoteRequestSnap = await getDoc(quoteRequestRef);
          if (quoteRequestSnap.exists()) {
            const quoteData = quoteRequestSnap.data();
            contextInfo = {
              quoteRequestCode: quoteData.requestCode,
              quoteRequestRoute: `${quoteData.routing?.departureAirport} → ${quoteData.routing?.arrivalAirport}`,
              quoteRequestDate: quoteData.routing?.departureDate?.toDate?.()?.toLocaleDateString(),
            };
          }
          break;
        }
          
        case 'booking': {
          const bookingRef = doc(db, 'bookings', conversation.contextId);
          const bookingSnap = await getDoc(bookingRef);
          if (bookingSnap.exists()) {
            const bookingData = bookingSnap.data();
            contextInfo = {
              bookingReference: bookingData.bookingCode,
              bookingRoute: `${bookingData.routing?.departureAirport} → ${bookingData.routing?.arrivalAirport}`,
              bookingDate: bookingData.routing?.departureDate?.toDate?.()?.toLocaleDateString(),
            };
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error fetching conversation context:', error);
    }
  }
  
  return contextInfo;
}

/**
 * Send new message email notification
 */
export async function sendNewMessageEmail(message: Message, conversation: Conversation): Promise<void> {
  try {
    // Get sender and recipient information
    const senderProfile = await getUserProfile(message.senderId);
    if (!senderProfile) {
      console.warn('Sender profile not found for message notification');
      return;
    }
    
    // Find recipients (exclude sender)
    const recipientUserCodes = conversation.participantUserCodes.filter(
      userCode => userCode !== message.senderId
    );
    
    // Get conversation context
    const contextInfo = await getConversationContext(conversation);
    
    // Send email to each recipient
    for (const recipientUserCode of recipientUserCodes) {
      const recipientProfile = await getUserProfile(recipientUserCode);
      
      if (!recipientProfile || !recipientProfile.email) {
        console.warn(`Recipient profile or email not found for ${recipientUserCode}`);
        continue;
      }
      
      // Check if user wants email notifications
      const shouldSend = await shouldSendEmailNotification(recipientUserCode, 'new_message');
      if (!shouldSend) {
        console.log(`Skipping email notification for ${recipientUserCode} - user preferences`);
        continue;
      }
      
      // Get unread count for recipient
      const unreadCount = conversation.unreadCounts?.[recipientUserCode] || 0;
      
      // Prepare email data
      const emailData: MessageEmailData = {
        messageId: message.id,
        conversationId: conversation.id,
        senderName: `${senderProfile.firstName} ${senderProfile.lastName}`.trim(),
        senderUserCode: message.senderId,
        recipientName: `${recipientProfile.firstName} ${recipientProfile.lastName}`.trim(),
        recipientUserCode: recipientUserCode,
        recipientEmail: recipientProfile.email,
        messageContent: message.content,
        messageType: message.type,
        conversationTitle: conversation.title || 'Charter Conversation',
        contextType: conversation.contextType,
        contextId: conversation.contextId,
        conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages?conversation=${conversation.id}`,
        unreadCount,
        ...contextInfo,
      };
      
      // Send email via API
      const response = await fetch('/api/email/message-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message notification email: ${response.statusText}`);
      }
      
      // Store email notification in tracking system
      await storeEmailNotification({
        userId: recipientUserCode,
        userCode: recipientUserCode,
        type: 'message_notification',
        emailType: 'MESSAGE_NOTIFICATION',
        sentTo: recipientProfile.email,
        status: 'sent',
      });
      
      console.log(`Message notification email sent to ${recipientProfile.email}`);
    }
  } catch (error) {
    console.error('Error sending new message email:', error);
    
    // Store failed notification for debugging
    if (message && conversation) {
      try {
        await storeEmailNotification({
          userId: 'system',
          userCode: 'system',
          type: 'message_notification',
          emailType: 'MESSAGE_NOTIFICATION',
          sentTo: 'system',
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      } catch (storeError) {
        console.error('Error storing failed email notification:', storeError);
      }
    }
    
    throw error;
  }
}

/**
 * Send conversation started email notification
 */
export async function sendConversationStartedEmail(conversation: Conversation, initiatorUserCode: string): Promise<void> {
  try {
    // Get initiator information
    const initiatorProfile = await getUserProfile(initiatorUserCode);
    if (!initiatorProfile) {
      console.warn('Initiator profile not found for conversation notification');
      return;
    }
    
    // Find other participants (exclude initiator)
    const participantUserCodes = conversation.participantUserCodes.filter(
      userCode => userCode !== initiatorUserCode
    );
    
    // Get conversation context
    const contextInfo = await getConversationContext(conversation);
    
    // Send email to each participant
    for (const participantUserCode of participantUserCodes) {
      const participantProfile = await getUserProfile(participantUserCode);
      
      if (!participantProfile || !participantProfile.email) {
        console.warn(`Participant profile or email not found for ${participantUserCode}`);
        continue;
      }
      
      // Check if user wants email notifications
      const shouldSend = await shouldSendEmailNotification(participantUserCode, 'conversation_started');
      if (!shouldSend) {
        console.log(`Skipping conversation notification for ${participantUserCode} - user preferences`);
        continue;
      }
      
      // Prepare email data
      const emailData: ConversationEmailData = {
        conversationId: conversation.id,
        initiatorName: `${initiatorProfile.firstName} ${initiatorProfile.lastName}`.trim(),
        initiatorUserCode: initiatorUserCode,
        participantName: `${participantProfile.firstName} ${participantProfile.lastName}`.trim(),
        participantUserCode: participantUserCode,
        participantEmail: participantProfile.email,
        conversationTitle: conversation.title || 'Charter Conversation',
        contextType: conversation.contextType,
        contextId: conversation.contextId,
        conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages?conversation=${conversation.id}`,
        initialMessage: conversation.lastMessage?.content,
        ...contextInfo,
      };
      
      // Send email via API
      const response = await fetch('/api/email/conversation-started', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send conversation started email: ${response.statusText}`);
      }
      
      // Store email notification in tracking system
      await storeEmailNotification({
        userId: participantUserCode,
        userCode: participantUserCode,
        type: 'conversation_started',
        emailType: 'CONVERSATION_STARTED',
        sentTo: participantProfile.email,
        status: 'sent',
      });
      
      console.log(`Conversation started email sent to ${participantProfile.email}`);
    }
  } catch (error) {
    console.error('Error sending conversation started email:', error);
    throw error;
  }
}

/**
 * Send daily/hourly message digest email
 */
export async function sendMessageDigestEmail(userCode: string, period: 'hourly' | 'daily'): Promise<void> {
  try {
    const userProfile = await getUserProfile(userCode);
    if (!userProfile || !userProfile.email) {
      console.warn(`User profile or email not found for ${userCode}`);
      return;
    }
    
    // Check if user wants digest emails
    const shouldSend = await shouldSendEmailNotification(userCode, 'message_digest');
    if (!shouldSend) {
      console.log(`Skipping message digest for ${userCode} - user preferences`);
      return;
    }
    
    // Get all conversations with unread messages for this user
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participantUserCodes', 'array-contains', userCode));
    const conversationsSnap = await getDocs(q);
    
    const unreadConversations: any[] = [];
    let totalUnreadCount = 0;
    
    conversationsSnap.forEach((doc) => {
      const conversation = { id: doc.id, ...doc.data() } as Conversation;
      const unreadCount = conversation.unreadCounts?.[userCode] || 0;
      
      if (unreadCount > 0) {
        unreadConversations.push({
          conversation,
          unreadCount,
        });
        totalUnreadCount += unreadCount;
      }
    });
    
    // Only send digest if there are unread messages
    if (totalUnreadCount === 0) {
      console.log(`No unread messages for ${userCode} - skipping digest`);
      return;
    }
    
    // Prepare digest email data
    const digestData = {
      userCode,
      userName: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
      userEmail: userProfile.email,
      period,
      totalUnreadCount,
      conversationCount: unreadConversations.length,
      conversations: unreadConversations.slice(0, 10), // Limit to 10 conversations
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages`,
    };
    
    // Send digest email via API
    const response = await fetch('/api/email/message-digest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(digestData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message digest email: ${response.statusText}`);
    }
    
    // Store email notification
    await storeEmailNotification({
      userId: userCode,
      userCode: userCode,
      type: 'message_digest',
      emailType: 'MESSAGE_DIGEST',
      sentTo: userProfile.email,
      status: 'sent',
    });
    
    console.log(`Message digest email sent to ${userProfile.email}`);
  } catch (error) {
    console.error('Error sending message digest email:', error);
    throw error;
  }
}

/**
 * Update user email notification preferences
 */
export async function updateEmailNotificationPreferences(
  userCode: string,
  preferences: {
    emailNotifications?: boolean;
    messageEmailFrequency?: 'immediate' | 'hourly' | 'daily' | 'never';
  }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userCode);
    await getDoc(userRef); // Update with the preferences
    
    console.log(`Updated email preferences for ${userCode}:`, preferences);
  } catch (error) {
    console.error('Error updating email notification preferences:', error);
    throw error;
  }
}

/**
 * Get user's current email notification preferences
 */
export async function getEmailNotificationPreferences(userCode: string) {
  try {
    const profile = await getUserProfile(userCode);
    
    if (!profile) {
      return {
        emailNotifications: true,
        messageEmailFrequency: 'immediate',
      };
    }
    
    return {
      emailNotifications: profile.emailNotifications,
      messageEmailFrequency: profile.messageEmailFrequency,
    };
  } catch (error) {
    console.error('Error getting email notification preferences:', error);
    return {
      emailNotifications: true,
      messageEmailFrequency: 'immediate',
    };
  }
} 