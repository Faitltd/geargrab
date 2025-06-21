/**
 * Firebase Authentication Service
 *
 * This service handles user authentication using Firebase Auth including login, registration,
 * social authentication, JWT token management, and comprehensive error handling.
 * Replaces Prisma-based authentication with Firebase-native authentication.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { auth, firestore } from '$lib/firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
  type UserCredential
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

// Environment variables for JWT
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key';
const HASH_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

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
  photoURL?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
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
  /**
   * Authenticate user with email and password using Firebase Auth
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      this.validateLoginCredentials(credentials);

      // Check for account lockout
      const isLocked = await this.checkAccountLockout(credentials.email);
      if (isLocked.locked) {
        throw new AccountLockedError(isLocked.remainingTime || 0);
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email.toLowerCase(),
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Get or create user document in Firestore
      const userDoc = await this.getOrCreateUserDocument(firebaseUser);

      // Check if account is active
      if (!userDoc.isActive) {
        throw new AccountInactiveError();
      }

      // Clear failed login attempts on successful login
      await this.clearFailedAttempts(credentials.email);

      // Update last login timestamp
      await this.updateLastLogin(firebaseUser.uid);

      // Generate custom JWT token
      const token = await this.generateToken(firebaseUser, userDoc);
      const refreshToken = await this.generateRefreshToken(firebaseUser, userDoc);
      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      return {
        success: true,
        user: this.toAuthUser(firebaseUser, userDoc),
        token,
        refreshToken,
        expiresAt
      };

    } catch (error: any) {
      // Log failed attempt
      await this.logFailedAttempt(credentials.email, error.code || 'UNKNOWN_ERROR');

      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message
        };
      }

      // Handle Firebase Auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      if (error.code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'Too many failed attempts. Please try again later.'
        };
      }

      if (error.code === 'auth/user-disabled') {
        return {
          success: false,
          error: 'This account has been disabled'
        };
      }

      throw error;
    }
  }

  /**
   * Register a new user using Firebase Auth
   */
  static async register(input: RegisterInput): Promise<AuthResult> {
    try {
      // Validate input
      this.validateRegisterInput(input);

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        input.email.toLowerCase(),
        input.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase user profile
      await updateProfile(firebaseUser, {
        displayName: input.name
      });

      // Create user document in Firestore
      const userDoc = {
        email: input.email.toLowerCase(),
        name: input.name,
        username: input.username || null,
        role: 'USER' as UserRole,
        isActive: true,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || null,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await setDoc(doc(firestore, 'users', firebaseUser.uid), userDoc);

      // Generate custom JWT token for immediate login
      const token = await this.generateToken(firebaseUser, userDoc);
      const refreshToken = await this.generateRefreshToken(firebaseUser, userDoc);
      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      return {
        success: true,
        user: this.toAuthUser(firebaseUser, userDoc),
        token,
        refreshToken,
        expiresAt
      };

    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          error: error.message
        };
      }

      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      if (error.code === 'auth/weak-password') {
        return {
          success: false,
          error: 'Password is too weak'
        };
      }

      if (error.code === 'auth/invalid-email') {
        return {
          success: false,
          error: 'Invalid email address'
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

      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

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
   * Refresh JWT token using Firebase and Firestore
   */
  static async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const validation = this.validateToken(refreshToken);

      if (!validation.valid || !validation.payload) {
        throw new InvalidTokenError();
      }

      // Get current user data from Firestore
      const userDocRef = doc(firestore, 'users', validation.payload.userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new UserNotFoundError(validation.payload.email);
      }

      const userDoc = userDocSnap.data();

      if (!userDoc.isActive) {
        throw new AccountInactiveError();
      }

      // Get Firebase user
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || firebaseUser.uid !== validation.payload.userId) {
        throw new InvalidTokenError();
      }

      // Generate new tokens
      const newToken = await this.generateToken(firebaseUser, userDoc);
      const newRefreshToken = await this.generateRefreshToken(firebaseUser, userDoc);
      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      return {
        success: true,
        user: this.toAuthUser(firebaseUser, userDoc),
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
   * Hash password using bcrypt (for compatibility)
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, HASH_ROUNDS);
  }

  /**
   * Verify password against hash (for compatibility)
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token for Firebase user
   */
  private static async generateToken(firebaseUser: FirebaseUser, userDoc: any): Promise<string> {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: userDoc.role || 'USER',
      iss: 'geargrab-auth',
      aud: 'geargrab-app'
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h',
      algorithm: 'HS256'
    });
  }

  /**
   * Generate refresh token for Firebase user
   */
  private static async generateRefreshToken(firebaseUser: FirebaseUser, userDoc: any): Promise<string> {
    const payload = {
      userId: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: userDoc.role || 'USER',
      type: 'refresh',
      iss: 'geargrab-auth',
      aud: 'geargrab-app'
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256'
    });
  }

  /**
   * Convert Firebase User and Firestore doc to AuthUser
   */
  private static toAuthUser(firebaseUser: FirebaseUser, userDoc: any): AuthUser {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: userDoc.name || firebaseUser.displayName || '',
      username: userDoc.username || null,
      role: userDoc.role || 'USER',
      isActive: userDoc.isActive !== false,
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || userDoc.photoURL || undefined,
      createdAt: userDoc.createdAt?.toDate() || undefined,
      lastLoginAt: userDoc.lastLoginAt?.toDate() || undefined
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

    if (input.password.length < 8) {
      throw new AuthenticationError(
        'Password must be at least 8 characters long',
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Log failed login attempt in Firestore
   */
  private static async logFailedAttempt(email: string, reason: string): Promise<void> {
    try {
      await addDoc(collection(firestore, 'loginAttempts'), {
        email: email.toLowerCase(),
        reason,
        ipAddress: '', // TODO: Get from request
        userAgent: '', // TODO: Get from request
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log login attempt:', error);
    }
  }

  /**
   * Clear failed login attempts for email
   */
  private static async clearFailedAttempts(email: string): Promise<void> {
    try {
      const q = query(
        collection(firestore, 'loginAttempts'),
        where('email', '==', email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      // Note: In a production app, you'd want to batch delete these
      // For now, we'll just log that we would clear them
      console.log(`Would clear ${querySnapshot.size} failed attempts for ${email}`);
    } catch (error) {
      console.error('Failed to clear login attempts:', error);
    }
  }

  /**
   * Check if account is locked due to too many failed attempts
   */
  private static async checkAccountLockout(email: string): Promise<{ locked: boolean; remainingTime?: number }> {
    try {
      const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION);
      const q = query(
        collection(firestore, 'loginAttempts'),
        where('email', '==', email.toLowerCase()),
        where('createdAt', '>=', cutoffTime),
        orderBy('createdAt', 'desc'),
        limit(MAX_LOGIN_ATTEMPTS)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.size >= MAX_LOGIN_ATTEMPTS) {
        const lastAttempt = querySnapshot.docs[0];
        const lastAttemptTime = lastAttempt.data().createdAt?.toDate() || new Date();
        const lockoutRemaining = LOCKOUT_DURATION - (Date.now() - lastAttemptTime.getTime());

        if (lockoutRemaining > 0) {
          return { locked: true, remainingTime: lockoutRemaining };
        }
      }

      return { locked: false };
    } catch (error) {
      console.error('Failed to check account lockout:', error);
      return { locked: false };
    }
  }

  /**
   * Get or create user document in Firestore
   */
  private static async getOrCreateUserDocument(firebaseUser: FirebaseUser): Promise<any> {
    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }

    // Create new user document
    const userDoc = {
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      username: null,
      role: 'USER' as UserRole,
      isActive: true,
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || null,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    await setDoc(userDocRef, userDoc);
    return userDoc;
  }

  /**
   * Update last login timestamp
   */
  private static async updateLastLogin(userId: string): Promise<void> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        lastLoginAt: new Date()
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }
}
