import { Timestamp } from 'firebase/firestore';
import { UserRole } from '@/lib/userCode';

// Message Types
export type MessageType = 
  | 'text'
  | 'file'
  | 'image'
  | 'system'
  | 'quote_update'
  | 'booking_update'
  | 'payment_update';

export type ConversationStatus = 
  | 'active'
  | 'archived'
  | 'closed'
  | 'blocked';

export type ConversationType = 
  | 'quote_discussion'
  | 'booking_support'
  | 'general_inquiry'
  | 'payment_discussion'
  | 'admin_support';

export type MessageStatus = 
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

// File Attachment Interface
export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

// Individual Message Interface
export interface Message {
  id: string;
  conversationId: string;
  
  // Content
  content: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  
  // Sender Information
  senderId: string; // userCode of sender
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  
  // Status & Timestamps
  status: MessageStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  
  // Read Receipts
  readBy: {
    [userCode: string]: Timestamp;
  };
  
  // Threading & References
  replyToMessageId?: string;
  quotedMessage?: {
    id: string;
    content: string;
    senderName: string;
  };
  
  // Context & Metadata
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string; // ID of related quote, booking, etc.
  metadata?: {
    quoteId?: string;
    bookingId?: string;
    invoiceId?: string;
    flightId?: string;
    systemAction?: string;
  };
  
  // External Delivery Tracking
  emailDelivery?: {
    status: DeliveryStatus;
    sentAt?: Timestamp;
    deliveredAt?: Timestamp;
    messageId?: string;
  };
  
  whatsappDelivery?: {
    status: DeliveryStatus;
    sentAt?: Timestamp;
    deliveredAt?: Timestamp;
    messageId?: string;
  };
}

// Conversation Participant Interface
export interface ConversationParticipant {
  userCode: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email: string;
  company?: string;
  joinedAt: Timestamp;
  lastReadAt?: Timestamp;
  isActive: boolean;
  notificationPreferences: {
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
  };
}

// Conversation Interface
export interface Conversation {
  id: string;
  
  // Basic Information
  title: string;
  type: ConversationType;
  status: ConversationStatus;
  
  // Participants
  participants: ConversationParticipant[];
  participantUserCodes: string[];
  
  // Message Tracking
  messageCount: number;
  lastMessage?: {
    id: string;
    content: string;
    senderName: string;
    senderId: string;
    createdAt: Timestamp;
    type: MessageType;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt: Timestamp;
  archivedAt?: Timestamp;
  
  // Context & Relationships
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string;
  contextData?: {
    quoteRequestId?: string;
    quoteId?: string;
    bookingId?: string;
    invoiceId?: string;
    flightId?: string;
    operatorUserCode?: string;
    clientUserCode?: string;
  };
  
  // Settings
  isGroupChat: boolean;
  allowFileUploads: boolean;
  maxParticipants: number;
  
  // Unread Counts (denormalized for performance)
  unreadCounts: {
    [userCode: string]: number;
  };
  
  // Auto-Archive Settings
  autoArchiveAfterDays?: number;
  autoArchiveAfterCompletion?: boolean;
  
  // Priority and Tags
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  
  // Admin & Moderation
  createdBy: string;
  moderators?: string[];
  
  // External Integration Settings
  emailIntegrationEnabled: boolean;
  whatsappIntegrationEnabled: boolean;
}

// Message Thread Summary (for UI optimization)
export interface MessageThread {
  conversationId: string;
  messages: Message[];
  participants: ConversationParticipant[];
  hasMore: boolean;
  oldestMessageTimestamp?: Timestamp;
  newestMessageTimestamp?: Timestamp;
}

// Message Form Data
export interface MessageFormData {
  content: string;
  type?: MessageType;
  attachments?: File[];
  replyToMessageId?: string;
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string;
}

// Conversation Creation Data
export interface CreateConversationData {
  title?: string;
  type: ConversationType;
  participantUserCodes: string[];
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string;
  contextData?: Conversation['contextData'];
  allowFileUploads?: boolean;
  emailIntegrationEnabled?: boolean;
  whatsappIntegrationEnabled?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
}

// Message Search & Filtering
export interface MessageSearchParams {
  conversationId?: string;
  searchQuery?: string;
  messageType?: MessageType;
  senderId?: string;
  startDate?: Date;
  endDate?: Date;
  hasAttachments?: boolean;
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  contextId?: string;
  limit?: number;
  offset?: number;
}

// Conversation List Filters
export interface ConversationFilters {
  status?: ConversationStatus;
  type?: ConversationType;
  hasUnread?: boolean;
  participantUserCode?: string;
  contextType?: 'quote' | 'booking' | 'invoice' | 'general';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  archived?: boolean;
  limit?: number;
  offset?: number;
}

// Typing Indicator
export interface TypingIndicator {
  conversationId: string;
  userCode: string;
  userName: string;
  startedAt: Timestamp;
  expiresAt: Timestamp;
}

// Message Reaction (for future enhancement)
export interface MessageReaction {
  messageId: string;
  userCode: string;
  emoji: string;
  createdAt: Timestamp;
}

// Conversation Settings
export interface ConversationSettings {
  conversationId: string;
  userCode: string;
  muteUntil?: Timestamp;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: Timestamp;
}

// External Message Integration
export interface ExternalMessage {
  id: string;
  conversationId: string;
  platform: 'email' | 'whatsapp';
  externalId: string;
  direction: 'inbound' | 'outbound';
  fromAddress: string;
  toAddress: string;
  subject?: string;
  content: string;
  attachments?: MessageAttachment[];
  receivedAt: Timestamp;
  processedAt?: Timestamp;
  linkedMessageId?: string;
  metadata?: {
    emailHeaders?: Record<string, string>;
    whatsappMetadata?: Record<string, any>;
  };
}

// Real-time Event Types
export type MessageEvent = 
  | 'message_sent'
  | 'message_read'
  | 'message_delivered'
  | 'user_typing'
  | 'user_stopped_typing'
  | 'conversation_updated'
  | 'participant_joined'
  | 'participant_left';

export interface MessageEventData {
  type: MessageEvent;
  conversationId: string;
  userId: string;
  timestamp: Timestamp;
  data?: any;
} 