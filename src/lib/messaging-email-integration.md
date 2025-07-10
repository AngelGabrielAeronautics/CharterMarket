# Email Integration for Charter Messaging System

## Overview

The Charter messaging system now includes comprehensive email integration that automatically sends email notifications to users when they receive messages or when conversations are started. This system integrates seamlessly with the existing SendGrid email infrastructure and provides users with customizable notification preferences.

## Features

### ✅ Implemented Features

1. **Real-time Email Notifications**
   - Instant email alerts when users receive new messages
   - Context-aware notifications for quote and booking discussions
   - Rich HTML email templates with Charter branding

2. **Conversation Started Notifications**
   - Welcome emails when someone starts a new conversation
   - Context information about related quotes or bookings
   - Professional email templates with call-to-action buttons

3. **Message Digest Emails**
   - Hourly and daily digest options for unread messages
   - Summary of all active conversations with unread counts
   - Batch processing to reduce email volume

4. **Email Tracking & Analytics**
   - Integration with existing email notification tracking system
   - Success/failure tracking for all sent emails
   - Detailed logging for troubleshooting

5. **User Preference Management**
   - Per-user email notification preferences
   - Frequency options: immediate, hourly, daily, never
   - Seamless integration with user profile settings

## Technical Architecture

### Core Files

1. **`src/lib/messaging-email.ts`**
   - Main email integration functions
   - User preference management
   - Email notification triggers

2. **Email API Endpoints**
   - `/api/email/message-notification` - New message notifications
   - `/api/email/conversation-started` - Conversation started emails
   - `/api/email/message-digest` - Hourly/daily digest emails

3. **Integration Points**
   - `src/lib/messaging.ts` - Triggers email notifications when messages are sent
   - `src/lib/email.ts` - Extended with messaging notification types

### Email Templates

All email templates include:
- Charter branding and consistent styling
- Context-aware content (quotes, bookings, general)
- Direct links back to conversations in the web app
- Mobile-responsive design
- Plain text fallback versions

#### Message Notification Email
- Shows sender information and message preview
- Includes conversation context (quote/booking details)
- Unread message count indicators
- Direct link to conversation

#### Conversation Started Email
- Welcomes participants to new conversations
- Explains benefits of Charter messaging
- Context about related business processes
- Call-to-action to join the conversation

#### Message Digest Email
- Summary statistics (unread count, active conversations)
- Preview of recent conversations
- Pro tips for effective communication
- Batch delivery to reduce inbox clutter

## Configuration

### Environment Variables

The system uses existing SendGrid configuration:
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - Sender email address
- `NEXT_PUBLIC_APP_URL` - App URL for links in emails

### User Preferences

Users can configure:
- **Email Notifications**: Enable/disable all message emails
- **Frequency**: 
  - `immediate` - Real-time notifications for each message
  - `hourly` - Hourly digest of unread messages
  - `daily` - Daily summary of unread messages
  - `never` - No email notifications

Default settings: Email notifications enabled with immediate frequency.

## Email Notification Flow

### New Message Flow
1. User sends message via web/mobile app
2. Message is saved to Firestore
3. `sendMessage()` function triggers email notification
4. System checks recipient email preferences
5. If enabled, email is sent via SendGrid API
6. Email delivery is tracked in notification system

### Conversation Started Flow
1. User creates new conversation
2. Conversation is saved to Firestore
3. `createConversation()` function triggers email notification
4. System sends welcome email to all participants (except creator)
5. Email delivery is tracked

### Message Digest Flow
1. Scheduled job (hourly/daily) processes users
2. System checks each user's unread message count
3. If unread messages exist and user preferences allow
4. Digest email is generated and sent
5. Email delivery is tracked

## Integration with Existing Systems

### SendGrid Integration
- Uses existing SendGrid client configuration
- Follows established email sending patterns
- Integrates with email notification tracking system

### Authentication System
- Reads user preferences from Firestore user documents
- Uses existing user codes and profile data
- Respects user email verification status

### Messaging System
- Non-blocking email sending (doesn't slow down messaging)
- Async email delivery with error handling
- Fallback to in-app notifications if email fails

## Email Preference Management

### Storage
User email preferences are stored in the user's Firestore document:
```javascript
{
  emailNotifications: boolean,
  messageEmailFrequency: 'immediate' | 'hourly' | 'daily' | 'never'
}
```

### API Functions
- `getEmailNotificationPreferences(userCode)` - Get current preferences
- `updateEmailNotificationPreferences(userCode, preferences)` - Update preferences

### Default Behavior
- New users: Email notifications enabled with immediate frequency
- Existing users: Defaults to enabled with immediate frequency
- Graceful fallback if preferences not found

## Error Handling & Reliability

### Email Delivery Failures
- Non-blocking: Message sending continues even if email fails
- Comprehensive error logging
- Failed email attempts tracked in notification system
- Automatic retry logic can be added to SendGrid webhook handling

### User Data Issues
- Graceful handling of missing user profiles
- Fallback to basic user information from Firebase Auth
- Skip email notifications for users without email addresses

### System Resilience
- Email sending doesn't block core messaging functionality
- Async processing prevents performance impact
- Comprehensive error logging for troubleshooting

## Future Enhancements

### Potential Additions
1. **Email Reply Integration**
   - Allow users to reply to emails and post to conversations
   - Email parsing and security validation
   - Integration with SendGrid inbound email handling

2. **Advanced Scheduling**
   - Quiet hours (no emails during night time)
   - Timezone-aware digest delivery
   - Business hours only options

3. **Enhanced Templates**
   - Industry-specific email templates
   - Operator vs client customized content
   - Multi-language support

4. **Analytics Dashboard**
   - Email open rates and click tracking
   - User engagement metrics
   - Email preference analytics

## Usage Examples

### Basic Email Notification
```javascript
// Automatically triggered when message is sent
const messageId = await sendMessage(conversationId, messageData, senderUserCode);
// Email notification is sent automatically in background
```

### Managing User Preferences
```javascript
// Get current preferences
const preferences = await getEmailNotificationPreferences(userCode);

// Update preferences
await updateEmailNotificationPreferences(userCode, {
  emailNotifications: true,
  messageEmailFrequency: 'daily'
});
```

### Manual Digest Sending
```javascript
// Send hourly digest for a user
await sendMessageDigestEmail(userCode, 'hourly');
```

## Testing

### Email Testing
- Development mode: Emails are sent when `ENABLE_DEV_EMAILS=true`
- Production mode: All emails are sent automatically
- Test emails can be triggered via debug API endpoints

### Integration Testing
- Message sending with email notifications
- User preference updates
- Email template rendering
- Error handling scenarios

## Security Considerations

### Data Protection
- Email content is limited to message previews (200 characters max)
- No sensitive business data included in emails
- Links include conversation IDs but require authentication

### Spam Prevention
- Respect user preferences and unsubscribe options
- Rate limiting on digest emails
- Integration with SendGrid's deliverability features

### Authentication
- All conversation links require user login
- Email addresses validated against user profiles
- No sensitive data in email URLs

---

## Summary

The email integration provides a comprehensive solution for keeping Charter users informed about their conversations via email. It respects user preferences, integrates seamlessly with the existing infrastructure, and provides rich, branded email experiences that drive engagement with the Charter platform.

The system is designed to be reliable, scalable, and maintainable while providing an excellent user experience across web, mobile, and email channels. 