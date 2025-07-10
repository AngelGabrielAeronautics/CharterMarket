# Charter Messaging System - Firestore Schema

## Overview

The Charter messaging system uses a scalable Firestore structure that supports real-time communication across web, mobile, and external platforms (email, WhatsApp). The system is designed for high performance with proper indexing and denormalization strategies.

## Collection Structure

```
conversations/
├── {conversationId}                    # Main conversation document
│   ├── messages/                       # Subcollection for messages
│   │   └── {messageId}                 # Individual message documents
│   ├── participants/                   # Subcollection for participant settings
│   │   └── {userCode}                  # User-specific conversation settings
│   └── typing/                         # Subcollection for typing indicators
│       └── {userCode}                  # Temporary typing status documents

conversationSummaries/                   # Denormalized for list views
└── {userCode}                          # One doc per user
    └── conversations[]                 # Array of conversation summaries

externalMessages/                       # Email/WhatsApp integration
└── {externalMessageId}                 # External message tracking

messageAttachments/                     # File upload metadata
└── {attachmentId}                      # Attachment details with Firebase Storage refs
```

## Core Collections

### 1. `conversations/{conversationId}`

```typescript
// Document ID: Generated using custom conversation ID format
// Format: CONV-{contextType}-{userCode1}-{userCode2}-{YYYYMMDD}-{XXXX}
// Example: CONV-QUOTE-PA-PAX-XSOX-OP-JETS-20241215-A1B2

{
  id: "CONV-QUOTE-PA-PAX-XSOX-OP-JETS-20241215-A1B2",
  title: "Flight Quote Discussion - JFK to LAX",
  type: "quote_discussion",
  status: "active",
  
  // Participants (denormalized for queries)
  participantUserCodes: ["PA-PAX-XSOX", "OP-JETS-FNLU"],
  participants: [
    {
      userCode: "PA-PAX-XSOX",
      name: "John Smith",
      role: "passenger",
      email: "john.smith@example.com",
      avatar: "https://...",
      joinedAt: Timestamp,
      isActive: true,
      notificationPreferences: {
        inApp: true,
        email: true,
        whatsapp: false
      }
    },
    {
      userCode: "OP-JETS-FNLU",
      name: "Elite Jets",
      role: "operator",
      email: "ops@elitejets.com",
      company: "Elite Jets Charter",
      joinedAt: Timestamp,
      isActive: true,
      notificationPreferences: {
        inApp: true,
        email: true,
        whatsapp: true
      }
    }
  ],
  
  // Message tracking (denormalized for performance)
  messageCount: 15,
  lastMessage: {
    id: "MSG-20241215-123456",
    content: "What time should passengers arrive?",
    senderName: "John Smith",
    senderId: "PA-PAX-XSOX",
    createdAt: Timestamp,
    type: "text"
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActivityAt: Timestamp,
  
  // Context linking
  contextType: "quote",
  contextId: "QR-PA-PAX-XSOX-20241215-A1B2",
  contextData: {
    quoteRequestId: "QR-PA-PAX-XSOX-20241215-A1B2",
    quoteId: "QT-OP-JETS-20241215-C3D4",
    operatorUserCode: "OP-JETS-FNLU",
    clientUserCode: "PA-PAX-XSOX"
  },
  
  // Settings
  isGroupChat: false,
  allowFileUploads: true,
  maxParticipants: 2,
  
  // Unread counts (denormalized for real-time UI)
  unreadCounts: {
    "PA-PAX-XSOX": 0,
    "OP-JETS-FNLU": 2
  },
  
  // Configuration
  priority: "normal",
  tags: ["quote", "domestic"],
  createdBy: "PA-PAX-XSOX",
  emailIntegrationEnabled: true,
  whatsappIntegrationEnabled: false
}
```

### 2. `conversations/{conversationId}/messages/{messageId}`

```typescript
// Document ID: Generated using timestamp + random
// Format: MSG-{YYYYMMDD}-{HHMMSS}-{XXXX}
// Example: MSG-20241215-143022-A1B2

{
  id: "MSG-20241215-143022-A1B2",
  conversationId: "CONV-QUOTE-PA-PAX-XSOX-OP-JETS-20241215-A1B2",
  
  // Content
  content: "The aircraft will be ready for departure at 2:00 PM. Please arrive 30 minutes early.",
  type: "text",
  attachments: [], // Optional file attachments
  
  // Sender
  senderId: "OP-JETS-FNLU",
  senderName: "Elite Jets",
  senderRole: "operator",
  senderAvatar: "https://...",
  
  // Status
  status: "sent",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Read receipts
  readBy: {
    "OP-JETS-FNLU": Timestamp, // Sender automatically marked as read
    "PA-PAX-XSOX": Timestamp   // When recipient read the message
  },
  
  // Context
  contextType: "quote",
  contextId: "QR-PA-PAX-XSOX-20241215-A1B2",
  metadata: {
    quoteId: "QT-OP-JETS-20241215-C3D4"
  },
  
  // External delivery tracking
  emailDelivery: {
    status: "delivered",
    sentAt: Timestamp,
    deliveredAt: Timestamp,
    messageId: "sendgrid-message-id-123"
  }
}
```

### 3. `conversations/{conversationId}/participants/{userCode}`

