/**
 * UserService Test Suite
 * 
 * Comprehensive Jest tests for UserService with database mocking
 * and error handling verification, specifically testing duplicate email scenarios.
 */

import {
  UserService,
  DuplicateEmailError,
  DuplicateUsernameError,
  UserNotFoundError,
  ValidationError,
  UserServiceError
} from '../UserService';
import type { CreateUserInput, UpdateUserInput } from '../UserService';

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
  $transaction: jest.fn(),
  $disconnect: jest.fn()
};

// Mock the prisma import
jest.mock('$lib/database/prisma', () => ({
  prisma: mockPrisma
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123')
}));

describe('UserService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserInput: CreateUserInput = {
      email: 'test@example.com',
      password: 'securePassword123',
      name: 'Test User',
      username: 'testuser'
    };

    const mockCreatedUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: null,
      bio: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should create a user successfully with valid input', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // No existing user by email
        .mockResolvedValueOnce(null); // No existing user by username
      
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await UserService.createUser(validUserInput);

      // Assert
      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { email: 'test@example.com' }
      });
      expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { username: 'testuser' }
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
          role: 'USER',
          isActive: true
        }
      });
    });

    it('should throw DuplicateEmailError when email already exists', async () => {
      // Arrange
      const existingUser = { ...mockCreatedUser, email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      // Act & Assert
      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow(DuplicateEmailError);

      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow('User with email test@example.com already exists');

      // Verify that we checked for email existence
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });

      // Verify that user creation was not attempted
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw DuplicateEmailError with case-insensitive email check', async () => {
      // Arrange
      const inputWithUppercaseEmail = {
        ...validUserInput,
        email: 'TEST@EXAMPLE.COM'
      };
      
      const existingUser = { ...mockCreatedUser, email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      // Act & Assert
      await expect(UserService.createUser(inputWithUppercaseEmail))
        .rejects
        .toThrow(DuplicateEmailError);

      // Verify email was normalized to lowercase
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should throw DuplicateUsernameError when username already exists', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // No existing user by email
        .mockResolvedValueOnce(mockCreatedUser); // Existing user by username

      // Act & Assert
      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow(DuplicateUsernameError);

      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow('User with username testuser already exists');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database constraint violation for duplicate email', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // Initial check passes
        .mockResolvedValueOnce(null);
      
      // Simulate race condition where email is created between check and insert
      const constraintError = new Error('Unique constraint failed on the fields: (`email`)');
      mockPrisma.user.create.mockRejectedValue(constraintError);

      // Act & Assert
      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow(DuplicateEmailError);

      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should handle database constraint violation for duplicate username', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      const constraintError = new Error('Unique constraint failed on the fields: (`username`)');
      mockPrisma.user.create.mockRejectedValue(constraintError);

      // Act & Assert
      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow(DuplicateUsernameError);
    });

    it('should throw ValidationError for invalid email format', async () => {
      // Arrange
      const invalidEmailInput = {
        ...validUserInput,
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(UserService.createUser(invalidEmailInput))
        .rejects
        .toThrow(ValidationError);

      await expect(UserService.createUser(invalidEmailInput))
        .rejects
        .toThrow('Invalid email format');

      // Verify no database calls were made
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing required fields', async () => {
      // Test missing email
      await expect(UserService.createUser({
        ...validUserInput,
        email: ''
      })).rejects.toThrow('Email is required');

      // Test missing password
      await expect(UserService.createUser({
        ...validUserInput,
        password: ''
      })).rejects.toThrow('Password is required');

      // Test missing name
      await expect(UserService.createUser({
        ...validUserInput,
        name: ''
      })).rejects.toThrow('Name is required');
    });

    it('should throw ValidationError for weak password', async () => {
      // Arrange
      const weakPasswordInput = {
        ...validUserInput,
        password: '123'
      };

      // Act & Assert
      await expect(UserService.createUser(weakPasswordInput))
        .rejects
        .toThrow('Password must be at least 8 characters long');
    });

    it('should throw ValidationError for invalid username format', async () => {
      // Test username with special characters
      await expect(UserService.createUser({
        ...validUserInput,
        username: 'test@user!'
      })).rejects.toThrow('Username can only contain letters, numbers, underscores, and hyphens');

      // Test username too short
      await expect(UserService.createUser({
        ...validUserInput,
        username: 'ab'
      })).rejects.toThrow('Username must be between 3 and 30 characters');

      // Test username too long
      await expect(UserService.createUser({
        ...validUserInput,
        username: 'a'.repeat(31)
      })).rejects.toThrow('Username must be between 3 and 30 characters');
    });

    it('should create user without username when not provided', async () => {
      // Arrange
      const inputWithoutUsername = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'Test User'
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // No existing user by email
      mockPrisma.user.create.mockResolvedValue({
        ...mockCreatedUser,
        username: null
      });

      // Act
      const result = await UserService.createUser(inputWithoutUsername);

      // Assert
      expect(result.username).toBeNull();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1); // Only email check
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          username: null,
          role: 'USER',
          isActive: true
        }
      });
    });

    it('should handle generic database errors', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      const genericError = new Error('Database connection failed');
      mockPrisma.user.create.mockRejectedValue(genericError);

      // Act & Assert
      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow(UserServiceError);

      await expect(UserService.createUser(validUserInput))
        .rejects
        .toThrow('Failed to create user due to database error');
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockPrisma.user);

      // Act
      const result = await UserService.emailExists('test@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should return false when email does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await UserService.emailExists('nonexistent@example.com');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for invalid email input', async () => {
      // Act & Assert
      expect(await UserService.emailExists('')).toBe(false);
      expect(await UserService.emailExists(null as any)).toBe(false);
      expect(await UserService.emailExists(undefined as any)).toBe(false);

      // Verify no database calls were made
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase before checking', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      await UserService.emailExists('TEST@EXAMPLE.COM');

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });
  });

  describe('getUserById', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: null,
      bio: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should return user when found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getUserById('user_123');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' }
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getUserById('nonexistent_id'))
        .rejects
        .toThrow(UserNotFoundError);

      await expect(UserService.getUserById('nonexistent_id'))
        .rejects
        .toThrow('User not found: nonexistent_id');
    });

    it('should throw ValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(UserService.getUserById(''))
        .rejects
        .toThrow(ValidationError);

      await expect(UserService.getUserById(null as any))
        .rejects
        .toThrow('Valid user ID is required');

      // Verify no database calls were made
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: null,
      bio: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should return user when found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getUserByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getUserByEmail('nonexistent@example.com'))
        .rejects
        .toThrow(UserNotFoundError);
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      await UserService.getUserByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    it('should throw ValidationError for invalid email', async () => {
      // Act & Assert
      await expect(UserService.getUserByEmail(''))
        .rejects
        .toThrow('Valid email is required');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: null,
      bio: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    const updateInput: UpdateUserInput = {
      name: 'Updated Name',
      bio: 'Updated bio'
    };

    it('should update user successfully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateInput, updatedAt: new Date() };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await UserService.updateUser('user_123', updateInput);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(result.bio).toBe('Updated bio');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: {
          ...updateInput,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.updateUser('nonexistent_id', updateInput))
        .rejects
        .toThrow(UserNotFoundError);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw DuplicateUsernameError when updating to existing username', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // User exists
        .mockResolvedValueOnce({ id: 'other_user', username: 'newusername' }); // Username taken

      const updateWithUsername = { username: 'newusername' };

      // Act & Assert
      await expect(UserService.updateUser('user_123', updateWithUsername))
        .rejects
        .toThrow(DuplicateUsernameError);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same username', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, updatedAt: new Date() };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const updateWithSameUsername = { username: 'testuser' };

      // Act
      await UserService.updateUser('user_123', updateWithSameUsername);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1); // Only initial user check
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should handle database constraint violation for username', async () => {
      // Arrange
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null); // Username check passes

      const constraintError = new Error('Unique constraint failed on the fields: (`username`)');
      mockPrisma.user.update.mockRejectedValue(constraintError);

      // Act & Assert
      await expect(UserService.updateUser('user_123', { username: 'newusername' }))
        .rejects
        .toThrow(DuplicateUsernameError);
    });
  });

  describe('deleteUser', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      avatar: null,
      bio: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should soft delete user successfully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      // Act
      await UserService.deleteUser('user_123');

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.deleteUser('nonexistent_id'))
        .rejects
        .toThrow(UserNotFoundError);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(UserService.deleteUser(''))
        .rejects
        .toThrow('Valid user ID is required');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
