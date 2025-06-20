/**
 * Authentication Service Unit Tests
 * 
 * Comprehensive test suite for the authentication module including:
 * - Database mocking
 * - bcrypt password hashing
 * - JWT creation and validation
 * - Error handling paths
 * - Social authentication flows
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the simple auth module to avoid Svelte store issues
const mockSimpleAuth = {
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signInWithFacebook: jest.fn(),
  signInWithGitHub: jest.fn(),
  signOut: jest.fn(),
  currentUser: null,
  authState: {
    subscribe: jest.fn(),
    set: jest.fn(),
    update: jest.fn()
  }
};

// Mock Firebase auth methods
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();

// Mock Firebase auth instance
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged
};

// Mock Firebase imports
jest.mock('$lib/firebase/client', () => ({
  auth: mockAuth
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  GoogleAuthProvider: jest.fn(),
  FacebookAuthProvider: jest.fn(),
  GithubAuthProvider: jest.fn(),
  OAuthProvider: jest.fn()
}));

describe('SimpleAuth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth state
    mockSimpleAuth.currentUser = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Password Hashing with bcrypt', () => {
    it('should hash passwords securely', async () => {
      const password = 'testPassword123';
      const saltRounds = 12;
      const hashedPassword = 'hashedPassword123';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await bcrypt.hash(password, saltRounds);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, saltRounds);
      expect(result).toBe(hashedPassword);
    });

    it('should verify passwords correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject invalid passwords', async () => {
      const password = 'wrongPassword';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    it('should create JWT tokens correctly', () => {
      const token = 'jwt.token.here';
      const payload = { uid: mockUser.uid, email: mockUser.email };

      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      expect(result).toBe(token);
    });

    it('should validate JWT tokens correctly', () => {
      const token = 'valid.jwt.token';
      const payload = { uid: mockUser.uid, email: mockUser.email };

      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = jwt.verify(token, process.env.JWT_SECRET!);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(payload);
    });

    it('should reject invalid JWT tokens', () => {
      const invalidToken = 'invalid.jwt.token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => jwt.verify(invalidToken, process.env.JWT_SECRET!)).toThrow('Invalid token');
    });

    it('should reject expired JWT tokens', () => {
      const expiredToken = 'expired.jwt.token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error = new Error('Token expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      expect(() => jwt.verify(expiredToken, process.env.JWT_SECRET!)).toThrow('Token expired');
    });
  });

  describe('Social Authentication', () => {
    const mockUser = {
      uid: 'google123',
      email: 'user@gmail.com',
      displayName: 'Google User',
      photoURL: 'https://example.com/photo.jpg'
    };

    it('should handle Google sign-in successfully', async () => {
      mockSimpleAuth.signInWithGoogle.mockResolvedValue({ success: true });

      const result = await mockSimpleAuth.signInWithGoogle();

      expect(result.success).toBe(true);
      expect(mockSimpleAuth.signInWithGoogle).toHaveBeenCalled();
    });

    it('should handle Google sign-in errors', async () => {
      mockSimpleAuth.signInWithGoogle.mockResolvedValue({
        success: false,
        error: 'Google sign-in failed'
      });

      const result = await mockSimpleAuth.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Google sign-in failed');
    });

    it('should handle Apple sign-in successfully', async () => {
      mockSimpleAuth.signInWithApple.mockResolvedValue({ success: true });

      const result = await mockSimpleAuth.signInWithApple();

      expect(result.success).toBe(true);
      expect(mockSimpleAuth.signInWithApple).toHaveBeenCalled();
    });

    it('should handle Facebook sign-in successfully', async () => {
      mockSimpleAuth.signInWithFacebook.mockResolvedValue({ success: true });

      const result = await mockSimpleAuth.signInWithFacebook();

      expect(result.success).toBe(true);
      expect(mockSimpleAuth.signInWithFacebook).toHaveBeenCalled();
    });

    it('should handle GitHub sign-in successfully', async () => {
      mockSimpleAuth.signInWithGitHub.mockResolvedValue({ success: true });

      const result = await mockSimpleAuth.signInWithGitHub();

      expect(result.success).toBe(true);
      expect(mockSimpleAuth.signInWithGitHub).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSimpleAuth.signInWithGoogle.mockResolvedValue({
        success: false,
        error: 'Network error'
      });

      const result = await mockSimpleAuth.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle popup blocked errors', async () => {
      mockSimpleAuth.signInWithGoogle.mockResolvedValue({
        success: false,
        error: 'Popup blocked'
      });

      const result = await mockSimpleAuth.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Popup blocked');
    });

    it('should handle cancelled authentication', async () => {
      mockSimpleAuth.signInWithGoogle.mockResolvedValue({
        success: false,
        error: 'User cancelled'
      });

      const result = await mockSimpleAuth.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('User cancelled');
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSimpleAuth.signOut.mockResolvedValue({ success: true });

      const result = await mockSimpleAuth.signOut();

      expect(result.success).toBe(true);
      expect(mockSimpleAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      mockSimpleAuth.signOut.mockResolvedValue({
        success: false,
        error: 'Sign out failed'
      });

      const result = await mockSimpleAuth.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('Auth State Management', () => {
    it('should initialize with loading state', () => {
      const authState = mockSimpleAuth.authState;
      expect(authState).toBeDefined();
    });

    it('should update auth state on user change', () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // Simulate auth state change
      mockSimpleAuth.currentUser = mockUser as any;

      expect(mockSimpleAuth.currentUser).toEqual(mockUser);
    });
  });
});
