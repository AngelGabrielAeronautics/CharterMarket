'use client';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthCheckerProps {
  password: string;
  isVisible: boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'At least 6 characters',
    test: (password) => password.length >= 6,
  },
  {
    label: 'At least 1 letter',
    test: (password) => /[a-z]/i.test(password),
  },
  {
    label: 'At least 1 uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'At least 1 special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export default function PasswordStrengthChecker({ password, isVisible }: PasswordStrengthCheckerProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Password Requirements:
      </h4>
      <ul className="space-y-1">
        {passwordRequirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <li
              key={index}
              className="flex items-center text-sm"
            >
              <span className={`mr-2 ${isMet ? 'text-green-500' : 'text-gray-400'}`}>
                {isMet ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <span className={`${isMet ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function validatePassword(password: string): boolean {
  return passwordRequirements.every(requirement => requirement.test(password));
} 