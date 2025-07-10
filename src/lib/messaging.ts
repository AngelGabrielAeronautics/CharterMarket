import { db, storage, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  runTransaction,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Conversation,
  Message,
  CreateConversationData,
  MessageFormData,
  ConversationFilters,
  MessageSearchParams,
  MessageAttachment,
  ConversationParticipant,
  MessageThread,
  ConversationSettings,
  TypingIndicator,
} from '@/types/message';
import { generateUserCode } from '@/lib/userCode';
import { createNotification } from '@/lib/notification';
import { sendNewMessageEmail, sendConversationStartedEmail } from '@/lib/messaging-email';

// ==========================================
// ID GENERATION UTILITIES
// ==========================================

/**
 * Generate a conversation ID
 * Format: CONV-{contextType}-{userCode1}-{userCode2}-{YYYYMMDD}-{XXXX}
 */
export const generateConversationId = (
  contextType: string = 'general',
  participantUserCodes: string[]
): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  // Sort participants for consistent IDs
  const sortedParticipants = participantUserCodes.sort().slice(0, 2);
  const participantPart = sortedParticipants.join('-');
  
  return `CONV-${contextType.toUpperCase()}-${participantPart}-${dateStr}-${randomSuffix}`;
};

/**
 * Generate a message ID
 * Format: MSG-{YYYYMMDD}-{HHMMSS}-{XXXX}
 */
export const generateMessageId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `MSG-${dateStr}-${timeStr}-${randomSuffix}`;
};

/**
 * Generate an attachment ID
 */
