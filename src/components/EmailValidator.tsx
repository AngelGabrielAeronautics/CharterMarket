'use client';

interface EmailValidatorProps {
  email: string;
  isVisible: boolean;
}

export function validateEmail(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

export default function EmailValidator({ email, isVisible }: EmailValidatorProps) {
  if (!isVisible || !email) return null;

  const isValid = validateEmail(email);

  return (
    <div className="mt-1 text-sm">
      {!isValid && (
        <p className="text-red-600 dark:text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Please enter a valid email address
        </p>
      )}
    </div>
  );
} 