/**
 * User Utility Types and Helper Functions
 * 
 * This file contains utility types, type guards, and helper functions
 * for working with User entities in a type-safe manner.
 */

import type {
  User,
  UserProfile,
  CreateUserDTO,
  UpdateUserDTO,
  UserAuth,
  UserPreferences,
  UserSession
} from './user';
import { UserRole, UserStatus, AuthProvider } from './user';

/**
 * Utility type to make all properties of User optional except specified ones
 * 
 * @template T - The base type
 * @template K - Keys that should remain required
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * User type with only public information (safe for client-side)
 * 
 * @interface PublicUser
 */
export interface PublicUser {
  /**
   * User's unique identifier
   * 
   * @type {string}
   */
  id: string;

  /**
   * User's display name
   * 
   * @type {string}
   */
  name: string;

  /**
   * User's username (if public)
   * 
   * @type {string | null}
   */
  username: string | null;

  /**
   * User's avatar URL
   * 
   * @type {string | null}
   */
  avatarUrl: string | null;

  /**
   * User's bio (if public)
   * 
   * @type {string | null}
   */
  bio: string | null;

  /**
   * When the user joined
   * 
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Whether the user's profile is public
   * 
   * @type {boolean}
   */
  isPublic: boolean;
}

/**
 * User type for administrative purposes with sensitive information
 * 
 * @interface AdminUser
 * @extends UserProfile
 */
export interface AdminUser extends UserProfile {
  /**
   * User's IP address from last login
   * 
   * @type {string | null}
   */
  lastLoginIp: string | null;

  /**
   * Number of failed login attempts
   * 
   * @type {number}
   */
  failedLoginAttempts: number;

  /**
   * Timestamp when account was locked (if applicable)
   * 
   * @type {Date | null}
   */
  lockedAt: Date | null;

  /**
   * Reason for account suspension/ban
   * 
   * @type {string | null}
   */
  suspensionReason: string | null;

  /**
   * Admin who performed the last status change
   * 
   * @type {string | null}
   */
  statusChangedBy: string | null;

  /**
   * Timestamp of last status change
   * 
   * @type {Date | null}
   */
  statusChangedAt: Date | null;
}

/**
 * Minimal user information for references and lookups
 * 
 * @interface UserReference
 */
export interface UserReference {
  /**
   * User's unique identifier
   * 
   * @type {string}
   */
  id: string;

  /**
   * User's display name
   * 
   * @type {string}
   */
  name: string;

  /**
   * User's email address
   * 
   * @type {string}
   */
  email: string;

  /**
   * User's avatar URL
   * 
   * @type {string | null}
   */
  avatarUrl: string | null;
}

/**
 * User role permission mapping
 * 
 * @interface RolePermissions
 */
export interface RolePermissions {
  /**
   * The role this permission set applies to
   * 
   * @type {UserRole}
   */
  role: UserRole;

  /**
   * List of permissions granted to this role
   * 
   * @type {string[]}
   */
  permissions: string[];

  /**
   * Whether this role can manage users
   * 
   * @type {boolean}
   */
  canManageUsers: boolean;

  /**
   * Whether this role can access admin panel
   * 
   * @type {boolean}
   */
  canAccessAdmin: boolean;

  /**
   * Whether this role can moderate content
   * 
   * @type {boolean}
   */
  canModerateContent: boolean;
}

/**
 * Type guard to check if a user has a specific role
 * 
 * @param user - The user to check
 * @param role - The role to check for
 * @returns True if the user has the specified role
 * 
 * @example
 * ```typescript
 * if (hasRole(user, UserRole.ADMIN)) {
 *   // User is an admin
 * }
 * ```
 */
export function hasRole(user: User | UserProfile, role: UserRole): boolean {
  return user.roles.includes(role);
}

/**
 * Type guard to check if a user has any of the specified roles
 * 
 * @param user - The user to check
 * @param roles - Array of roles to check for
 * @returns True if the user has any of the specified roles
 * 
 * @example
 * ```typescript
 * if (hasAnyRole(user, [UserRole.ADMIN, UserRole.MODERATOR])) {
 *   // User is either admin or moderator
 * }
 * ```
 */
export function hasAnyRole(user: User | UserProfile, roles: UserRole[]): boolean {
  return roles.some(role => user.roles.includes(role));
}

/**
 * Type guard to check if a user has all specified roles
 * 
 * @param user - The user to check
 * @param roles - Array of roles to check for
 * @returns True if the user has all specified roles
 * 
 * @example
 * ```typescript
 * if (hasAllRoles(user, [UserRole.USER, UserRole.EDITOR])) {
 *   // User has both user and editor roles
 * }
 * ```
 */
export function hasAllRoles(user: User | UserProfile, roles: UserRole[]): boolean {
  return roles.every(role => user.roles.includes(role));
}

/**
 * Check if a user is an administrator
 * 
 * @param user - The user to check
 * @returns True if the user is an admin or super admin
 * 
 * @example
 * ```typescript
 * if (isAdmin(user)) {
 *   // User has admin privileges
 * }
 * ```
 */