export const generateAttachmentId = (): string => {
  return `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// ==========================================
// CONVERSATION MANAGEMENT
// ==========================================

/**
 * Create a new conversation
 */
export const createConversation = async (
  data: CreateConversationData,
  currentUserCode: string
): Promise<string> => {
  try {
    // Ensure the current user is included in the participant list
    const uniqueParticipants = Array.from(
      new Set([currentUserCode, ...data.participantUserCodes])
    );

    // Fetch participant details
    const participants: ConversationParticipant[] = [];
    for (const userCode of uniqueParticipants) {
      const userDoc = await getDoc(doc(db, 'users', userCode));
      if (!userDoc.exists()) {
        console.warn('Participant profile or email not found for', userCode);
        continue;
      }
      const userData = userDoc.data();
      const participant: ConversationParticipant = {
        userCode,
        name: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
        role: userData.role,
        joinedAt: Timestamp.now(),
        isActive: true,
        notificationPreferences: {
          inApp: true,
          email: data.emailIntegrationEnabled ?? true,
          whatsapp: data.whatsappIntegrationEnabled ?? false,
        },
      } as any;

      // Optional properties – convert undefined to null to satisfy Firestore
      participant.avatar = userData.photoURL ?? null;
      participant.email = userData.email ?? null;
      participant.company = userData.company ?? null;

      participants.push(participant);
    }

    if (participants.length === 0) {
      throw new Error('No valid participants found');
    }

    // Generate conversation title
    const title = data.title || generateConversationTitle(data, participants);

    // Build conversation data
    const conversationData: Omit<Conversation, 'id'> = {
      title,
      type: data.type,
      status: 'active',
      participants,
      participantUserCodes: uniqueParticipants,
      messageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
      isGroupChat: uniqueParticipants.length > 2,
      allowFileUploads: data.allowFileUploads ?? true,
      maxParticipants: uniqueParticipants.length > 2 ? 10 : 2,
      unreadCounts: Object.fromEntries(uniqueParticipants.map(u => [u, 0])),
      priority: data.priority || 'normal',
      tags: data.tags || [],
      createdBy: currentUserCode,
      emailIntegrationEnabled: data.emailIntegrationEnabled ?? true,
      whatsappIntegrationEnabled: data.whatsappIntegrationEnabled ?? false,
    };

    // Optional context fields
    if (data.contextType !== undefined) {
      conversationData.contextType = data.contextType;
    }
    if (data.contextId !== undefined) {
      conversationData.contextId = data.contextId;
    }
    if (data.contextData !== undefined) {
      conversationData.contextData = data.contextData;
    }

    // Generate conversation ID
    const conversationId = generateConversationId(
      data.contextType,
      uniqueParticipants
    );

    // Save conversation
    await setDoc(doc(db, 'conversations', conversationId), conversationData);

    // Create participant documents
    const batch = writeBatch(db);
    for (const participant of participants) {
      const participantRef = doc(
        db,
        'conversations',
        conversationId,
        'participants',
        participant.userCode
      );
      batch.set(participantRef, {
        ...participant,
        conversationId,
      });
    }
    await batch.commit();

    // Update conversation summaries
    await updateConversationSummaries(conversationId, {
      id: conversationId,
      ...conversationData,
    } as Conversation);

    console.log(`Created conversation ${conversationId} with ${participants.length} participants`);
    return conversationId;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Generate a conversation title based on context and participants
 */
const generateConversationTitle = (
  data: CreateConversationData,
  participants: ConversationParticipant[]
): string => {
  if (data.type === 'quote_discussion') {
    return `Flight Quote Discussion`;
  } else if (data.type === 'booking_support') {
    return `Booking Support`;
  } else if (data.type === 'payment_discussion') {
    return `Payment Discussion`;
  } else if (data.contextType === 'quote') {
    return `Quote Discussion`;
  } else if (data.contextType === 'booking') {
    return `Booking Support`;
  } else if (data.contextType === 'invoice') {
    return `Payment Discussion`;
  } else {
    const otherParticipants = participants.filter(p => p.userCode !== auth.currentUser?.uid);
    if (otherParticipants.length === 1) {
      return `Chat with ${otherParticipants[0].name}`;
    } else {
      return `Group Chat`;
    }
  }
};

/**
 * Get a conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (conversationDoc.exists()) {
      return {
        id: conversationDoc.id,
        ...conversationDoc.data(),
      } as Conversation;
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw new Error('Failed to get conversation');
  }
};

/**
 * Get conversations for a user with filtering
 */
export const getUserConversations = async (
  userCode: string,
  filters: ConversationFilters = {}
): Promise<Conversation[]> => {
  try {
    let q = query(
      collection(db, 'conversations'),
      where('participantUserCodes', 'array-contains', userCode),
      orderBy('lastActivityAt', 'desc')
    );

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    if (filters.contextType) {
      q = query(q, where('contextType', '==', filters.contextType));
    }

    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw new Error('Failed to get conversations');
  }
};

// ==========================================
// MESSAGE MANAGEMENT
// ==========================================

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  messageData: MessageFormData,
  senderUserCode: string
): Promise<string> => {
  try {
    // Get conversation to validate and get participant info
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participantUserCodes.includes(senderUserCode)) {
      throw new Error('User is not a participant in this conversation');
    }

    // Get sender details
    const senderDoc = await getDoc(doc(db, 'users', senderUserCode));
    if (!senderDoc.exists()) {
      throw new Error('Sender not found');
    }
    const senderData = senderDoc.data();

    const messageId = generateMessageId();
    let attachments: MessageAttachment[] = [];

    // Handle file attachments if present
    if (messageData.attachments && messageData.attachments.length > 0) {
      attachments = await uploadMessageAttachments(messageData.attachments, conversationId, senderUserCode);
    }

    // --- sanitize optional fields before writing to Firestore ---
    // Build metadata object only with defined values
    const metadata: Record<string, any> = {};
    if (conversation.contextData?.quoteId !== undefined) metadata.quoteId = conversation.contextData.quoteId;
    if (conversation.contextData?.bookingId !== undefined) metadata.bookingId = conversation.contextData.bookingId;
    if (conversation.contextData?.invoiceId !== undefined) metadata.invoiceId = conversation.contextData.invoiceId;
    if (conversation.contextData?.flightId !== undefined) metadata.flightId = conversation.contextData.flightId;

    const message: Omit<Message, 'id'> = {
      conversationId,
      content: messageData.content,
      type: messageData.type || 'text',
      attachments,
      senderId: senderUserCode,
      senderName: `${senderData.firstName} ${senderData.lastName}`.trim() || senderData.email,
      senderRole: senderData.role,
      // Convert undefined avatar to null to satisfy Firestore
      senderAvatar: senderData.photoURL ?? null,
      status: 'sent',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      readBy: {
        [senderUserCode]: Timestamp.now(), // Sender automatically reads their own message
      },
      // Only include contextType/Id if they are provided
      ...(messageData.contextType || conversation.contextType ? { contextType: messageData.contextType || conversation.contextType } : {}),
      ...(messageData.contextId || conversation.contextId ? { contextId: messageData.contextId || conversation.contextId } : {}),
      // Only include metadata if we actually have keys
      ...(Object.keys(metadata).length ? { metadata } : {}),
      // Only include replyToMessageId if defined
      ...(messageData.replyToMessageId ? { replyToMessageId: messageData.replyToMessageId } : {}),
    };

    // Use transaction to ensure consistency
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const conversationRef = doc(db, 'conversations', conversationId);

    await runTransaction(db, async (transaction) => {
      // Create the message
      transaction.set(messageRef, message);

      // Update conversation with last message info and increment message count
      const lastMessage = {
        id: messageId,
        content: messageData.content,
        senderName: message.senderName,
        senderId: senderUserCode,
        createdAt: message.createdAt,
        type: message.type,
      };

      // Update unread counts for other participants
      const updatedUnreadCounts = { ...conversation.unreadCounts };
      for (const userCode of conversation.participantUserCodes) {
        if (userCode !== senderUserCode) {
          updatedUnreadCounts[userCode] = (updatedUnreadCounts[userCode] || 0) + 1;
        }
      }

      transaction.update(conversationRef, {
        lastMessage,
        messageCount: conversation.messageCount + 1,
        lastActivityAt: message.createdAt,
        updatedAt: message.createdAt,
        unreadCounts: updatedUnreadCounts,
      });
    });

    // Update conversation summaries for all participants (outside transaction)
    const updatedConversation = await getConversation(conversationId);
    if (updatedConversation) {
      await updateConversationSummaries(conversationId, updatedConversation);
    }

    // Send notifications to other participants
    for (const participant of conversation.participants) {
      if (participant.userCode !== senderUserCode && participant.isActive) {
        try {
          await createNotification(
            participant.userCode,
            'message_sent' as any,
            `New message from ${message.senderName}`,
            messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : ''),
            undefined, // TODO: Add conversationId and senderId to notification metadata type
            `/dashboard/messages?conversation=${conversationId}`
          );
        } catch (notificationError) {
          console.warn('Failed to send notification:', notificationError);
        }
      }
    }

    // Send email notifications asynchronously (don't block message sending)
    if (updatedConversation) {
      const messageWithId: Message = { id: messageId, ...message };
      
      // Send email notification in the background
      sendNewMessageEmail(messageWithId, updatedConversation)
        .catch(emailError => {
          console.warn('Failed to send email notification:', emailError);
        });
    }

    console.log(`Message ${messageId} sent in conversation ${conversationId}`);
    return messageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

/**
 * Upload message attachments to Firebase Storage
 */
const uploadMessageAttachments = async (
  files: File[],
  conversationId: string,
  userCode: string
): Promise<MessageAttachment[]> => {
  const attachments: MessageAttachment[] = [];

  for (const file of files) {
    try {
      const attachmentId = generateAttachmentId();
      const filePath = `messages/${conversationId}/${attachmentId}/${file.name}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create attachment metadata
      const attachment: MessageAttachment = {
        id: attachmentId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: downloadURL,
        uploadedAt: Timestamp.now(),
        uploadedBy: userCode,
      };

      // Store attachment metadata
      await setDoc(doc(db, 'messageAttachments', attachmentId), attachment);

      attachments.push(attachment);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  }

  return attachments;
};

