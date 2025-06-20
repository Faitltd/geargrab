/**
 * Authentication Service
 * 
 * This service handles user authentication including login, registration,
 * password hashing with bcrypt, JWT creation and validation, and comprehensive
 * error handling for invalid credentials and security scenarios.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '$lib/database/prisma';
import type { User, UserRole } from '@prisma/client';
import { SECURITY_CONFIG } from '$lib/security/config';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  username?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
  expired?: boolean;
}

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

export class UserNotFoundError extends AuthenticationError {
  constructor(email: string) {
    super(`User not found: ${email}`, 'USER_NOT_FOUND');
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor(lockoutDuration: number) {
    super(`Account locked. Try again in ${Math.ceil(lockoutDuration / 60000)} minutes`, 'ACCOUNT_LOCKED');
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('Invalid or malformed token', 'INVALID_TOKEN');
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor() {
    super('Email address not verified', 'EMAIL_NOT_VERIFIED');
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor() {
    super('Account is inactive', 'ACCOUNT_INACTIVE');
  }
}

export class AuthService {
  private static readonly JWT_SECRET = SECURITY_CONFIG.crypto.jwtSecret;
  private static readonly HASH_ROUNDS = SECURITY_CONFIG.crypto.hashRounds;
  private static readonly MAX_LOGIN_ATTEMPTS = SECURITY_CONFIG.auth.maxLoginAttempts;
  private static readonly LOCKOUT_DURATION = SECURITY_CONFIG.auth.lockoutDuration;
  private static readonly SESSION_DURATION = SECURITY_CONFIG.auth.sessionDuration;

  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      this.validateLoginCredentials(credentials);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
        include: {
          loginAttempts: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - this.LOCKOUT_DURATION)
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) {
        // Log failed attempt for non-existent user
        await this.logFailedAttempt(credentials.email, 'USER_NOT_FOUND');
        throw new InvalidCredentialsError();
      }

      // Check if account is locked
      if (user.loginAttempts && user.loginAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
        const lastAttempt = user.loginAttempts[0];
        const lockoutRemaining = this.LOCKOUT_DURATION - (Date.now() - lastAttempt.createdAt.getTime());
        
        if (lockoutRemaining > 0) {
          throw new AccountLockedError(lockoutRemaining);
        }
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AccountInactiveError();
      }

      // Verify password
      const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      
      if (!passwordValid) {
        await this.logFailedAttempt(credentials.email, 'INVALID_PASSWORD');
        throw new InvalidCredentialsError();
      }

      // Check email verification if required
      if (SECURITY_CONFIG.auth.requireEmailVerification && !user.emailVerified) {
        throw new EmailNotVerifiedError();
      }

      // Clear failed login attempts on successful login
      await this.clearFailedAttempts(user.id);

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

      return {
        success: true,
        user: this.toAuthUser(user),
        token,
        refreshToken,
        expiresAt
      };

    } catch (error) {
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<AuthResult> {
    try {
      // Validate input
      this.validateRegisterInput(input);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() }
      });

      if (existingUser) {
        throw new AuthenticationError('User with this email already exists', 'EMAIL_EXISTS');
      }

      // Hash password
      const passwordHash = await this.hashPassword(input.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          username: input.username || null,
          passwordHash,
          role: 'USER',
          isActive: true,
          emailVerified: false
        }
      });

      // Generate verification token if email verification is required
      if (SECURITY_CONFIG.auth.requireEmailVerification) {
        // TODO: Send verification email
        return {
          success: true,
          user: this.toAuthUser(user),
          error: 'Please check your email to verify your account'
        };
      }

      // Generate JWT token for immediate login
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

      return {
        success: true,
        user: this.toAuthUser(user),
        token,
        refreshToken,
        expiresAt
      };

    } catch (error) {
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Validate JWT token
   */
  static validateToken(token: string): TokenValidationResult {
    try {
      if (!token || typeof token !== 'string') {
        return {
          valid: false,
          error: 'Token is required'
        };
      }

      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      // Additional payload validation
      if (!payload.userId || !payload.email || !payload.role) {
        return {
          valid: false,
          error: 'Invalid token payload'
        };
      }

      return {
        valid: true,
        payload
      };

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token has expired',
          expired: true
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token'
        };
      }

      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const validation = this.validateToken(refreshToken);
      
      if (!validation.valid || !validation.payload) {
        throw new InvalidTokenError();
      }

      // Get current user data
      const user = await prisma.user.findUnique({
        where: { id: validation.payload.userId }
      });

      if (!user || !user.isActive) {
        throw new UserNotFoundError(validation.payload.email);
      }

      // Generate new tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

      return {
        success: true,
        user: this.toAuthUser(user),
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt
      };

    } catch (error) {
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.HASH_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iss: 'geargrab-auth',
      aud: 'geargrab-app'
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '1h',
      algorithm: 'HS256'
    });
  }

  /**
   * Generate refresh token
   */
  private static generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      iss: 'geargrab-auth',
      aud: 'geargrab-app'
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256'
    });
  }

  /**
   * Convert User to AuthUser
   */
  private static toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified || false
    };
  }

  /**
   * Validate login credentials
   */
  private static validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || typeof credentials.email !== 'string') {
      throw new AuthenticationError('Email is required', 'VALIDATION_ERROR');
    }

    if (!credentials.password || typeof credentials.password !== 'string') {
      throw new AuthenticationError('Password is required', 'VALIDATION_ERROR');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new AuthenticationError('Invalid email format', 'VALIDATION_ERROR');
    }
  }

  /**
   * Validate registration input
   */
  private static validateRegisterInput(input: RegisterInput): void {
    if (!input.email || typeof input.email !== 'string') {
      throw new AuthenticationError('Email is required', 'VALIDATION_ERROR');
    }

    if (!input.password || typeof input.password !== 'string') {
      throw new AuthenticationError('Password is required', 'VALIDATION_ERROR');
    }

    if (!input.name || typeof input.name !== 'string') {
      throw new AuthenticationError('Name is required', 'VALIDATION_ERROR');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new AuthenticationError('Invalid email format', 'VALIDATION_ERROR');
    }

    if (input.password.length < SECURITY_CONFIG.auth.passwordMinLength) {
      throw new AuthenticationError(
        `Password must be at least ${SECURITY_CONFIG.auth.passwordMinLength} characters long`,
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Log failed login attempt
   */
  private static async logFailedAttempt(email: string, reason: string): Promise<void> {
    try {
      await prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          reason,
          ipAddress: '', // TODO: Get from request
          userAgent: '', // TODO: Get from request
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log login attempt:', error);
    }
  }

  /**
   * Clear failed login attempts for user
   */
  private static async clearFailedAttempts(userId: string): Promise<void> {
    try {
      await prisma.loginAttempt.deleteMany({
        where: {
          user: {
            id: userId
          }
        }
      });
    } catch (error) {
      console.error('Failed to clear login attempts:', error);
    }
  }
}