export function isAdmin(user: User | UserProfile): boolean {
  return hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

/**
 * Check if a user can moderate content
 * 
 * @param user - The user to check
 * @returns True if the user can moderate content
 * 
 * @example
 * ```typescript
 * if (canModerate(user)) {
 *   // User can moderate content
 * }
 * ```
 */
export function canModerate(user: User | UserProfile): boolean {
  return hasAnyRole(user, [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
}

/**
 * Check if a user account is active
 * 
 * @param user - The user to check (must have status property)
 * @returns True if the user account is active
 * 
 * @example
 * ```typescript
 * if (isActiveUser(userProfile)) {
 *   // User account is active
 * }
 * ```
 */
export function isActiveUser(user: UserProfile | AdminUser): boolean {
  return user.status === UserStatus.ACTIVE;
}

/**
 * Check if a user's email is verified
 * 
 * @param user - The user to check (must have emailVerified property)
 * @returns True if the user's email is verified
 * 
 * @example
 * ```typescript
 * if (isEmailVerified(userProfile)) {
 *   // User's email is verified
 * }
 * ```
 */
export function isEmailVerified(user: UserProfile | AdminUser): boolean {
  return user.emailVerified === true;
}

/**
 * Get user's full name from first and last name
 * 
 * @param user - The user profile
 * @returns Full name or display name as fallback
 * 
 * @example
 * ```typescript
 * const fullName = getFullName(userProfile);
 * // Returns "John Doe" or falls back to user.name
 * ```
 */
export function getFullName(user: UserProfile): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.name;
}

/**
 * Get user's initials for avatar placeholders
 * 
 * @param user - The user
 * @returns User's initials (up to 2 characters)
 * 
 * @example
 * ```typescript
 * const initials = getUserInitials(user);
 * // Returns "JD" for "John Doe"
 * ```
 */
export function getUserInitials(user: User | UserProfile): string {
  const name = user.name.trim();
  const words = name.split(/\s+/);
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  } else if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  
  return 'U'; // Fallback
}

/**
 * Convert UserProfile to PublicUser (safe for client-side)
 * 
 * @param user - The user profile
 * @param preferences - User preferences (optional)
 * @returns Public user information
 * 
 * @example
 * ```typescript
 * const publicUser = toPublicUser(userProfile, userPreferences);
 * ```
 */
export function toPublicUser(
  user: UserProfile, 
  preferences?: UserPreferences
): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: preferences?.publicProfile ? user.bio : null,
    createdAt: user.createdAt,
    isPublic: preferences?.publicProfile ?? false
  };
}

/**
 * Convert User to UserReference
 * 
 * @param user - The user
 * @returns User reference
 * 
 * @example
 * ```typescript
 * const userRef = toUserReference(user);
 * ```
 */
export function toUserReference(user: User | UserProfile): UserReference {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: 'avatarUrl' in user ? user.avatarUrl : null
  };
}

/**
 * Calculate user age from date of birth
 * 
 * @param dateOfBirth - User's date of birth
 * @returns Age in years
 * 
 * @example
 * ```typescript
 * const age = calculateAge(user.dateOfBirth);
 * ```
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Format user's last login time
 * 
 * @param lastLoginAt - Last login timestamp
 * @returns Formatted string or null
 * 
 * @example
 * ```typescript
 * const lastLogin = formatLastLogin(user.lastLoginAt);
 * // Returns "2 hours ago" or "Never"
 * ```
 */
export function formatLastLogin(lastLoginAt: Date | null): string {
  if (!lastLoginAt) {
    return 'Never';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastLoginAt.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return lastLoginAt.toLocaleDateString();
  }
}

/**
 * Type guard to check if an object is a valid User
 * 
 * @param obj - Object to check
 * @returns True if object is a valid User
 * 
 * @example
 * ```typescript
 * if (isUser(data)) {
 *   // data is definitely a User
 * }
 * ```
 */
export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    Array.isArray(obj.roles) &&
    obj.createdAt instanceof Date
  );
}

/**
 * Type guard to check if an object is a valid UserProfile
 * 
 * @param obj - Object to check
 * @returns True if object is a valid UserProfile
 * 
 * @example
 * ```typescript
 * if (isUserProfile(data)) {
 *   // data is definitely a UserProfile
 * }
 * ```
 */
export function isUserProfile(obj: any): obj is UserProfile {
  return (
    isUser(obj) &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.emailVerified === 'boolean' &&
    obj.updatedAt instanceof Date
  );
}

/**
 * Default role permissions mapping
 * 
 * @constant
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.USER]: {
    role: UserRole.USER,
    permissions: ['read:own_profile', 'update:own_profile'],
    canManageUsers: false,
    canAccessAdmin: false,
    canModerateContent: false
  },
  [UserRole.EDITOR]: {
    role: UserRole.EDITOR,
    permissions: ['read:own_profile', 'update:own_profile', 'create:content', 'update:content'],
    canManageUsers: false,
    canAccessAdmin: false,
    canModerateContent: true
  },
  [UserRole.MODERATOR]: {
    role: UserRole.MODERATOR,
    permissions: ['read:own_profile', 'update:own_profile', 'moderate:content', 'manage:users'],
    canManageUsers: true,
    canAccessAdmin: true,
    canModerateContent: true
  },
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    permissions: ['*'],
    canManageUsers: true,
    canAccessAdmin: true,
    canModerateContent: true
  },
  [UserRole.SUPER_ADMIN]: {
    role: UserRole.SUPER_ADMIN,
    permissions: ['*'],
    canManageUsers: true,
    canAccessAdmin: true,
    canModerateContent: true
  }
};