/**
 * Get messages for a conversation with pagination
 */
export const getMessages = async (
  conversationId: string,
  limitCount: number = 50,
  lastMessage?: Message
): Promise<Message[]> => {
  try {
    let q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastMessage) {
      q = query(q, startAfter(lastMessage.createdAt));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
  } catch (error) {
    console.error('Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
};

/**
 * Mark a message as read by a user
 */
export const markMessageAsRead = async (
  conversationId: string,
  messageId: string,
  userCode: string
): Promise<void> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const conversationRef = doc(db, 'conversations', conversationId);

    await runTransaction(db, async (transaction) => {
      const messageDoc = await transaction.get(messageRef);
      const conversationDoc = await transaction.get(conversationRef);

      if (!messageDoc.exists() || !conversationDoc.exists()) {
        throw new Error('Message or conversation not found');
      }

      const messageData = messageDoc.data() as Message;
      const conversationData = conversationDoc.data() as Conversation;

      // Update read receipt on message
      const updatedReadBy = {
        ...messageData.readBy,
        [userCode]: Timestamp.now(),
      };
      transaction.update(messageRef, { readBy: updatedReadBy });

      // Update unread count in conversation
      const updatedUnreadCounts = { ...conversationData.unreadCounts };
      if (updatedUnreadCounts[userCode] > 0) {
        updatedUnreadCounts[userCode] = Math.max(0, updatedUnreadCounts[userCode] - 1);
      }
      transaction.update(conversationRef, { unreadCounts: updatedUnreadCounts });
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw new Error('Failed to mark message as read');
  }
};

/**
 * Mark all messages in a conversation as read by a user
 */
export const markAllMessagesAsRead = async (
  conversationId: string,
  userCode: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const participantRef = doc(db, 'conversations', conversationId, 'participants', userCode);

    await runTransaction(db, async (transaction) => {
      const conversationDoc = await transaction.get(conversationRef);
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const conversationData = conversationDoc.data() as Conversation;

      // Reset unread count to 0
      const updatedUnreadCounts = { ...conversationData.unreadCounts };
      updatedUnreadCounts[userCode] = 0;

      transaction.update(conversationRef, { unreadCounts: updatedUnreadCounts });
      transaction.update(participantRef, {
        lastReadAt: Timestamp.now(),
        unreadCount: 0,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    throw new Error('Failed to mark all messages as read');
  }
};

// ==========================================
// REAL-TIME LISTENERS
// ==========================================

/**
 * Listen to conversations for a user
 */
export const listenToUserConversations = (
  userCode: string,
  callback: (conversations: Conversation[]) => void,
  filters: ConversationFilters = {}
) => {
  console.log('listenToUserConversations: Setting up listener for userCode:', userCode);
  
  let q = query(
    collection(db, 'conversations'),
    where('participantUserCodes', 'array-contains', userCode),
    orderBy('lastActivityAt', 'desc')
  );

  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }

  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }

  return onSnapshot(q, 
    (querySnapshot) => {
      console.log('listenToUserConversations: Received snapshot with', querySnapshot.docs.length, 'conversations');
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
      callback(conversations);
    },
    (error) => {
      console.error('listenToUserConversations: Firestore listener error:', error);
      // Call callback with empty array to indicate error state
      callback([]);
    }
  );
};

/**
 * Listen to messages in a conversation
 */
export const listenToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 50
) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    callback(messages.reverse()); // Reverse to show chronological order
  });
};

