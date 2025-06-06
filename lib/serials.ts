/**
 * Serial/ID generation for various entities in the system
 *
 * Format examples:
 * - Quotes:    QT-OPERATORCODE-YYYYMMDD-XXXX
 * - Invoices:  INV-FLIGHTCODE-YYYYMMDD-XXXXXXXXX
 * - Flights:   FLT-OPERATORCODE-YYYYMMDD-XXXX
 * - Aircraft:  AC-OPERATORCODE-XXXX (OPCODE = operator code, XXXX = random)
 * - Documents: DOC-userCode-XXXX (ENTITY = user/flight/aircraft/quote/invoice, XXXX = random)
 * - Passenger Record: PAX-AGENTCODE-XXXX (for passengers added by an agent/broker account)
 * - Passenger Record: PAX-userCode-XXXX (for passengers added by a passenger account)
 * - Agent/Broker Client: CL-AGENTCODE-XXXX (for clients of an agent/broker)
 */

/**
 * Generates a random alphanumeric string of specified length
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats a date as YYYYMMDD
 */
function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Generates a quote ID
 * @param operatorCode The operator's code
 * @param requestId Optional request ID to extract the last 4 characters from for linking
 * @returns Quote ID in format QT-OPERATORCODE-YYYYMMDD-XXXX
 */
export function generateQuoteId(operatorCode: string, requestId?: string): string {
  const date = formatDateYYYYMMDD(new Date());

  // If requestId is provided, use its last 4 characters; otherwise generate random
  const suffix = requestId ? requestId.slice(-4) : generateRandomString(4);

  return `QT-${operatorCode}-${date}-${suffix}`;
}

/**
 * Generates an invoice ID
 * @param flightCode The flight code this invoice is for
 * @returns Invoice ID in format INV-FLIGHTCODE-YYYYMMDD-XXXXXXXX
 */
export function generateInvoiceId(flightCode: string): string {
  const date = formatDateYYYYMMDD(new Date());
  const random = generateRandomString(8);
  return `INV-${flightCode}-${date}-${random}`;
}

/**
 * Generates a flight ID
 * @param operatorCode The operator's code
 * @returns Flight ID in format FLT-OPERATORCODE-YYYYMMDD-XXXX
 */
export function generateFlightId(operatorCode: string): string {
  const date = formatDateYYYYMMDD(new Date());
  const random = generateRandomString(4);
  return `FLT-${operatorCode}-${date}-${random}`;
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
 * Generates a passenger record ID for an agent
 * @param agentCode The agent's code
 * @returns Passenger record ID in format PAX-AGENTCODE-XXXX
 */
export function generatePassengerRecordIdForAgent(agentCode: string): string {
  const random = generateRandomString(4);
  return `PAX-${agentCode}-${random}`;
}

/**
 * Generates a passenger record ID for a passenger
 * @param userCode The passenger's code
 * @returns Passenger record ID in format PAX-userCode-XXXX
 */
export function generatePassengerRecordIdForUser(userCode: string): string {
  const random = generateRandomString(4);
  return `PAX-${userCode}-${random}`;
}

/**
 * Generates a client ID for an agent/broker
 * @param agentCode The agent's code
 * @returns Client ID in format CL-AGENTCODE-XXXX
 */
export function generateClientId(agentCode: string): string {
  const random = generateRandomString(4);
  return `CL-${agentCode}-${random}`;
}

// --- Validation and Parsing Functions ---

// Quote ID: QT-OPERATORCODE-YYYYMMDD-XXXX
export function isValidQuoteId(id: string): boolean {
  return /^QT-[A-Z0-9]+-\d{8}-[A-Z0-9]{4}$/.test(id);
}
export function parseQuoteId(id: string) {
  const [, operatorCode, date, unique] = id.split('-');
  return { operatorCode, date, unique };
}

// Invoice ID: INV-FLIGHTCODE-YYYYMMDD-XXXXXXXX
export function isValidInvoiceId(id: string): boolean {
  return /^INV-[A-Z0-9]+-\d{8}-[A-Z0-9]{8}$/.test(id);
}
export function parseInvoiceId(id: string) {
  const [, flightCode, date, unique] = id.split('-');
  return { flightCode, date, unique };
}

// Flight ID: FLT-OPERATORCODE-YYYYMMDD-XXXX
export function isValidFlightId(id: string): boolean {
  return /^FLT-[A-Z0-9]+-\d{8}-[A-Z0-9]{4}$/.test(id);
}
export function parseFlightId(id: string) {
  const [, operatorCode, date, unique] = id.split('-');
  return { operatorCode, date, unique };
}

// Aircraft ID: AC-OPERATORCODE-XXXX
export function isValidAircraftId(id: string): boolean {
  return /^AC-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id);
}
export function parseAircraftId(id: string) {
  const [, operatorCode, unique] = id.split('-');
  return { operatorCode, unique };
}

// Document ID: DOC-userCode-XXXX
export function isValidDocumentId(id: string): boolean {
  return /^DOC-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id);
}
export function parseDocumentId(id: string) {
  const [, userCode, unique] = id.split('-');
  return { userCode, unique };
}

// Passenger Record by Agent: PAX-AGENTCODE-XXXX
export function isValidPassengerRecordIdByAgent(id: string): boolean {
  return /^PAX-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id);
}
export function parsePassengerRecordIdByAgent(id: string) {
  const [, agentCode, unique] = id.split('-');
  return { agentCode, unique };
}

// Passenger Record by Passenger: PAX-userCode-XXXX
export function isValidPassengerRecordIdByPassenger(id: string): boolean {
  return /^PAX-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id);
}
export function parsePassengerRecordIdByPassenger(id: string) {
  const [, userCode, unique] = id.split('-');
  return { userCode, unique };
}

// Client ID: CL-AGENTCODE-XXXX
export function isValidClientId(id: string): boolean {
  return /^CL-[A-Z0-9]+-[A-Z0-9]{4}$/.test(id);
}
export function parseClientId(id: string) {
  const [, agentCode, unique] = id.split('-');
  return { agentCode, unique };
}
