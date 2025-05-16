/**
 * Environment variable validation
 * 
 * This file centralizes environment variable validation to ensure
 * all required variables are present before the application starts.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_APP_URL',
  'SENDGRID_API_KEY',
  'SENDGRID_WELCOME_TEMPLATE_ID',
  'SENDGRID_VERIFICATION_TEMPLATE_ID',
];

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variables are missing
 */
export function validateEnv(): void {
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );
  
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
}

/**
 * Gets an environment variable and ensures it exists
 * @param key - The environment variable key
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if the environment variable is not set and no default is provided
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Safely gets a public environment variable (NEXT_PUBLIC_*)
 * These are safe to use in browser code
 * @param key - The environment variable key (without NEXT_PUBLIC_ prefix)
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 */
export function getPublicEnvVar(key: string, defaultValue?: string): string {
  return getEnvVar(`NEXT_PUBLIC_${key}`, defaultValue);
} 