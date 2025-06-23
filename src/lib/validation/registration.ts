import { z } from 'zod';

// Password strength calculation
export function getPasswordStrength(password: string) {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, feedback: ['Password is required'], isStrong: false };
  }

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Uppercase letter check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  // Length bonus
  if (password.length >= 12) {
    score += 1;
  }

  const isStrong = score >= 5;

  return {
    score,
    feedback,
    isStrong
  };
}

// Registration schema
export const registrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long')
    .toLowerCase()
    .refine(
      (email) => !email.includes('+'),
      'Email addresses with + symbols are not allowed'
    ),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .refine(
      (password) => /[A-Z]/.test(password),
      'Password must contain at least one uppercase letter'
    )
    .refine(
      (password) => /[a-z]/.test(password),
      'Password must contain at least one lowercase letter'
    )
    .refine(
      (password) => /\d/.test(password),
      'Password must contain at least one number'
    )
    .refine(
      (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      'Password must contain at least one special character'
    ),
  
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  username: z
    .string()
    .optional()
    .refine(
      (username) => !username || (username.length >= 3 && username.length <= 30),
      'Username must be between 3 and 30 characters'
    )
    .refine(
      (username) => !username || /^[a-zA-Z0-9_-]+$/.test(username),
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (phone) => !phone || /^\(\d{3}\) \d{3}-\d{4}$/.test(phone),
      'Phone number must be in format (555) 123-4567'
    ),
  
  age: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => val ? Number(val) : undefined)
    .refine(
      (age) => !age || (age >= 13 && age <= 120),
      'Age must be between 13 and 120'
    ),
  
  gender: z
    .enum(['male', 'female', 'other', 'prefer-not-to-say', ''])
    .optional()
    .transform((val) => val === '' ? undefined : val),
  
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Terms of Service'),
  
  agreeToPrivacy: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Privacy Policy')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
);

// Individual field validation schemas for real-time validation
export const emailSchema = registrationSchema.pick({ email: true });
export const passwordSchema = registrationSchema.pick({ password: true });
export const nameSchema = registrationSchema.pick({ firstName: true, lastName: true });
export const usernameSchema = registrationSchema.pick({ username: true });
export const phoneSchema = registrationSchema.pick({ phoneNumber: true });
export const ageSchema = registrationSchema.pick({ age: true });

// Type inference
export type RegistrationData = z.infer<typeof registrationSchema>;
export type PasswordStrength = ReturnType<typeof getPasswordStrength>;

// Validation helper functions
export function validateField(fieldName: keyof RegistrationData, value: any) {
  try {
    switch (fieldName) {
      case 'email':
        emailSchema.parse({ email: value });
        break;
      case 'password':
        passwordSchema.parse({ password: value });
        break;
      case 'firstName':
      case 'lastName':
        nameSchema.parse({ [fieldName]: value });
        break;
      case 'username':
        usernameSchema.parse({ username: value });
        break;
      case 'phoneNumber':
        phoneSchema.parse({ phoneNumber: value });
        break;
      case 'age':
        ageSchema.parse({ age: value });
        break;
      default:
        return { success: true };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed'
      };
    }
    return {
      success: false,
      error: 'Validation failed'
    };
  }
}

// Format phone number as user types
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length >= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else if (digits.length >= 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return digits;
  }
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(\d{3}\) \d{3}-\d{4}$/,
  username: /^[a-zA-Z0-9_-]+$/,
  name: /^[a-zA-Z\s'-]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
};

// Error messages
export const errorMessages = {
  required: 'This field is required',
  email: {
    invalid: 'Please enter a valid email address',
    tooLong: 'Email address is too long',
    noPlus: 'Email addresses with + symbols are not allowed'
  },
  password: {
    tooShort: 'Password must be at least 8 characters long',
    noUppercase: 'Password must contain at least one uppercase letter',
    noLowercase: 'Password must contain at least one lowercase letter',
    noNumber: 'Password must contain at least one number',
    noSpecial: 'Password must contain at least one special character',
    noMatch: 'Passwords do not match'
  },
  name: {
    tooShort: 'Name must be at least 2 characters',
    tooLong: 'Name is too long',
    invalidChars: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },
  username: {
    tooShort: 'Username must be at least 3 characters',
    tooLong: 'Username must be no more than 30 characters',
    invalidChars: 'Username can only contain letters, numbers, underscores, and hyphens'
  },
  phone: {
    invalid: 'Phone number must be in format (555) 123-4567'
  },
  age: {
    tooYoung: 'You must be at least 13 years old',
    tooOld: 'Please enter a valid age',
    invalid: 'Please enter a valid age'
  },
  terms: 'You must agree to the Terms of Service',
  privacy: 'You must agree to the Privacy Policy'
};
