/**
 * User Entity Type Definitions
 * 
 * This file contains comprehensive TypeScript interfaces for User entities
 * with proper JSDoc documentation for better developer experience.
 */

/**
 * Enumeration of possible user roles in the system
 * 
 * @enum {string}
 */
export enum UserRole {
  /** Standard user with basic permissions */
  USER = 'user',
  /** Editor with content management permissions */
  EDITOR = 'editor',
  /** Moderator with user management permissions */
  MODERATOR = 'moderator',
  /** Administrator with full system access */
  ADMIN = 'admin',
  /** Super administrator with unrestricted access */
  SUPER_ADMIN = 'super_admin'
}

/**
 * User account status enumeration
 * 
 * @enum {string}
 */
export enum UserStatus {
  /** Account is active and in good standing */
  ACTIVE = 'active',
  /** Account is temporarily suspended */
  SUSPENDED = 'suspended',
  /** Account is permanently banned */
  BANNED = 'banned',
  /** Account is pending email verification */
  PENDING_VERIFICATION = 'pending_verification',
  /** Account is deactivated by user */
  DEACTIVATED = 'deactivated'
}

/**
 * User authentication provider enumeration
 * 
 * @enum {string}
 */
export enum AuthProvider {
  /** Email and password authentication */
  EMAIL = 'email',
  /** Google OAuth authentication */
  GOOGLE = 'google',
  /** Facebook OAuth authentication */
  FACEBOOK = 'facebook',
  /** GitHub OAuth authentication */
  GITHUB = 'github',
  /** Apple OAuth authentication */
  APPLE = 'apple'
}

/**
 * Core User interface representing the essential user entity
 * 
 * @interface User
 */
export interface User {
  /**
   * Unique identifier for the user
   * 
   * @type {string}
   * @example "user_123456789"
   */
  id: string;

  /**
   * User's display name
   * 
   * @type {string}
   * @example "John Doe"
   */
  name: string;

  /**
   * User's email address (unique across the system)
   * 
   * @type {string}
   * @format email
   * @example "john.doe@example.com"
   */
  email: string;

  /**
   * Array of roles assigned to the user
   * 
   * @type {UserRole[]}
   * @example [UserRole.USER, UserRole.EDITOR]
   */
  roles: UserRole[];

  /**
   * Timestamp when the user account was created
   * 
   * @type {Date}
   * @example new Date('2024-01-15T10:30:00Z')
   */
  createdAt: Date;
}

/**
 * Extended User interface with additional profile information
 * 
 * @interface UserProfile
 * @extends User
 */
export interface UserProfile extends User {
  /**
   * User's first name
   * 
   * @type {string}
   * @example "John"
   */
  firstName: string;

  /**
   * User's last name
   * 
   * @type {string}
   * @example "Doe"
   */
  lastName: string;

  /**
   * User's username (unique, optional)
   * 
   * @type {string | null}
   * @example "johndoe123"
   */
  username: string | null;

  /**
   * User's profile avatar URL
   * 
   * @type {string | null}
   * @format uri
   * @example "https://example.com/avatars/user123.jpg"
   */
  avatarUrl: string | null;

  /**
   * User's phone number
   * 
   * @type {string | null}
   * @format phone
   * @example "+1-555-123-4567"
   */
  phoneNumber: string | null;

  /**
   * User's date of birth
   * 
   * @type {Date | null}
   * @example new Date('1990-05-15')
   */
  dateOfBirth: Date | null;

  /**
   * User's bio or description
   * 
   * @type {string | null}
   * @maxLength 500
   * @example "Software developer passionate about TypeScript and React"
   */
  bio: string | null;

  /**
   * User's current status
   * 
   * @type {UserStatus}
   * @default UserStatus.PENDING_VERIFICATION
   */
  status: UserStatus;

  /**
   * Whether the user's email has been verified
   * 
   * @type {boolean}
   * @default false
   */
  emailVerified: boolean;

  /**
   * Timestamp when the user last logged in
   * 
   * @type {Date | null}
   * @example new Date('2024-06-18T14:30:00Z')
   */
  lastLoginAt: Date | null;

  /**
   * Timestamp when the user profile was last updated
   * 
   * @type {Date}
   * @example new Date('2024-06-18T10:15:00Z')
   */
  updatedAt: Date;
}

/**
 * User authentication information interface
 * 
 * @interface UserAuth
 */
export interface UserAuth {
  /**
   * User ID this auth record belongs to
   * 
   * @type {string}
   * @example "user_123456789"
   */
  userId: string;

  /**
   * Authentication provider used
   * 
   * @type {AuthProvider}
   * @example AuthProvider.EMAIL
   */
  provider: AuthProvider;

  /**
   * Provider-specific user ID
   * 
   * @type {string}
   * @example "google_oauth_id_123"
   */
  providerId: string;

  /**
   * Hashed password (only for email provider)
   * 
   * @type {string | null}
   * @example "$2b$10$..."
   */
  passwordHash: string | null;

  /**
   * Timestamp when this auth method was created
   * 
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp when this auth method was last used
   * 
   * @type {Date | null}
   */
  lastUsedAt: Date | null;
}

/**
 * User preferences and settings interface
 * 
 * @interface UserPreferences
 */
export interface UserPreferences {
  /**
   * User ID these preferences belong to
   * 
   * @type {string}
   */
  userId: string;

  /**
   * User's preferred theme
   * 
   * @type {'light' | 'dark' | 'auto'}
   * @default 'auto'
   */
  theme: 'light' | 'dark' | 'auto';

  /**
   * User's preferred language/locale
   * 
   * @type {string}
   * @format locale
   * @default 'en-US'
   * @example "en-US"
   */
  language: string;

