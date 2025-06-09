import { nanoid, customAlphabet } from 'nanoid';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  getCountFromServer,
} from 'firebase/firestore';

// Numeric-only nanoid for 4-digit e-ticket suffix
const numericNanoSuffix = customAlphabet('0123456789', 4);

/**
 * Generates a quote ID
 * @param operatorCode The operator's code
 * @param requestId Optional request ID to extract the last 4 characters from for linking
 * @returns Quote ID in format QT-OPERATORCODE-YYYYMMDD-XXXX
 */
export function generateQuoteId(operatorCode: string, requestId?: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // If requestId is provided, use its last 4 characters; otherwise generate random
  const suffix = requestId ? requestId.slice(-4) : generateRandomString(4);

  return `QT-${operatorCode}-${dateStr}-${suffix}`;
}

/**
 * Generates an invoice ID
 * @param offerId The offer/quote ID this invoice is for
 * @returns Invoice ID in format INV-{offerId}-{4 random alphanumeric}
 */
export function generateInvoiceId(offerId: string): string {
  const random = generateRandomString(4);
  return `INV-${offerId}-${random}`;
}

/**
 * Legacy invoice ID generator (for backward compatibility)
 * @deprecated Use generateInvoiceId(offerId) instead
 */
export function generateLegacyInvoiceId(flightCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(8);
  return `INV-${flightCode}-${dateStr}-${random}`;
}

/**
 * Generates a quote request code
 * @param userCode The user's code
 * @returns Quote request code in format QR-USERCODE-YYYYMMDD-XXXX
 */
export function generateQuoteRequestCode(userCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(4);
  return `QR-${userCode}-${dateStr}-${random}`;
}

/**
 * Generates an aircraft ID
 * @param operatorCode The operator's code
 * @returns Aircraft ID in format AC-OPERATORCODE-XXXX
 */
export function generateAircraftId(operatorCode: string): string {
  const random = generateRandomString(4);
  return `AC-${operatorCode}-${random}`;
}

/**
 * Generates a document ID
 * @param userCode The user's code
 * @returns Document ID in format DOC-userCode-XXXX
 */
export function generateDocumentId(userCode: string): string {
  const random = generateRandomString(4);
  return `DOC-${userCode}-${random}`;
}

/**
 * Generates a passenger ID
 * @param agentCode The agent's code or user code
 * @returns Passenger ID in format PAX-AGENTCODE-XXXX or PAX-userCode-XXXX
 */
export function generatePassengerId(agentCode: string): string {
  const random = generateRandomString(4);
  return `PAX-${agentCode}-${random}`;
}

/**
 * Generates a client ID
 * @param agentCode The agent's code
 * @returns Client ID in format CL-AGENTCODE-XXXX
 */
export function generateClientId(agentCode: string): string {
  const random = generateRandomString(4);
  return `CL-${agentCode}-${random}`;
}

/**
 * Generates a random string of specified length
 * @param length Length of the random string
 * @returns Random string of uppercase letters and numbers
 */
function generateRandomString(length: number): string {
  // Generate an alphanumeric-only string (uppercase letters and digits)
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nano = customAlphabet(alphabet, length);
  return nano();
}

/**
 * Validates an ID format
 * @param id The ID to validate
 * @param prefix The expected prefix (e.g., 'AC', 'FLT')
 * @param pattern The expected pattern after the prefix
 * @returns boolean indicating if the ID is valid
 */
export function validateId(id: string, prefix: string, pattern: RegExp): boolean {
  const prefixPattern = new RegExp(`^${prefix}-`);
  return prefixPattern.test(id) && pattern.test(id.slice(prefix.length + 1));
}

// ID validation patterns
export const patterns = {
  aircraft: /^[A-Z0-9]+-[A-Z0-9]{4}$/,
  flight: /^[A-Z0-9]+-\d{8}-[A-Z0-9]{4}$/,
  quote: /^[A-Z0-9]+-\d{8}-[A-Z0-9]{4}$/,
  invoice: /^[A-Z0-9]+-\d{8}-[A-Z0-9]{8}$/,
  payment: /^PMT-\d{8}-INV-[A-Z0-9]+-\d{8}-[A-Z0-9]{4}-[A-Z0-9]{2}$/,
  document: /^[A-Z0-9]+-[A-Z0-9]{4}$/,
  passenger: /^[A-Z0-9]+-[A-Z0-9]{4}$/,
  client: /^[A-Z0-9]+-[A-Z0-9]{4}$/,
  booking: /^[A-Z0-9]+-\d{8}-[A-Z0-9]{4}$/,
};

// Add Booking ID generator
export function generateBookingId(operatorCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(4);
  return `BK-${operatorCode}-${dateStr}-${random}`;
}

// For backward compatibility
export const generateFlightRequestCode = generateQuoteRequestCode;

/**
 * Generates a payment ID linked to an invoice
 * @param invoiceId The invoice ID this payment is for
 * @returns Payment ID in format PMT-{YYYYMMDD}-{invoiceId}-{XX}
 * @example PMT-20241201-INV-QT-OP001-20241201-ABC1-AB12-A1
 */
export function generatePaymentId(invoiceId: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(2); // 2 random alphanumeric characters
  return `PMT-${dateStr}-${invoiceId}-${random}`;
}

/**
 * Legacy payment ID generator (for backward compatibility)
 * @deprecated Use generatePaymentId(invoiceId) instead
 */
export function generateLegacyPaymentId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(6);
  return `PMT-${dateStr}-${random}`;
}

/**
 * Generates an e-ticket number in format ETKT-{bookingId}-{4 random digits}
 */
export function generateETicketNumber(bookingId: string, _passengerId?: string): string {
  const randomSuffix = numericNanoSuffix();
  return `ETKT-${bookingId}-${randomSuffix}`;
}

/**
 * Generates a flight ID grouping for multiple bookings
 * Format: FLT-{operatorUserCode}-{YYYYMMDD}-{4 random alphanumeric}
 */
export function generateFlightId(operatorUserCode: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(4);
  return `FLT-${operatorUserCode}-${dateStr}-${random}`;
}
