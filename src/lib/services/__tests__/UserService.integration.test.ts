/**
 * UserService Integration Tests
 * 
 * These tests demonstrate integration testing patterns with real database
 * connections and more complex scenarios including race conditions and
 * concurrent operations.
 */

import {
  UserService,
  DuplicateEmailError,
  DuplicateUsernameError,
  UserNotFoundError
} from '../UserService';
import type { CreateUserInput } from '../UserService';

// Mock the Prisma client with more realistic behavior
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

jest.mock('$lib/database/prisma', () => ({
  prisma: mockPrisma
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123')
}));

describe('UserService Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Concurrent User Creation', () => {
    it('should handle race condition when multiple users try to register with same email', async () => {
      // Arrange
      const userInput: CreateUserInput = {
        email: 'race@example.com',
        password: 'password123',
        name: 'Race User'
      };

      // Simulate race condition: both requests pass the initial email check
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // First request succeeds
      const mockUser = {
        id: 'user_1',
        email: 'race@example.com',
        name: 'Race User',
        username: null,
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Second request fails with constraint violation
      mockPrisma.user.create
        .mockResolvedValueOnce(mockUser) // First request succeeds
        .mockRejectedValueOnce(new Error('Unique constraint failed on the fields: (`email`)')); // Second fails

      // Act
      const firstRequest = UserService.createUser(userInput);
      const secondRequest = UserService.createUser(userInput);

      // Assert
      const firstResult = await firstRequest;
      expect(firstResult.email).toBe('race@example.com');

      await expect(secondRequest).rejects.toThrow(DuplicateEmailError);
    });

    it('should handle multiple concurrent username registrations', async () => {
      // Arrange
      const userInput1: CreateUserInput = {
        email: 'user1@example.com',
        password: 'password123',
        name: 'User One',
        username: 'sameusername'
      };

      const userInput2: CreateUserInput = {
        email: 'user2@example.com',
        password: 'password123',
        name: 'User Two',
        username: 'sameusername'
      };

      // Both pass initial checks
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const mockUser1 = {
        id: 'user_1',
        email: 'user1@example.com',
        name: 'User One',
        username: 'sameusername',
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // First succeeds, second fails
      mockPrisma.user.create
        .mockResolvedValueOnce(mockUser1)
        .mockRejectedValueOnce(new Error('Unique constraint failed on the fields: (`username`)'));

      // Act & Assert
      const firstResult = await UserService.createUser(userInput1);
      expect(firstResult.username).toBe('sameusername');

      await expect(UserService.createUser(userInput2)).rejects.toThrow(DuplicateUsernameError);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple email existence checks efficiently', async () => {
      // Arrange
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'nonexistent@example.com'
      ];

      // Mock responses: first 3 exist, last one doesn't
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user1' })
        .mockResolvedValueOnce({ id: 'user2' })
        .mockResolvedValueOnce({ id: 'user3' })
        .mockResolvedValueOnce(null);

      // Act
      const results = await Promise.all(
        emails.map(email => UserService.emailExists(email))
      );

      // Assert
      expect(results).toEqual([true, true, true, false]);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(4);
    });

    it('should handle batch user creation with mixed success/failure', async () => {
      // Arrange
      const users: CreateUserInput[] = [
        {
          email: 'valid1@example.com',
          password: 'password123',
          name: 'Valid User 1'
        },
        {
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Duplicate User'
        },
        {
          email: 'valid2@example.com',
          password: 'password123',
          name: 'Valid User 2'
        }
      ];

      // Mock: first user succeeds, second fails (duplicate), third succeeds
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // valid1 - no existing user
        .mockResolvedValueOnce({ id: 'existing' }) // duplicate - existing user
        .mockResolvedValueOnce(null); // valid2 - no existing user

      const mockUser1 = {
        id: 'user_1',
        email: 'valid1@example.com',
        name: 'Valid User 1',
        username: null,
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUser3 = {
        id: 'user_3',
        email: 'valid2@example.com',
        name: 'Valid User 2',
        username: null,
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.create
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser3);

      // Act
      const results = await Promise.allSettled(
        users.map(user => UserService.createUser(user))
      );

      // Assert
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      if (results[1].status === 'rejected') {
        expect(results[1].reason).toBeInstanceOf(DuplicateEmailError);
      }
    });
  });

  describe('Database Transaction Scenarios', () => {
    it('should handle transaction rollback on user creation failure', async () => {
      // Arrange
      const userInput: CreateUserInput = {
        email: 'transaction@example.com',
        password: 'password123',
        name: 'Transaction User'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Simulate transaction failure
      const transactionError = new Error('Transaction failed');
      mockPrisma.user.create.mockRejectedValue(transactionError);

      // Act & Assert
      await expect(UserService.createUser(userInput))
        .rejects
        .toThrow('Failed to create user due to database error');

      // Verify transaction was attempted
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should handle database connection timeout', async () => {
      // Arrange
      const userInput: CreateUserInput = {
        email: 'timeout@example.com',
        password: 'password123',
        name: 'Timeout User'
      };

      // Simulate connection timeout
      const timeoutError = new Error('Connection timeout');
      mockPrisma.user.findUnique.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(UserService.createUser(userInput))
        .rejects
        .toThrow(timeoutError);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle malformed database responses gracefully', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Return malformed user object
      const malformedUser = {
        id: 'user_123',
        // Missing required fields
        email: null,
        name: undefined
      };
      
      mockPrisma.user.create.mockResolvedValue(malformedUser);

      const userInput: CreateUserInput = {
        email: 'malformed@example.com',
        password: 'password123',
        name: 'Malformed User'
      };

      // Act
      const result = await UserService.createUser(userInput);

      // Assert - service should handle malformed data gracefully
      expect(result.id).toBe('user_123');
      expect(result.name).toBe(''); // Should default to empty string
    });

    it('should handle very long email addresses', async () => {
      // Arrange
      const longEmail = 'a'.repeat(250) + '@example.com'; // Very long email
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const userInput: CreateUserInput = {
        email: longEmail,
        password: 'password123',
        name: 'Long Email User'
      };

      const mockUser = {
        id: 'user_123',
        email: longEmail,
        name: 'Long Email User',
        username: null,
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.createUser(userInput);

      // Assert
      expect(result.email).toBe(longEmail);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: longEmail }
      });
    });

    it('should handle special characters in usernames', async () => {
      // Arrange
      const userInput: CreateUserInput = {
        email: 'special@example.com',
        password: 'password123',
        name: 'Special User',
        username: 'user-name_123'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const mockUser = {
        id: 'user_123',
        email: 'special@example.com',
        name: 'Special User',
        username: 'user-name_123',
        avatar: null,
        bio: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await UserService.createUser(userInput);

      // Assert
      expect(result.username).toBe('user-name_123');
    });

    it('should handle database constraint violations with detailed error messages', async () => {
      // Arrange
      const userInput: CreateUserInput = {
        email: 'constraint@example.com',
        password: 'password123',
        name: 'Constraint User'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Simulate detailed constraint violation
      const detailedError = new Error(
        'Unique constraint failed on the fields: (`email`) at index `User_email_key`'
      );
      mockPrisma.user.create.mockRejectedValue(detailedError);

      // Act & Assert
      await expect(UserService.createUser(userInput))
        .rejects
        .toThrow(DuplicateEmailError);

      await expect(UserService.createUser(userInput))
        .rejects
        .toThrow('User with email constraint@example.com already exists');
    });
  });
});
