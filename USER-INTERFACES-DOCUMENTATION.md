# 📚 User Entity TypeScript Interfaces Documentation

## Overview

This documentation provides comprehensive TypeScript interfaces for User entities with proper JSDoc comments, validation schemas, utility functions, and usage examples.

## 🏗️ **Core Interfaces**

### **User Interface**
The basic user entity with essential fields:

```typescript
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
```

### **UserProfile Interface**
Extended user information with additional profile fields:

```typescript
/**
 * Extended User interface with additional profile information
 * 
 * @interface UserProfile
 * @extends User
 */
export interface UserProfile extends User {
  firstName: string;
  lastName: string;
  username: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  bio: string | null;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  updatedAt: Date;
}
```

## 🎭 **Enumerations**

### **UserRole Enum**
```typescript
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
```

### **UserStatus Enum**
```typescript
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
```

### **AuthProvider Enum**
```typescript
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
```

## 📝 **Data Transfer Objects (DTOs)**

### **CreateUserDTO**
```typescript
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  roles?: UserRole[];
  firstName?: string;
  lastName?: string;
  username?: string;
}
```

### **UpdateUserDTO**
```typescript
export interface UpdateUserDTO {
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: Date | null;
  bio?: string | null;
  avatarUrl?: string | null;
}
```

## 🔍 **Query and Response Types**

### **UserQueryParams**
```typescript
export interface UserQueryParams {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}
```

### **PaginatedUserResponse**
```typescript
export interface PaginatedUserResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

## 🛠️ **Utility Functions**

### **Role Checking Functions**
```typescript
// Check if user has specific role
hasRole(user: User, role: UserRole): boolean

// Check if user has any of the specified roles
hasAnyRole(user: User, roles: UserRole[]): boolean

// Check if user has all specified roles
hasAllRoles(user: User, roles: UserRole[]): boolean

// Check if user is an administrator
isAdmin(user: User): boolean

// Check if user can moderate content
canModerate(user: User): boolean
```

### **User Information Functions**
```typescript
// Get user's full name
getFullName(user: UserProfile): string

// Get user's initials for avatars
getUserInitials(user: User): string

// Calculate user's age from date of birth
calculateAge(dateOfBirth: Date): number

// Format last login time
formatLastLogin(lastLoginAt: Date | null): string
```

### **Type Conversion Functions**
```typescript
// Convert to public user (safe for client-side)
toPublicUser(user: UserProfile, preferences?: UserPreferences): PublicUser

// Convert to user reference
toUserReference(user: User): UserReference
```

## ✅ **Validation Schemas (Zod)**

### **User Validation**
```typescript
import { validateUser, validateUserProfile } from '$lib/validation/user-schemas';

// Validate basic user data
const userResult = validateUser(userData);
if (userResult.success) {
  const validUser: User = userResult.data;
}

// Validate user profile data
const profileResult = validateUserProfile(profileData);
if (profileResult.success) {
  const validProfile: UserProfile = profileResult.data;
}
```

### **DTO Validation**
```typescript
import { validateCreateUserDTO, validateUpdateUserDTO } from '$lib/validation/user-schemas';

// Validate user creation data
const createResult = validateCreateUserDTO(requestData);
if (createResult.success) {
  const validData: CreateUserDTO = createResult.data;
}

// Validate user update data
const updateResult = validateUpdateUserDTO(requestData);
if (updateResult.success) {
  const validData: UpdateUserDTO = updateResult.data;
}
```

## 🚀 **Usage Examples**

### **1. Creating a New User**
```typescript
import type { CreateUserDTO, UserProfile } from '$lib/types/user';
import { validateCreateUserDTO } from '$lib/validation/user-schemas';
import { UserRole, UserStatus } from '$lib/types/user';

