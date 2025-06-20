/**
 * User Validation Schemas using Zod
 * 
 * This file contains Zod validation schemas for all User-related interfaces
 * to ensure type safety and runtime validation.
 */

import { z } from 'zod';
import { UserRole, UserStatus, AuthProvider } from '$lib/types/user';

/**
 * User Role validation schema
 * 
 * @description Validates that the role is one of the allowed UserRole values
 */
export const userRoleSchema = z.nativeEnum(UserRole, {
  errorMap: () => ({ message: 'Invalid user role' })
});

/**
 * User Status validation schema
 * 
 * @description Validates that the status is one of the allowed UserStatus values
 */
export const userStatusSchema = z.nativeEnum(UserStatus, {
  errorMap: () => ({ message: 'Invalid user status' })
});

/**
 * Auth Provider validation schema
 * 
 * @description Validates that the provider is one of the allowed AuthProvider values
 */
export const authProviderSchema = z.nativeEnum(AuthProvider, {
  errorMap: () => ({ message: 'Invalid authentication provider' })
});

/**
 * Core User validation schema
 * 
 * @description Validates the basic User interface
 */
export const userSchema = z.object({
  /**
   * User's unique identifier
   * Must be a non-empty string
   */
  id: z
    .string()
    .min(1, 'User ID is required')
    .max(50, 'User ID must be less than 50 characters'),

  /**
   * User's display name
   * Must be between 1 and 100 characters
   */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  /**
   * User's email address
   * Must be a valid email format
   */
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase(),

  /**
   * Array of user roles
   * Must contain at least one valid role
   */
  roles: z
    .array(userRoleSchema)
    .min(1, 'User must have at least one role')
    .max(5, 'User cannot have more than 5 roles'),

  /**
   * Account creation timestamp
   * Must be a valid Date object
   */
  createdAt: z
    .date()
    .refine((date) => date <= new Date(), 'Creation date cannot be in the future')
});

/**
 * User Profile validation schema (extends User)
 * 
 * @description Validates the extended UserProfile interface
 */
export const userProfileSchema = userSchema.extend({
  /**
   * User's first name
   */
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  /**
   * User's last name
   */
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  /**
   * User's username (optional, unique)
   */
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .nullable(),

  /**
   * User's avatar URL (optional)
   */
  avatarUrl: z
    .string()
    .url('Please enter a valid URL')
    .max(2048, 'Avatar URL is too long')
    .nullable(),

  /**
   * User's phone number (optional)
   */
  phoneNumber: z
    .string()
    .regex(/^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/, 'Please enter a valid phone number')
    .nullable(),

  /**
   * User's date of birth (optional)
   */
  dateOfBirth: z
    .date()
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 13 && age <= 120;
    }, 'User must be between 13 and 120 years old')
    .nullable(),

  /**
   * User's bio (optional)
   */
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .nullable(),

  /**
   * User's account status
   */
  status: userStatusSchema,

  /**
   * Email verification status
   */
  emailVerified: z.boolean(),

  /**
   * Last login timestamp (optional)
   */
  lastLoginAt: z
    .date()
    .nullable(),

  /**
   * Profile update timestamp
   */
  updatedAt: z.date()
});

/**
 * Create User DTO validation schema
 * 
 * @description Validates data for creating a new user
 */
export const createUserDTOSchema = z.object({
  /**
   * User's display name
   */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  /**
   * User's email address
   */
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase(),

  /**
   * User's password
   */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 'Password must contain at least one special character'),

  /**
   * Initial user roles (optional, defaults to USER)
   */
  roles: z
    .array(userRoleSchema)
    .min(1, 'User must have at least one role')
    .max(5, 'User cannot have more than 5 roles')
    .default([UserRole.USER]),

  /**
   * User's first name (optional)
   */
  firstName: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),

  /**
   * User's last name (optional)
   */
  lastName: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),

  /**
   * User's username (optional)
   */
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional()
});

/**
 * Update User DTO validation schema
 * 
 * @description Validates data for updating user information
 */
export const updateUserDTOSchema = z.object({
  /**
   * User's display name (optional)
   */
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),

  /**
   * User's first name (optional)
   */
  firstName: z
    .string()
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),

  /**
   * User's last name (optional)
   */
  lastName: z
    .string()
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),

  /**
   * User's username (optional, nullable)
   */
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .nullable()
    .optional(),

  /**
   * User's phone number (optional, nullable)
   */
  phoneNumber: z
    .string()
    .regex(/^(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/, 'Please enter a valid phone number')
    .nullable()
    .optional(),

  /**
   * User's date of birth (optional, nullable)
   */
  dateOfBirth: z
    .date()
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 13 && age <= 120;
    }, 'User must be between 13 and 120 years old')
    .nullable()
    .optional(),

  /**
   * User's bio (optional, nullable)
   */
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .nullable()
    .optional(),

  /**
   * User's avatar URL (optional, nullable)
   */
  avatarUrl: z
    .string()
    .url('Please enter a valid URL')
    .max(2048, 'Avatar URL is too long')
    .nullable()
    .optional()
});