  /**
   * User's timezone
   * 
   * @type {string}
   * @format timezone
   * @default 'UTC'
   * @example "America/New_York"
   */
  timezone: string;

  /**
   * Whether to receive email notifications
   * 
   * @type {boolean}
   * @default true
   */
  emailNotifications: boolean;

  /**
   * Whether to receive push notifications
   * 
   * @type {boolean}
   * @default true
   */
  pushNotifications: boolean;

  /**
   * Whether to receive marketing emails
   * 
   * @type {boolean}
   * @default false
   */
  marketingEmails: boolean;

  /**
   * Whether profile is public
   * 
   * @type {boolean}
   * @default false
   */
  publicProfile: boolean;

  /**
   * Timestamp when preferences were last updated
   * 
   * @type {Date}
   */
  updatedAt: Date;
}

/**
 * User session information interface
 * 
 * @interface UserSession
 */
export interface UserSession {
  /**
   * Unique session identifier
   * 
   * @type {string}
   * @example "session_abc123def456"
   */
  id: string;

  /**
   * User ID this session belongs to
   * 
   * @type {string}
   * @example "user_123456789"
   */
  userId: string;

  /**
   * Device information
   * 
   * @type {string | null}
   * @example "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
   */
  userAgent: string | null;

  /**
   * IP address of the session
   * 
   * @type {string | null}
   * @format ipv4
   * @example "192.168.1.100"
   */
  ipAddress: string | null;

  /**
   * Whether this is the current active session
   * 
   * @type {boolean}
   * @default true
   */
  isActive: boolean;

  /**
   * Timestamp when the session was created
   * 
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp when the session expires
   * 
   * @type {Date}
   */
  expiresAt: Date;

  /**
   * Timestamp when the session was last accessed
   * 
   * @type {Date}
   */
  lastAccessedAt: Date;
}

/**
 * Data Transfer Object for creating a new user
 * 
 * @interface CreateUserDTO
 */
export interface CreateUserDTO {
  /**
   * User's display name
   * 
   * @type {string}
   * @minLength 1
   * @maxLength 100
   */
  name: string;

  /**
   * User's email address
   * 
   * @type {string}
   * @format email
   */
  email: string;

  /**
   * User's password (plain text, will be hashed)
   * 
   * @type {string}
   * @minLength 8
   * @maxLength 128
   */
  password: string;

  /**
   * Initial roles to assign to the user
   * 
   * @type {UserRole[]}
   * @default [UserRole.USER]
   */
  roles?: UserRole[];

  /**
   * User's first name
   * 
   * @type {string}
   * @optional
   */
  firstName?: string;

  /**
   * User's last name
   * 
   * @type {string}
   * @optional
   */
  lastName?: string;

  /**
   * User's username
   * 
   * @type {string}
   * @optional
   */
  username?: string;
}

/**
 * Data Transfer Object for updating user information
 * 
 * @interface UpdateUserDTO
 */
export interface UpdateUserDTO {
  /**
   * User's display name
   * 
   * @type {string}
   * @optional
   */
  name?: string;

  /**
   * User's first name
   * 
   * @type {string}
   * @optional
   */
  firstName?: string;

  /**
   * User's last name
   * 
   * @type {string}
   * @optional
   */
  lastName?: string;

  /**
   * User's username
   * 
   * @type {string | null}
   * @optional
   */
  username?: string | null;

  /**
   * User's phone number
   * 
   * @type {string | null}
   * @optional
   */
  phoneNumber?: string | null;

  /**
   * User's date of birth
   * 
   * @type {Date | null}
   * @optional
   */
  dateOfBirth?: Date | null;

  /**
   * User's bio
   * 
   * @type {string | null}
   * @optional
   */
  bio?: string | null;

  /**
   * User's avatar URL
   * 
   * @type {string | null}
   * @optional
   */
  avatarUrl?: string | null;
}

/**
 * User query parameters for filtering and pagination
 * 
 * @interface UserQueryParams
 */
export interface UserQueryParams {
  /**
   * Filter by user role
   * 
   * @type {UserRole}
   * @optional
   */
  role?: UserRole;

  /**
   * Filter by user status
   * 
   * @type {UserStatus}
   * @optional
   */
  status?: UserStatus;

  /**
   * Search term for name or email
   * 
   * @type {string}
   * @optional
   */
  search?: string;

  /**
   * Number of results per page
   * 
   * @type {number}
   * @minimum 1
   * @maximum 100
   * @default 20
   */
  limit?: number;

  /**
   * Page offset for pagination
   * 
   * @type {number}
   * @minimum 0
   * @default 0
   */
  offset?: number;

  /**
   * Sort field
   * 
   * @type {'name' | 'email' | 'createdAt' | 'lastLoginAt'}
   * @default 'createdAt'
   */
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';

  /**
   * Sort order
   * 
   * @type {'asc' | 'desc'}
   * @default 'desc'
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated user response interface
 * 
 * @interface PaginatedUserResponse
 */
export interface PaginatedUserResponse {
  /**
   * Array of users for the current page
   * 
   * @type {UserProfile[]}
   */
  users: UserProfile[];

  /**
   * Total number of users matching the query
   * 
   * @type {number}
   */
  total: number;

  /**
   * Current page number (0-based)
   * 
   * @type {number}
   */
  page: number;

  /**
   * Number of results per page
   * 
   * @type {number}
   */
  limit: number;

  /**
   * Total number of pages
   * 
   * @type {number}
   */
  totalPages: number;

  /**
   * Whether there is a next page
   * 
   * @type {boolean}
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page
   * 
   * @type {boolean}
   */
  hasPrevious: boolean;
}