async function createUser(userData: unknown): Promise<UserProfile> {
  // Validate input data
  const validation = validateCreateUserDTO(userData);
  if (!validation.success) {
    throw new Error('Invalid user data');
  }

  const validData: CreateUserDTO = validation.data;

  // Create user profile
  const newUser: UserProfile = {
    id: generateUserId(),
    name: validData.name,
    email: validData.email,
    roles: validData.roles || [UserRole.USER],
    createdAt: new Date(),
    firstName: validData.firstName || '',
    lastName: validData.lastName || '',
    username: validData.username || null,
    avatarUrl: null,
    phoneNumber: null,
    dateOfBirth: null,
    bio: null,
    status: UserStatus.PENDING_VERIFICATION,
    emailVerified: false,
    lastLoginAt: null,
    updatedAt: new Date()
  };

  return newUser;
}
```

### **2. Role-Based Access Control**
```typescript
import { hasRole, isAdmin, canModerate } from '$lib/types/user-utils';
import { UserRole } from '$lib/types/user';

function checkUserPermissions(user: User) {
  // Check specific role
  if (hasRole(user, UserRole.ADMIN)) {
    console.log('User is an admin');
  }

  // Check admin status
  if (isAdmin(user)) {
    console.log('User has admin privileges');
  }

  // Check moderation permissions
  if (canModerate(user)) {
    console.log('User can moderate content');
  }
}
```

### **3. User Profile Display**
```typescript
import { getFullName, getUserInitials, formatLastLogin } from '$lib/types/user-utils';

function displayUserProfile(user: UserProfile) {
  return {
    fullName: getFullName(user),
    initials: getUserInitials(user),
    lastLogin: formatLastLogin(user.lastLoginAt),
    isActive: user.status === UserStatus.ACTIVE,
    isVerified: user.emailVerified
  };
}
```

### **4. API Endpoint Implementation**
```typescript
import type { RequestHandler } from './$types';
import type { PaginatedUserResponse } from '$lib/types/user';
import { validateUserQueryParams } from '$lib/validation/user-schemas';

export const GET: RequestHandler = async ({ url }) => {
  // Parse query parameters
  const params = Object.fromEntries(url.searchParams);
  
  // Validate parameters
  const validation = validateUserQueryParams(params);
  if (!validation.success) {
    return json({ error: 'Invalid parameters' }, { status: 400 });
  }

  // Fetch and return paginated users
  const response: PaginatedUserResponse = await getUsersWithPagination(validation.data);
  return json(response);
};
```

## 📊 **Type Safety Benefits**

### **Compile-Time Checking**
- ✅ **Type Safety** - All user operations are type-checked at compile time
- ✅ **IntelliSense** - Full autocomplete and documentation in IDEs
- ✅ **Refactoring Safety** - Changes to interfaces are caught across the codebase

### **Runtime Validation**
- ✅ **Zod Schemas** - Runtime validation with detailed error messages
- ✅ **Type Guards** - Safe type checking at runtime
- ✅ **Input Sanitization** - Automatic data cleaning and validation

### **Documentation**
- ✅ **JSDoc Comments** - Comprehensive documentation for all interfaces
- ✅ **Examples** - Real-world usage examples for each interface
- ✅ **Type Annotations** - Clear type information for all properties

## 🔒 **Security Considerations**

### **Data Exposure**
- Use `PublicUser` interface for client-side data
- Use `UserReference` for minimal user information
- Never expose sensitive fields like password hashes

### **Role Validation**
- Always validate user roles server-side
- Use type-safe role checking functions
- Implement proper authorization middleware

### **Input Validation**
- Validate all user input with Zod schemas
- Sanitize data before database operations
- Use proper error handling for validation failures

## 📁 **File Structure**

```
src/lib/types/
├── user.ts              # Core user interfaces and enums
├── user-utils.ts        # Utility functions and type guards
└── validation/
    └── user-schemas.ts   # Zod validation schemas

src/routes/api/
└── users/
    └── +server.ts        # Example API implementation
```

This comprehensive type system provides a solid foundation for user management in TypeScript applications with full type safety, validation, and documentation.
