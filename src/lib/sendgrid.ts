import sgMail from '@sendgrid/mail';

// Initialize SendGrid client with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendGridClient = sgMail; 