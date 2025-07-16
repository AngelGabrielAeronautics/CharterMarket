export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  category: EmailTemplateCategory;
  description: string;
  variables: EmailTemplateVariable[];
  lastModified: Date;
  isActive: boolean;
}

export interface EmailTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  example: string;
}

export type EmailTemplateCategory = 
  | 'auth' 
  | 'notification' 
  | 'booking' 
  | 'admin' 
  | 'marketing';

export interface EmailTemplatePreview {
  template: EmailTemplate;
  sampleData: Record<string, any>;
  renderedHtml: string;
  renderedText: string;
}

// Email template configuration for system templates
export interface SystemEmailTemplate {
  id: string;
  name: string;
  description: string;
  filePath: string;
  variables: EmailTemplateVariable[];
  category: EmailTemplateCategory;
}

// Available email templates in the system
export const SYSTEM_EMAIL_TEMPLATES: SystemEmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent to new users after registration',
    filePath: 'src/emails/welcomeTemplate.ts',
    category: 'auth',
    variables: [
      { name: 'firstName', description: 'User\'s first name', required: true, example: 'John' },
      { name: 'email', description: 'User\'s email address', required: true, example: 'john@example.com' },
      { name: 'userCode', description: 'Unique user code', required: true, example: 'USR001' },
      { name: 'role', description: 'User role', required: true, example: 'passenger' },
      { name: 'company', description: 'Company name (optional)', required: false, example: 'ABC Corp' }
    ]
  },
  {
    id: 'verification',
    name: 'Email Verification',
    description: 'Email verification link for new accounts',
    filePath: 'src/app/api/email/verification/route.ts',
    category: 'auth',
    variables: [
      { name: 'email', description: 'User\'s email address', required: true, example: 'john@example.com' },
      { name: 'verificationLink', description: 'Verification URL', required: true, example: 'https://app.com/verify?token=xyz' }
    ]
  },
  {
    id: 'quote-confirmation',
    name: 'Quote Request Confirmation',
    description: 'Confirmation email when a quote request is submitted',
    filePath: 'src/app/api/email/quote-confirmation/route.ts',
    category: 'booking',
    variables: [
      { name: 'passengerFirstName', description: 'Passenger\'s first name', required: true, example: 'John' },
      { name: 'quoteRequestCode', description: 'Quote request reference', required: true, example: 'QR001' },
      { name: 'departureAirport', description: 'Departure airport code', required: true, example: 'LAX' },
      { name: 'arrivalAirport', description: 'Arrival airport code', required: true, example: 'JFK' },
      { name: 'formattedDepartureDate', description: 'Formatted departure date', required: true, example: 'March 15, 2024' },
      { name: 'passengerCount', description: 'Number of passengers', required: true, example: '4' },
      { name: 'tripType', description: 'Trip type', required: true, example: 'round-trip' }
    ]
  },
  {
    id: 'operator-quote-notification',
    name: 'Operator Quote Notification',
    description: 'Notification to operators about new quote requests',
    filePath: 'src/emails/operatorQuoteNotificationTemplate.ts',
    category: 'booking',
    variables: [
      { name: 'operatorFirstName', description: 'Operator\'s first name', required: true, example: 'Jane' },
      { name: 'quoteRequestCode', description: 'Quote request reference', required: true, example: 'QR001' },
      { name: 'departureAirport', description: 'Departure airport code', required: true, example: 'LAX' },
      { name: 'arrivalAirport', description: 'Arrival airport code', required: true, example: 'JFK' },
      { name: 'formattedDate', description: 'Formatted departure date', required: true, example: 'March 15, 2024' },
      { name: 'passengerCount', description: 'Number of passengers', required: true, example: '4' },
      { name: 'tripType', description: 'Trip type', required: true, example: 'round-trip' }
    ]
  },
  {
    id: 'conversation-started',
    name: 'Conversation Started',
    description: 'Notification when a new conversation is started',
    filePath: 'src/app/api/email/conversation-started/route.ts',
    category: 'notification',
    variables: [
      { name: 'initiatorName', description: 'Name of person starting conversation', required: true, example: 'John Doe' },
      { name: 'participantName', description: 'Name of conversation participant', required: true, example: 'Jane Smith' },
      { name: 'conversationTitle', description: 'Title of the conversation', required: true, example: 'Flight Discussion' },
      { name: 'initialMessage', description: 'Initial message content', required: false, example: 'Hello, I have a question...' }
    ]
  },
  {
    id: 'message-notification',
    name: 'Message Notification',
    description: 'Notification for new messages in conversations',
    filePath: 'src/app/api/email/message-notification/route.ts',
    category: 'notification',
    variables: [
      { name: 'senderName', description: 'Name of message sender', required: true, example: 'John Doe' },
      { name: 'recipientName', description: 'Name of message recipient', required: true, example: 'Jane Smith' },
      { name: 'messageContent', description: 'Message content', required: true, example: 'Hello, how are you?' },
      { name: 'conversationTitle', description: 'Conversation title', required: true, example: 'Flight Discussion' }
    ]
  },
  {
    id: 'message-digest',
    name: 'Message Digest',
    description: 'Daily/hourly summary of unread messages',
    filePath: 'src/app/api/email/message-digest/route.ts',
    category: 'notification',
    variables: [
      { name: 'userName', description: 'User\'s name', required: true, example: 'John Doe' },
      { name: 'period', description: 'Digest period', required: true, example: 'daily' },
      { name: 'totalUnreadCount', description: 'Total unread messages', required: true, example: '5' },
      { name: 'conversationCount', description: 'Number of conversations', required: true, example: '3' }
    ]
  },
  {
    id: 'registration-reminder',
    name: 'Registration Reminder',
    description: 'Reminder emails for incomplete registrations',
    filePath: 'src/app/api/email/registration-reminder/route.ts',
    category: 'marketing',
    variables: [
      { name: 'firstName', description: 'User\'s first name', required: true, example: 'John' },
      { name: 'role', description: 'User role', required: true, example: 'operator' },
      { name: 'reminderNumber', description: 'Reminder sequence number', required: true, example: '1' },
      { name: 'nextStep', description: 'Next step description', required: true, example: 'Complete your profile' }
    ]
  },
  {
    id: 'admin-notification',
    name: 'Admin Notification',
    description: 'Notification to admins about new user registrations',
    filePath: 'src/app/api/email/admin-notification/route.ts',
    category: 'admin',
    variables: [
      { name: 'newUserEmail', description: 'New user\'s email', required: true, example: 'john@example.com' },
      { name: 'newUserFirstName', description: 'New user\'s first name', required: true, example: 'John' },
      { name: 'newUserLastName', description: 'New user\'s last name', required: true, example: 'Doe' },
      { name: 'newUserRole', description: 'New user\'s role', required: true, example: 'passenger' },
      { name: 'newUserCode', description: 'New user\'s code', required: true, example: 'USR001' }
    ]
  },
  {
    id: 'admin-invitation',
    name: 'Admin Invitation',
    description: 'Invitation email for new admin users',
    filePath: 'src/app/api/email/admin-invitation/route.ts',
    category: 'admin',
    variables: [
      { name: 'firstName', description: 'Invitee\'s first name', required: true, example: 'John' },
      { name: 'invitationLink', description: 'Admin registration link', required: true, example: 'https://app.com/admin/register?invitation=xyz' },
      { name: 'expiryDays', description: 'Invitation expiry days', required: true, example: '7' }
    ]
  }
]; 