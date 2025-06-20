/**
 * User Service
 * 
 * This service handles user management operations including creation,
 * authentication, and profile management with proper error handling
 * and validation.
 */

import { prisma } from '$lib/database/prisma';
import type { User, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

// Types
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  username?: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Custom error classes
export class UserServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class DuplicateEmailError extends UserServiceError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'DUPLICATE_EMAIL');
  }
}

export class DuplicateUsernameError extends UserServiceError {
  constructor(username: string) {
    super(`User with username ${username} already exists`, 'DUPLICATE_USERNAME');
  }
}

export class UserNotFoundError extends UserServiceError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
  }
}

export class InvalidCredentialsError extends UserServiceError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

export class ValidationError extends UserServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class UserService {
  /**
   * Create a new user with email uniqueness validation
   */
  static async createUser(input: CreateUserInput): Promise<UserResponse> {
    // Validate input
    this.validateCreateUserInput(input);

    // Check for duplicate email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existingUserByEmail) {
      throw new DuplicateEmailError(input.email);
    }

    // Check for duplicate username if provided
    if (input.username) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: input.username }
      });

      if (existingUserByUsername) {
        throw new DuplicateUsernameError(input.username);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    try {
      // Create user in database
      const user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          username: input.username || null,
          role: input.role || 'USER',
          isActive: true,
          // Note: In a real app, you'd store the hashed password
          // For this example, we're not including it in the schema
        }
      });

      return this.toUserResponse(user);
    } catch (error) {
      // Handle database constraint violations
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          if (error.message.includes('email')) {
            throw new DuplicateEmailError(input.email);
          }
          if (error.message.includes('username')) {
            throw new DuplicateUsernameError(input.username || '');
          }
        }
      }
      
      throw new UserServiceError(
        'Failed to create user due to database error',
        'DATABASE_ERROR'
      );
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<UserResponse> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    return this.toUserResponse(user);
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserResponse> {
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Valid email is required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new UserNotFoundError(email);
    }

    return this.toUserResponse(user);
  }

  /**
   * Update user profile
   */
  static async updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    // Check for duplicate username if being updated
    if (input.username && input.username !== existingUser.username) {
      const userWithUsername = await prisma.user.findUnique({
        where: { username: input.username }
      });

      if (userWithUsername) {
        throw new DuplicateUsernameError(input.username);
      }
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...input,
          updatedAt: new Date()
        }
      });

      return this.toUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        if (error.message.includes('username')) {
          throw new DuplicateUsernameError(input.username || '');
        }
      }
      
      throw new UserServiceError(
        'Failed to update user due to database error',
        'DATABASE_ERROR'
      );
    }
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  static async deleteUser(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Valid user ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new UserNotFoundError(id);
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    return !!user;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username: string): Promise<boolean> {
    if (!username || typeof username !== 'string') {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    return !!user;
  }

  /**
   * Validate create user input
   */
  private static validateCreateUserInput(input: CreateUserInput): void {
    if (!input.email || typeof input.email !== 'string') {
      throw new ValidationError('Email is required');
    }

    if (!input.password || typeof input.password !== 'string') {
      throw new ValidationError('Password is required');
    }

    if (!input.name || typeof input.name !== 'string') {
      throw new ValidationError('Name is required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Password strength validation
    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Name validation
    if (input.name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }

    // Username validation (if provided)
    if (input.username) {
      if (input.username.length < 3 || input.username.length > 30) {
        throw new ValidationError('Username must be between 3 and 30 characters');
      }

      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(input.username)) {
        throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }
  }

  /**
   * Convert User model to UserResponse
   */
  private static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
