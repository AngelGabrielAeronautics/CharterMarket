export type UserRole = 'passenger' | 'operator' | 'agent' | 'admin';

export function generateUserCode(role: UserRole, lastName: string, company: string): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  if (role === 'passenger') {
    const segment = lastName ? lastName.substring(0, 4).toUpperCase() : 'PASS';
    return `PA-${segment}-${random}`;
  }
  if (role === 'operator') {
    return `OP-${company.substring(0, 4).toUpperCase()}-${random}`;
  }
  if (role === 'agent') {
    return `AG-${company.substring(0, 4).toUpperCase()}-${random}`;
  }
  if (role === 'admin') {
    const segment = lastName ? lastName.substring(0, 4).toUpperCase() : 'ADMN';
    return `AD-${segment}-${random}`;
  }
  throw new Error('Invalid user role');
}

export function parseUserCode(userCode: string) {
  const [type, segment, unique] = userCode.split('-');
  return { type, segment, unique };
}

export function isValidUserCode(userCode: string): boolean {
  return /^[A-Z]{2}-([A-Z]{4})-[A-Z0-9]{4}$/.test(userCode);
} 