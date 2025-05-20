import { nanoid } from 'nanoid';

/**
 * Generates a quote ID
 * @param operatorCode The operator's code
 * @returns Quote ID in format QT-OPERATORCODE-YYYYMMDD-XXXX
 */
export function generateQuoteId(operatorCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(4);
  return `QT-${operatorCode}-${dateStr}-${random}`;
}

/**
 * Generates an invoice ID
 * @param flightCode The flight code
 * @returns Invoice ID in format INV-FLIGHTCODE-YYYYMMDD-XXXXXXXX
 */
export function generateInvoiceId(flightCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(8);
  return `INV-${flightCode}-${dateStr}-${random}`;
}

/**
 * Generates a flight ID
 * @param operatorCode The operator's code
 * @returns Flight ID in format FLT-OPERATORCODE-YYYYMMDD-XXXX
 */
export function generateFlightId(operatorCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(4);
  return `FLT-${operatorCode}-${dateStr}-${random}`;
}

/**
 * Generates a quote request code
 * @param userCode The user's code
 * @returns Quote request code in format RQ-USERCODE-YYYYMMDD-XXXX
 */
export function generateQuoteRequestCode(userCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(4);
  return `RQ-${userCode}-${dateStr}-${random}`;
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
  return nanoid(length).toUpperCase();
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

// Add Payment ID generator
export function generatePaymentId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = generateRandomString(6);
  return `PMT-${dateStr}-${random}`;
}
