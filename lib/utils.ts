import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { UserRole } from '@/types/user';

const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateUserCode = async (role: UserRole, lastName: string, company: string): Promise<string> => {
  try {
    // Generate random string for the last part
    const randomPart = generateRandomString(5);
    
    // Get prefix based on role
    let prefix = '';
    let middlePart = '';
    
    switch (role) {
      case 'passenger':
        prefix = 'PA';
        middlePart = lastName ? lastName.substring(0, 4).toUpperCase() : 'USER';
        break;
      case 'operator':
        prefix = 'OP';
        middlePart = company ? company.substring(0, 4).toUpperCase() : 'COMP';
        break;
      case 'agent':
        prefix = 'AG';
        middlePart = company ? company.substring(0, 4).toUpperCase() : 'AGNT';
        break;
      case 'admin':
        prefix = 'AD';
        middlePart = lastName ? lastName.substring(0, 4).toUpperCase() : 'ADMN';
        break;
      default:
        prefix = 'UN';
        middlePart = lastName ? lastName.substring(0, 4).toUpperCase() : 'USER';
    }
    
    // Format: PREFIX/MIDDLE/RANDOM
    const userCode = `${prefix}-${middlePart}-${randomPart}`;
    
    // Check if this code already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userCode', '==', userCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // If code exists, generate a new one recursively
      return generateUserCode(role, lastName, company);
    }
    
    return userCode;
  } catch (error) {
    console.error('Error generating user code:', error);
    // Fallback format: UN/TIMESTAMP/RANDOM
    const timestamp = Date.now().toString(36);
    const randomStr = generateRandomString(5);
    return `UN-${timestamp}-${randomStr}`;
  }
};

/**
 * Generates a unique identifier with the given prefix and middle part
 * Format: PREFIX-MIDDLE-RANDOM
 */
export function generateUniqueId(prefix: string, middlePart: string): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const userCode = `${prefix}-${middlePart}-${randomPart}`;
  return userCode;
}

/**
 * Generates a fallback unique identifier when normal generation fails
 * Format: UN-TIMESTAMP-RANDOM
 */
export function generateFallbackId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `UN-${timestamp}-${random}`;
}

/**
 * Generates an email document ID
 * Format: USERCODE-email-NUMBER
 */
export function generateEmailDocId(userCode: string, number: number = 1): string {
  const formattedNumber = number.toString().padStart(5, '0');
  return `${userCode}-email-${formattedNumber}`;
} 