/**
 * User Query Parameters validation schema
 * 
 * @description Validates query parameters for user filtering and pagination
 */
export const userQueryParamsSchema = z.object({
  /**
   * Filter by user role (optional)
   */
  role: userRoleSchema.optional(),

  /**
   * Filter by user status (optional)
   */
  status: userStatusSchema.optional(),

  /**
   * Search term for name or email (optional)
   */
  search: z
    .string()
    .min(1, 'Search term cannot be empty')
    .max(100, 'Search term must be less than 100 characters')
    .optional(),

  /**
   * Number of results per page
   */
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),

  /**
   * Page offset for pagination
   */
  offset: z
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),

  /**
   * Sort field
   */
  sortBy: z
    .enum(['name', 'email', 'createdAt', 'lastLoginAt'])
    .default('createdAt'),

  /**
   * Sort order
   */
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
});

/**
 * User Preferences validation schema
 * 
 * @description Validates user preferences and settings
 */
export const userPreferencesSchema = z.object({
  /**
   * User ID these preferences belong to
   */
  userId: z
    .string()
    .min(1, 'User ID is required'),

  /**
   * User's preferred theme
   */
  theme: z
    .enum(['light', 'dark', 'auto'])
    .default('auto'),

  /**
   * User's preferred language/locale
   */
  language: z
    .string()
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Language must be in format "en-US"')
    .default('en-US'),

  /**
   * User's timezone
   */
  timezone: z
    .string()
    .min(1, 'Timezone is required')
    .default('UTC'),

  /**
   * Email notifications preference
   */
  emailNotifications: z
    .boolean()
    .default(true),

  /**
   * Push notifications preference
   */
  pushNotifications: z
    .boolean()
    .default(true),

  /**
   * Marketing emails preference
   */
  marketingEmails: z
    .boolean()
    .default(false),

  /**
   * Public profile preference
   */
  publicProfile: z
    .boolean()
    .default(false),

  /**
   * Preferences update timestamp
   */
  updatedAt: z.date()
});

/**
 * User Session validation schema
 * 
 * @description Validates user session information
 */
export const userSessionSchema = z.object({
  /**
   * Session unique identifier
   */
  id: z
    .string()
    .min(1, 'Session ID is required'),

  /**
   * User ID this session belongs to
   */
  userId: z
    .string()
    .min(1, 'User ID is required'),

  /**
   * Device/browser user agent
   */
  userAgent: z
    .string()
    .max(1000, 'User agent string is too long')
    .nullable(),

  /**
   * IP address of the session
   */
  ipAddress: z
    .string()
    .ip('Invalid IP address')
    .nullable(),

  /**
   * Whether session is currently active
   */
  isActive: z
    .boolean()
    .default(true),

  /**
   * Session creation timestamp
   */
  createdAt: z.date(),

  /**
   * Session expiration timestamp
   */
  expiresAt: z
    .date()
    .refine((date) => date > new Date(), 'Session expiration must be in the future'),

  /**
   * Last access timestamp
   */
  lastAccessedAt: z.date()
});

/**
 * Helper function to validate user data
 * 
 * @param data - Data to validate
 * @returns Validation result
 */
export const validateUser = (data: unknown) => {
  return userSchema.safeParse(data);
};

/**
 * Helper function to validate user profile data
 * 
 * @param data - Data to validate
 * @returns Validation result
 */
export const validateUserProfile = (data: unknown) => {
  return userProfileSchema.safeParse(data);
};

/**
 * Helper function to validate create user DTO
 * 
 * @param data - Data to validate
 * @returns Validation result
 */
export const validateCreateUserDTO = (data: unknown) => {
  return createUserDTOSchema.safeParse(data);
};

/**
 * Helper function to validate update user DTO
 * 
 * @param data - Data to validate
 * @returns Validation result
 */
export const validateUpdateUserDTO = (data: unknown) => {
  return updateUserDTOSchema.safeParse(data);
};

/**
 * Helper function to validate user query parameters
 * 
 * @param data - Data to validate
 * @returns Validation result
 */
export const validateUserQueryParams = (data: unknown) => {
  return userQueryParamsSchema.safeParse(data);
};
