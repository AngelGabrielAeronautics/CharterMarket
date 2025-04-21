import { nanoid } from 'nanoid';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type UserRole = 'passenger' | 'operator' | 'agent' | 'admin';

interface GenerateUserCodeParams {
  role: UserRole;
  lastName: string;
  company?: string;
}

export const generateUserCode = ({ role, lastName, company }: GenerateUserCodeParams): string => {
  const prefix = getRolePrefix(role);
  const identifier = role === 'operator' || role === 'agent' 
    ? (company || 'UNKNOWN').toUpperCase().replace(/\s+/g, '').slice(0, 4)
    : lastName.toUpperCase().replace(/\s+/g, '').slice(0, 4);
  const randomSuffix = nanoid(4).toUpperCase();
  
  return `${prefix}-${identifier}-${randomSuffix}`;
};

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 