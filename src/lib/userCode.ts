import { nanoid, customAlphabet } from 'nanoid';

/**
 * Valid user roles in the system
 */
export type UserRole = 'passenger' | 'operator' | 'agent' | 'admin' | 'superAdmin';

/**
 * Parameters for generating a user code
 */
interface GenerateUserCodeParams {
  /** The user's role in the system */
  role: UserRole;
  /** The user's last name (used for passenger and admin codes) */
  lastName: string;
  /** The company name (used for operator and agent codes) */
  company?: string;
}

/**
 * Generates a unique user code based on role and user information
 * Format: XX-YYYY-ZZZZ where:
 * - XX is the role prefix (PA, OP, AG, AD)
 * - YYYY is 4 characters from lastName or company
 * - ZZZZ is a random string
 */
export function generateUserCode({ role, lastName, company }: GenerateUserCodeParams): string {
  const prefix = getRolePrefix(role);
  const identifier = role === 'operator' || role === 'agent' 
    ? (company || 'UNKNOWN').toUpperCase().replace(/\s+/g, '').slice(0, 4)
    : lastName.toUpperCase().replace(/\s+/g, '').slice(0, 4);
  // Define an alphanumeric alphabet for nanoid
  const alphanumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const customNanoid = customAlphabet(alphanumeric, 4);
  const randomSuffix = customNanoid().toUpperCase(); // Ensure uppercase, though alphabet is already uppercase
  
  return `${prefix}-${identifier}-${randomSuffix}`;
}

/**
 * Gets the two-letter prefix for a given user role
 */
function getRolePrefix(role: UserRole): string {
  switch (role) {
    case 'passenger':
      return 'PA';
    case 'operator':
      return 'OP';
    case 'agent':
      return 'AG';
    case 'admin':
      return 'AD';
    default:
      throw new Error(`Invalid role: ${role}`);
  }
}

/**
 * Validates a user code string against the expected format
 * Valid format: XX-YYYY-ZZZZ where:
 * - XX is one of: PA, OP, AG, AD
 * - YYYY is exactly 4 uppercase characters
 * - ZZZZ is exactly 4 uppercase alphanumeric characters
 */
export function validateUserCode(code: string): boolean {
  const parts = code.split('-');
  if (parts.length !== 3) return false;

  const [prefix, identifier, suffix] = parts;
  
  // Validate prefix
  if (!['PA', 'OP', 'AG', 'AD'].includes(prefix)) return false;
  
  // Validate identifier (4 characters)
  if (identifier.length !== 4) return false;
  
  // Validate suffix (4 uppercase alphanumeric characters)
  if (suffix.length !== 4 || !/^[A-Z0-9]{4}$/.test(suffix)) return false;
  
  return true;
}

/**
 * Parses a user code into its component parts
 */
export function parseUserCode(code: string): { prefix: string; identifier: string; suffix: string } {
  const [prefix, identifier, suffix] = code.split('-');
  return { prefix, identifier, suffix };
}

export interface AdminPermissions {
  userManagement: boolean;
  bookingManagement: boolean;
  financialAccess: boolean;
  systemConfig: boolean;
  contentManagement: boolean;
}

export interface AdminInvitation {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  permissions?: AdminPermissions;
  expiresAt: Date;
} 