```typescript
// User-specific conversation settings
// Document ID: userCode (e.g., "PA-PAX-XSOX")

{
  conversationId: "CONV-QUOTE-PA-PAX-XSOX-OP-JETS-20241215-A1B2",
  userCode: "PA-PAX-XSOX",
  
  // Notification settings
  muteUntil: null, // Timestamp if muted
  emailNotifications: true,
  whatsappNotifications: false,
  pushNotifications: true,
  
  // Read status
  lastReadAt: Timestamp,
  unreadCount: 2,
  
  // Conversation-specific preferences
  isArchived: false,
  isPinned: false,
  customTitle: null,
  
  updatedAt: Timestamp
}
```

### 4. `conversationSummaries/{userCode}`

```typescript
// Denormalized conversation list for fast UI loading
// Document ID: userCode (e.g., "PA-PAX-XSOX")

{
  userCode: "PA-PAX-XSOX",
  conversations: [
    {
      id: "CONV-QUOTE-PA-PAX-XSOX-OP-JETS-20241215-A1B2",
      title: "Flight Quote Discussion - JFK to LAX",
      type: "quote_discussion",
      status: "active",
      otherParticipantName: "Elite Jets",
      otherParticipantAvatar: "https://...",
      lastMessage: {
        content: "What time should passengers arrive?",
        senderName: "John Smith",
        createdAt: Timestamp,
        type: "text"
      },
      unreadCount: 2,
      lastActivityAt: Timestamp,
      contextType: "quote",
      contextId: "QR-PA-PAX-XSOX-20241215-A1B2",
      priority: "normal"
    }
    // ... other conversations
  ],
  totalUnreadCount: 5,
  updatedAt: Timestamp
}
```

### 5. `externalMessages/{externalMessageId}`

```typescript
// Tracking for email/WhatsApp integration
// Document ID: Platform-specific ID format

{
  id: "email-sendgrid-msg-123456",
  conversationId: "CONV-QUOTE-PA-PAX-XSOX-OP-JETS-20241215-A1B2",
  platform: "email",
  direction: "inbound",
  
  externalId: "sendgrid-msg-123456",
  fromAddress: "john.smith@example.com",
  toAddress: "messages+conv-quote-pa-pax-xsox-op-jets-20241215-a1b2@chartermarket.app",
  
  subject: "Re: Flight Quote Discussion - JFK to LAX",
  content: "That time works perfectly. Thank you!",
  
  receivedAt: Timestamp,
  processedAt: Timestamp,
  linkedMessageId: "MSG-20241215-144500-B2C3",
  
  metadata: {
    emailHeaders: {
      "Message-ID": "<original-message-id>",
      "In-Reply-To": "<previous-message-id>",
      "References": "<thread-references>"
    }
  }
}
```

## Indexing Strategy

### Required Composite Indexes

```javascript
// 1. Conversations by participant and activity
{
  collection: "conversations",
  fields: [
    { field: "participantUserCodes", arrayConfig: "contains" },
    { field: "lastActivityAt", order: "desc" }
  ]
}

// 2. Messages by conversation and timestamp
{
  collection: "conversations/{conversationId}/messages",
  fields: [
    { field: "conversationId", order: "asc" },
    { field: "createdAt", order: "desc" }
  ]
}

// 3. Conversations by context
{
  collection: "conversations",
  fields: [
    { field: "contextType", order: "asc" },
    { field: "contextId", order: "asc" },
    { field: "lastActivityAt", order: "desc" }
  ]
}

// 4. Unread conversations for users
{
  collection: "conversations",
  fields: [
    { field: "participantUserCodes", arrayConfig: "contains" },
    { field: "status", order: "asc" },
    { field: "lastActivityAt", order: "desc" }
  ]
}
```

## Performance Optimizations

### 1. **Denormalization Strategy**
- `lastMessage` stored in conversation document for list views
- `unreadCounts` stored in conversation document for real-time updates
- `conversationSummaries` collection for fast user conversation lists

### 2. **Pagination**
- Messages paginated using `createdAt` timestamp
- Conversation lists paginated using `lastActivityAt`
- Cursor-based pagination for better performance

### 3. **Real-time Listeners**
- Separate listeners for conversation list vs. message thread
- Efficient listener setup/teardown on component mount/unmount
- Batched updates for better performance

### 4. **Caching Strategy**
- Recent conversations cached in memory
- Message threads cached with TTL
- Attachment URLs cached with Firebase Storage integration

## Security Considerations

### 1. **Access Control**
- Users can only access conversations they're participants in
- Messages inherit conversation permissions
- Admin override for support conversations

### 2. **Data Validation**
- Message content length limits
- File upload size and type restrictions
- Rate limiting for message sending

### 3. **Privacy**
- Soft delete for messages (mark as deleted, don't remove)
- GDPR compliance for user data export/deletion
- Encrypted attachment storage in Firebase Storage

## Integration Points

### 1. **Quote/Booking Context**
- Automatic conversation creation when quote is submitted
- System messages for status updates
- Deep linking from conversations to related entities

### 2. **Email Integration**
- Unique email addresses per conversation
- Email parsing and message extraction
- Thread preservation with email headers

### 3. **WhatsApp Integration**
- WhatsApp Business API webhook integration
- Message synchronization with conversation threads
- Rich media support (images, documents)

### 4. **Mobile App Sync**
- Real-time synchronization with React Native app
- Offline message queuing
- Push notification integration 