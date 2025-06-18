import { z } from 'zod';

/**
 * Comprehensive Registration Form Validation Schema using Zod
 * 
 * Features:
 * - Email format validation
 * - Strong password requirements
 * - Optional profile fields with validation
 * - Custom error messages
 * - Type-safe validation
 */

// Custom password validation regex patterns
const PASSWORD_PATTERNS = {
  minLength: /.{8,}/,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  noCommonPatterns: /^(?!.*(?:123456|password|qwerty|abc123|admin|letmein|welcome|monkey|dragon))/i
};

// Phone number validation (supports multiple formats)
const PHONE_REGEX = /^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;

// Username validation (alphanumeric, underscores, hyphens, 3-30 chars)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Custom Zod refinements for password strength
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (password) => PASSWORD_PATTERNS.hasUppercase.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => PASSWORD_PATTERNS.hasLowercase.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => PASSWORD_PATTERNS.hasNumber.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => PASSWORD_PATTERNS.hasSpecialChar.test(password),
    'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
  )
  .refine(
    (password) => PASSWORD_PATTERNS.noCommonPatterns.test(password),
    'Password cannot contain common patterns (123456, password, qwerty, etc.)'
  );

// Age validation schema
const ageSchema = z
  .number()
  .int('Age must be a whole number')
  .min(13, 'You must be at least 13 years old to register')
  .max(120, 'Please enter a valid age')
  .optional();

// Date of birth validation (alternative to age)
const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
      return age - 1 >= 13;
    }
    return age >= 13;
  }, 'You must be at least 13 years old to register')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    return date <= new Date();
  }, 'Date of birth cannot be in the future')
  .optional();

// Main registration schema
export const registrationSchema = z
  .object({
    // Required fields
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(254, 'Email address is too long')
      .toLowerCase()
      .refine(
        (email) => !email.includes('+'),
        'Email addresses with + symbols are not allowed'
      ),

    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),

    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

    // Optional profile fields
    username: z
      .string()
      .regex(USERNAME_REGEX, 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
      .optional()
      .or(z.literal('')),

    phoneNumber: z
      .string()
      .regex(PHONE_REGEX, 'Please enter a valid phone number')
      .optional()
      .or(z.literal('')),

    age: ageSchema,

    dateOfBirth: dateOfBirthSchema,

    gender: z
      .enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'], {
        errorMap: () => ({ message: 'Please select a valid gender option' })
      })
      .optional(),

    bio: z
      .string()
      .max(500, 'Bio must be less than 500 characters')
      .optional()
      .or(z.literal('')),

    location: z
      .object({
        city: z
          .string()
          .max(100, 'City name must be less than 100 characters')
          .optional()
          .or(z.literal('')),
        state: z
          .string()
          .max(100, 'State name must be less than 100 characters')
          .optional()
          .or(z.literal('')),
        country: z
          .string()
          .max(100, 'Country name must be less than 100 characters')
          .optional()
          .or(z.literal('')),
        zipCode: z
          .string()
          .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (12345 or 12345-6789)')
          .optional()
          .or(z.literal(''))
      })
      .optional(),

    // Preferences
    preferences: z
      .object({
        newsletter: z.boolean().default(false),
        marketing: z.boolean().default(false),
        notifications: z.boolean().default(true),
        theme: z.enum(['light', 'dark', 'auto']).default('auto')
      })
      .optional(),

    // Terms and conditions
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, 'You must agree to the terms and conditions'),

    agreeToPrivacy: z
      .boolean()
      .refine((val) => val === true, 'You must agree to the privacy policy'),

    // Optional marketing consent
    marketingConsent: z.boolean().optional().default(false)
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  )
  .refine(
    (data) => {
      // Either age or dateOfBirth should be provided, but not both
      const hasAge = data.age !== undefined;
      const hasDob = data.dateOfBirth !== undefined && data.dateOfBirth !== '';
      
      if (hasAge && hasDob) {
        return false;
      }
      return true;
    },
    {
      message: 'Please provide either age or date of birth, not both',
      path: ['age']
    }
  );

// Type inference from schema
export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Note: Step schemas can be created using registrationSchema.pick() if needed
// For now, we'll use the full schema for validation

// Helper function to validate registration data
export const validateRegistration = (data: unknown) => {
  return registrationSchema.safeParse(data);
};

// Helper function to get password strength score
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (PASSWORD_PATTERNS.hasUppercase.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (PASSWORD_PATTERNS.hasLowercase.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (PASSWORD_PATTERNS.hasNumber.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (PASSWORD_PATTERNS.hasSpecialChar.test(password)) score += 1;
  else feedback.push('Add special characters');

  if (PASSWORD_PATTERNS.noCommonPatterns.test(password)) score += 1;
  else feedback.push('Avoid common patterns');

  return {
    score,
    feedback,
    isStrong: score >= 5
  };
};
