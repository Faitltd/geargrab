/**
 * AuthService Test Suite
 * 
 * Comprehensive Jest tests for AuthService with database mocking,
 * bcrypt password hashing, JWT creation and validation, and
 * invalid credentials error path testing.
 */

import {
  AuthService,
  InvalidCredentialsError,
  UserNotFoundError,
  AccountLockedError,
  TokenExpiredError,
  InvalidTokenError,
  EmailNotVerifiedError,
  AccountInactiveError,
  AuthenticationError
} from '../AuthService';
import type { LoginCredentials, RegisterInput, JWTPayload } from '../AuthService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the Prisma client
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  loginAttempt: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn()
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn()
};

// Mock the prisma import
jest.mock('$lib/database/prisma', () => ({
  prisma: mockPrisma
}));

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Mock security config
jest.mock('$lib/security/config', () => ({
  SECURITY_CONFIG: {
    crypto: {
      jwtSecret: 'test-jwt-secret',
      hashRounds: 12
    },
    auth: {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      sessionDuration: 60 * 60 * 1000, // 1 hour
      passwordMinLength: 8,
      requireEmailVerification: false
    }
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const validCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      passwordHash: 'hashed_password_123',
      role: 'USER',
      isActive: true,
      emailVerified: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      loginAttempts: []
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign
        .mockReturnValueOnce('mock_jwt_token') // Access token
        .mockReturnValueOnce('mock_refresh_token'); // Refresh token
      mockPrisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        role: 'USER',
        isActive: true,
        emailVerified: true
      });
      expect(result.token).toBe('mock_jwt_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Verify database interactions
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          loginAttempts: {
            where: {
              createdAt: {
                gte: expect.any(Date)
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password_123');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { lastLoginAt: expect.any(Date) }
      });
    });

    it('should throw InvalidCredentialsError for non-existent user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.loginAttempt.create.mockResolvedValue({});

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');

      // Verify failed attempt was logged
      expect(mockPrisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          reason: 'USER_NOT_FOUND',
          ipAddress: '',
          userAgent: '',
          createdAt: expect.any(Date)
        }
      });
    });

    it('should throw InvalidCredentialsError for wrong password', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);
      mockPrisma.loginAttempt.create.mockResolvedValue({});

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');

      // Verify password was checked
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password_123');
      
      // Verify failed attempt was logged
      expect(mockPrisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          reason: 'INVALID_PASSWORD',
          ipAddress: '',
          userAgent: '',
          createdAt: expect.any(Date)
        }
      });
    });

    it('should throw AccountLockedError when max login attempts exceeded', async () => {
      // Arrange
      const lockedUser = {
        ...mockUser,
        loginAttempts: Array(5).fill({
          id: 'attempt_1',
          email: 'test@example.com',
          reason: 'INVALID_PASSWORD',
          createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        })
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Account locked');
      expect(result.error).toContain('minutes');

      // Verify password was not checked
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw AccountInactiveError for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is inactive');
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      // Act
      const result = await AuthService.login(invalidCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');

      // Verify no database calls were made
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      // Test missing email
      let result = await AuthService.login({ email: '', password: 'password123' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required');

      // Test missing password
      result = await AuthService.login({ email: 'test@example.com', password: '' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should clear failed attempts on successful login', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock_token');
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.loginAttempt.deleteMany.mockResolvedValue({ count: 3 });

      // Act
      await AuthService.login(validCredentials);

      // Assert
      expect(mockPrisma.loginAttempt.deleteMany).toHaveBeenCalledWith({
        where: {
          user: {
            id: 'user_123'
          }
        }
      });
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const uppercaseCredentials = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.loginAttempt.create.mockResolvedValue({});

      // Act
      await AuthService.login(uppercaseCredentials);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: expect.any(Object)
      });
    });
  });

  describe('register', () => {
    const validRegisterInput: RegisterInput = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      username: 'newuser'
    };

    const mockNewUser = {
      id: 'user_456',
      email: 'newuser@example.com',
      name: 'New User',
      username: 'newuser',
      passwordHash: 'hashed_password_456',
      role: 'USER',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should register user successfully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockBcrypt.hash.mockResolvedValue('hashed_password_456');
      mockPrisma.user.create.mockResolvedValue(mockNewUser);
      mockJwt.sign
        .mockReturnValueOnce('mock_jwt_token')
        .mockReturnValueOnce('mock_refresh_token');

      // Act
      const result = await AuthService.register(validRegisterInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user_456',
        email: 'newuser@example.com',
        name: 'New User',
        username: 'newuser',
        role: 'USER',
        isActive: true,
        emailVerified: false
      });
      expect(result.token).toBe('mock_jwt_token');
      expect(result.refreshToken).toBe('mock_refresh_token');

      // Verify password was hashed
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);

      // Verify user was created
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          username: 'newuser',
          passwordHash: 'hashed_password_456',
          role: 'USER',
          isActive: true,
          emailVerified: false
        }
      });
    });

    it('should throw error for existing email', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockNewUser);

      // Act
      const result = await AuthService.register(validRegisterInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');

      // Verify user creation was not attempted
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should validate registration input', async () => {
      // Test missing email
      let result = await AuthService.register({
        ...validRegisterInput,
        email: ''
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required');

      // Test invalid email format
      result = await AuthService.register({
        ...validRegisterInput,
        email: 'invalid-email'
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');

      // Test missing password
      result = await AuthService.register({
        ...validRegisterInput,
        password: ''
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');

      // Test short password
      result = await AuthService.register({
        ...validRegisterInput,
        password: '123'
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');

      // Test missing name
      result = await AuthService.register({
        ...validRegisterInput,
        name: ''
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name is required');
    });
  });

  describe('hashPassword', () => {
    it('should hash password with correct rounds', async () => {
      // Arrange
      mockBcrypt.hash.mockResolvedValue('hashed_password');

      // Act
      const result = await AuthService.hashPassword('password123');

      // Assert
      expect(result).toBe('hashed_password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await AuthService.verifyPassword('password123', 'hashed_password');

      // Assert
      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should return false for incorrect password', async () => {
      // Arrange
      mockBcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await AuthService.verifyPassword('wrongpassword', 'hashed_password');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validateToken', () => {
    const mockPayload: JWTPayload = {
      userId: 'user_123',
      email: 'test@example.com',
      role: 'USER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'geargrab-auth',
      aud: 'geargrab-app'
    };

    it('should validate valid token', () => {
      // Arrange
      mockJwt.verify.mockReturnValue(mockPayload);

      // Act
      const result = AuthService.validateToken('valid_token');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid_token', 'test-jwt-secret');
    });

    it('should handle expired token', () => {
      // Arrange
      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      // Act
      const result = AuthService.validateToken('expired_token');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has expired');
      expect(result.expired).toBe(true);
    });

    it('should handle invalid token', () => {
      // Arrange
      const invalidError = new jwt.JsonWebTokenError('Invalid token');
      mockJwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      // Act
      const result = AuthService.validateToken('invalid_token');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    it('should handle missing token', () => {
      // Act
      const result = AuthService.validateToken('');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should validate token payload structure', () => {
      // Arrange
      const incompletePayload = {
        userId: 'user_123',
        // Missing email and role
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      mockJwt.verify.mockReturnValue(incompletePayload);

      // Act
      const result = AuthService.validateToken('incomplete_token');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token payload');
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      passwordHash: 'hashed_password',
      role: 'USER',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should refresh token successfully', async () => {
      // Arrange
      const mockPayload: JWTPayload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'geargrab-auth',
        aud: 'geargrab-app'
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');

      // Act
      const result = await AuthService.refreshToken('valid_refresh_token');

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
      expect(result.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        role: 'USER',
        isActive: true,
        emailVerified: true
      });
    });

    it('should handle invalid refresh token', async () => {
      // Arrange
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      // Act
      const result = await AuthService.refreshToken('invalid_refresh_token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or malformed token');
    });

    it('should handle user not found during refresh', async () => {
      // Arrange
      const mockPayload: JWTPayload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'geargrab-auth',
        aud: 'geargrab-app'
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await AuthService.refreshToken('valid_refresh_token');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found: test@example.com');
    });
  });

  describe('JWT Token Generation', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      passwordHash: 'hashed_password',
      role: 'USER',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should generate JWT with correct payload structure', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, loginAttempts: [] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      // Capture the JWT payload
      let capturedPayload: any;
      mockJwt.sign.mockImplementation((payload, secret, options) => {
        capturedPayload = payload;
        return 'mock_token';
      });

      // Act
      await AuthService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      // Assert
      expect(capturedPayload).toEqual({
        userId: 'user_123',
        email: 'test@example.com',
        role: 'USER',
        iss: 'geargrab-auth',
        aud: 'geargrab-app'
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        capturedPayload,
        'test-jwt-secret',
        {
          expiresIn: '1h',
          algorithm: 'HS256'
        }
      );
    });

    it('should generate refresh token with correct payload', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, loginAttempts: [] });
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      let refreshTokenPayload: any;
      mockJwt.sign
        .mockReturnValueOnce('access_token') // First call for access token
        .mockImplementationOnce((payload, secret, options) => { // Second call for refresh token
          refreshTokenPayload = payload;
          return 'refresh_token';
        });

      // Act
      await AuthService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      // Assert
      expect(refreshTokenPayload).toEqual({
        userId: 'user_123',
        email: 'test@example.com',
        role: 'USER',
        type: 'refresh',
        iss: 'geargrab-auth',
        aud: 'geargrab-app'
      });

      expect(mockJwt.sign).toHaveBeenNthCalledWith(2,
        refreshTokenPayload,
        'test-jwt-secret',
        {
          expiresIn: '7d',
          algorithm: 'HS256'
        }
      );
    });
  });

  describe('Security Features', () => {
    it('should handle concurrent login attempts', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'USER',
        isActive: true,
        emailVerified: true,
        loginAttempts: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock_token');
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Act - Simulate concurrent login attempts
      const loginPromises = Array(3).fill(null).map(() =>
        AuthService.login(credentials)
      );

      const results = await Promise.all(loginPromises);

      // Assert
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify database was called for each attempt
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(3);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle bcrypt errors gracefully', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'USER',
        isActive: true,
        emailVerified: true,
        loginAttempts: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      // Act & Assert
      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Bcrypt error');
    });

    it('should handle JWT signing errors gracefully', async () => {
      // Arrange
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'USER',
        isActive: true,
        emailVerified: true,
        loginAttempts: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockJwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      // Act & Assert
      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('JWT signing failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      // Test null credentials
      const result1 = await AuthService.login(null as any);
      expect(result1.success).toBe(false);

      // Test undefined credentials
      const result2 = await AuthService.login(undefined as any);
      expect(result2.success).toBe(false);

      // Test partial credentials
      const result3 = await AuthService.login({ email: 'test@example.com' } as any);
      expect(result3.success).toBe(false);
    });

    it('should handle very long email addresses', async () => {
      // Arrange
      const longEmail = 'a'.repeat(250) + '@example.com';
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.loginAttempt.create.mockResolvedValue({});

      // Act
      const result = await AuthService.login({
        email: longEmail,
        password: 'password123'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: longEmail.toLowerCase() },
        include: expect.any(Object)
      });
    });

    it('should handle special characters in passwords', async () => {
      // Arrange
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: 'hashed_special_password',
        role: 'USER',
        isActive: true,
        emailVerified: true,
        loginAttempts: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock_token');
      mockPrisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.login({
        email: 'test@example.com',
        password: specialPassword
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(specialPassword, 'hashed_special_password');
    });

    it('should handle malformed JWT tokens', () => {
      // Test various malformed tokens
      const malformedTokens = [
        'not.a.jwt',
        'header.payload', // Missing signature
        'header.payload.signature.extra', // Too many parts
        '', // Empty string
        'Bearer token', // With Bearer prefix
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid', // Invalid payload
      ];

      malformedTokens.forEach(token => {
        mockJwt.verify.mockImplementation(() => {
          throw new jwt.JsonWebTokenError('Invalid token');
        });

        const result = AuthService.validateToken(token);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token');
      });
    });
  });
});