/**
 * Listen to typing indicators in a conversation
 */
export const listenToTypingIndicators = (
  conversationId: string,
  callback: (typingUsers: TypingIndicator[]) => void
) => {
  const q = query(collection(db, 'conversations', conversationId, 'typing'));

  return onSnapshot(q, (querySnapshot) => {
    const typingUsers = querySnapshot.docs.map(doc => ({
      conversationId,
      userCode: doc.id,
      ...doc.data(),
    })) as TypingIndicator[];

    // Filter out expired typing indicators
    const now = Timestamp.now();
    const activeTyping = typingUsers.filter(typing => typing.expiresAt > now);

    callback(activeTyping);
  });
};

// ==========================================
// CONVERSATION SUMMARIES & CACHING
// ==========================================

/**
 * Update conversation summaries for all participants
 */
const updateConversationSummaries = async (
  conversationId: string,
  conversation: Conversation
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    for (const userCode of conversation.participantUserCodes) {
      const summaryRef = doc(db, 'conversationSummaries', userCode);
      
      // Get existing summary document
      const summaryDoc = await getDoc(summaryRef);
      let existingConversations: any[] = [];
      let totalUnreadCount = 0;

      if (summaryDoc.exists()) {
        const summaryData = summaryDoc.data();
        existingConversations = summaryData.conversations || [];
        totalUnreadCount = summaryData.totalUnreadCount || 0;
      }

      // Update or add this conversation in the summary
      const otherParticipants = conversation.participants.filter(p => p.userCode !== userCode);
      const otherParticipant = otherParticipants[0] || conversation.participants[0];

      const conversationSummary: any = {
        id: conversationId,
        title: conversation.title,
        type: conversation.type,
        status: conversation.status,
        otherParticipantName: otherParticipant?.name || 'Unknown',
        unreadCount: conversation.unreadCounts[userCode] || 0,
        lastActivityAt: conversation.lastActivityAt,
        priority: conversation.priority,
      };

      // Only include optional fields if they are not undefined
      if (otherParticipant?.avatar !== undefined) {
        conversationSummary.otherParticipantAvatar = otherParticipant.avatar;
      }
      if (conversation.lastMessage !== undefined) {
        conversationSummary.lastMessage = conversation.lastMessage;
      }
      if (conversation.contextType !== undefined) {
        conversationSummary.contextType = conversation.contextType;
      }
      if (conversation.contextId !== undefined) {
        conversationSummary.contextId = conversation.contextId;
      }

      // Remove existing entry and add updated one
      const updatedConversations = existingConversations.filter(c => c.id !== conversationId);
      updatedConversations.unshift(conversationSummary);

      // Recalculate total unread count
      const newTotalUnreadCount = updatedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

      batch.set(summaryRef, {
        userCode,
        conversations: updatedConversations.slice(0, 50), // Keep only latest 50 conversations
        totalUnreadCount: newTotalUnreadCount,
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error updating conversation summaries:', error);
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Find or create a conversation for a specific context
 */
export const findOrCreateConversation = async (
  participantUserCodes: string[],
  contextType: 'quote' | 'booking' | 'invoice' | 'general',
  contextId?: string,
  currentUserCode?: string
): Promise<string> => {
  try {
    // Try to find existing conversation
    let q = query(
      collection(db, 'conversations'),
      where('participantUserCodes', '==', participantUserCodes.sort()),
      where('contextType', '==', contextType)
    );

    if (contextId) {
      q = query(q, where('contextId', '==', contextId));
    }

    const existingConversations = await getDocs(q);
    
    if (!existingConversations.empty) {
      return existingConversations.docs[0].id;
    }

    // Create new conversation if none exists
    const conversationData: CreateConversationData = {
      type: contextType === 'quote' ? 'quote_discussion' : 
           contextType === 'booking' ? 'booking_support' : 
           contextType === 'invoice' ? 'payment_discussion' : 'general_inquiry',
      participantUserCodes,
      contextType,
      emailIntegrationEnabled: true,
      whatsappIntegrationEnabled: false,
    };

    // Only add contextId if it's not undefined
    if (contextId !== undefined) {
      conversationData.contextId = contextId;
    }

    return await createConversation(conversationData, currentUserCode || participantUserCodes[0]);
  } catch (error) {
    console.error('Error finding or creating conversation:', error);
    throw new Error('Failed to find or create conversation');
  }
};

/**
 * Set typing indicator for a user in a conversation
 */
export const setTypingIndicator = async (
  conversationId: string,
  userCode: string,
  userName: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const typingRef = doc(db, 'conversations', conversationId, 'typing', userCode);

    if (isTyping) {
      const expiresAt = new Date(Date.now() + 3000); // Expires in 3 seconds
      await setDoc(typingRef, {
        userCode,
        userName,
        startedAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
      } as Omit<TypingIndicator, 'conversationId'>);
    } else {
      await deleteDoc(typingRef);
    }
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
};

/**
 * Get total unread message count for a user
 */
export const getTotalUnreadCount = async (userCode: string): Promise<number> => {
  try {
    const summaryDoc = await getDoc(doc(db, 'conversationSummaries', userCode));
    if (summaryDoc.exists()) {
      return summaryDoc.data().totalUnreadCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

/**
 * Search messages across conversations
 */
export const searchMessages = async (
  userCode: string,
  searchParams: MessageSearchParams
): Promise<Message[]> => {
  try {
    // Note: This is a simplified search implementation
    // For production, consider using Algolia or Elasticsearch for full-text search
    
    let conversations: Conversation[] = [];
    
    if (searchParams.conversationId) {
      const conversation = await getConversation(searchParams.conversationId);
      if (conversation) conversations = [conversation];
    } else {
      conversations = await getUserConversations(userCode, {
        contextType: searchParams.contextType,
        limit: 20,
      });
    }

    const allMessages: Message[] = [];
    
    for (const conversation of conversations) {
      const messages = await getMessages(conversation.id, 100);
      
      // Filter messages based on search criteria
      const filteredMessages = messages.filter(message => {
        if (searchParams.searchQuery) {
          const query = searchParams.searchQuery.toLowerCase();
          if (!message.content.toLowerCase().includes(query)) {
            return false;
          }
        }
        
        if (searchParams.messageType && message.type !== searchParams.messageType) {
          return false;
        }
        
        if (searchParams.senderId && message.senderId !== searchParams.senderId) {
          return false;
        }
        
        if (searchParams.hasAttachments && (!message.attachments || message.attachments.length === 0)) {
          return false;
        }
        
        return true;
      });

      allMessages.push(...filteredMessages);
    }

    // Sort by relevance/timestamp
    return allMessages.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                     .slice(0, searchParams.limit || 50);
  } catch (error) {
    console.error('Error searching messages:', error);
    throw new Error('Failed to search messages');
  }
}; 