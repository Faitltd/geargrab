import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { 
  User, 
  UserProfile, 
  CreateUserDTO, 
  UserQueryParams,
  PaginatedUserResponse 
} from '$lib/types/user';
import { 
  validateCreateUserDTO, 
  validateUserQueryParams 
} from '$lib/validation/user-schemas';
import { 
  hasRole, 
  isAdmin, 
  toUserReference,
  getUserInitials 
} from '$lib/types/user-utils';
import { UserRole, UserStatus } from '$lib/types/user';
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';

/**
 * Users API Endpoint
 * 
 * This endpoint demonstrates how to use the User TypeScript interfaces
 * with proper validation, type safety, and JSDoc documentation.
 */

/**
 * Get users with filtering and pagination
 * 
 * @description Retrieves a paginated list of users with optional filtering
 * @requires Admin or Moderator role
 */
export const GET: RequestHandler = async (event) => {
  // 🔒 REQUIRE ADMIN OR MODERATOR AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAdminOrEditor(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, userRole } = authResult;
  console.log(`✅ Users list accessed by: ${userId} (roles: ${userRole?.roles.join(', ')})`);

  try {
    // Parse and validate query parameters
    const url = new URL(event.request.url);
    const queryParams: any = {
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      sortBy: url.searchParams.get('sortBy') || 'createdAt',
      sortOrder: url.searchParams.get('sortOrder') || 'desc'
    };

    // Only add optional parameters if they exist
    const role = url.searchParams.get('role');
    if (role) queryParams.role = role;

    const status = url.searchParams.get('status');
    if (status) queryParams.status = status;

    const search = url.searchParams.get('search');
    if (search) queryParams.search = search;

    const validationResult = validateUserQueryParams(queryParams);
    if (!validationResult.success) {
      return json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const validatedParams: UserQueryParams = validationResult.data;

    // Mock user data (in real app, this would come from database)
    const mockUsers: UserProfile[] = generateMockUsers();

    // Apply filtering
    let filteredUsers = mockUsers;
    
    if (validatedParams.role) {
      filteredUsers = filteredUsers.filter(user => 
        hasRole(user, validatedParams.role!)
      );
    }

    if (validatedParams.status) {
      filteredUsers = filteredUsers.filter(user => 
        user.status === validatedParams.status
      );
    }

    if (validatedParams.search) {
      const searchTerm = validatedParams.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      const aValue = a[validatedParams.sortBy as keyof UserProfile];
      const bValue = b[validatedParams.sortBy as keyof UserProfile];
      
      if (aValue < bValue) return validatedParams.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return validatedParams.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(
      validatedParams.offset,
      validatedParams.offset + validatedParams.limit
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validatedParams.limit);
    const currentPage = Math.floor(validatedParams.offset / validatedParams.limit);

    const response: PaginatedUserResponse = {
      users: paginatedUsers,
      total,
      page: currentPage,
      limit: validatedParams.limit,
      totalPages,
      hasNext: currentPage < totalPages - 1,
      hasPrevious: currentPage > 0
    };

    return json({
      success: true,
      message: 'Users retrieved successfully',
      data: response,
      requestedBy: {
        userId,
        roles: userRole?.roles,
        isAdmin: userRole?.isAdmin
      }
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    }, { status: 500 });
  }
};

/**
 * Create a new user
 * 
 * @description Creates a new user account with validation
 * @requires Admin role
 */
export const POST: RequestHandler = async (event) => {
  // 🔒 REQUIRE ADMIN AUTHENTICATION
  const authResult = await EnhancedAuthMiddleware.requireAdmin(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  const { userId, userRole } = authResult;
  console.log(`✅ User creation initiated by: ${userId} (roles: ${userRole?.roles.join(', ')})`);

  try {
    // Parse and validate request body
    const requestData = await event.request.json();
    
    const validationResult = validateCreateUserDTO(requestData);
    if (!validationResult.success) {
      return json({
        success: false,
        error: 'Validation failed',
        message: 'Please correct the following errors:',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const userData: CreateUserDTO = validationResult.data;

    // Check if email already exists (mock check)
    const existingUser = mockCheckEmailExists(userData.email);
    if (existingUser) {
      return json({
        success: false,
        error: 'Email already exists',
        message: 'A user with this email address already exists'
      }, { status: 409 });
    }

    // Create new user (mock implementation)
    const newUser: UserProfile = await createMockUser(userData, userId);

    // Return user reference (safe for response)
    const userReference = toUserReference(newUser);

    return json({
      success: true,
      message: 'User created successfully',
      user: {
        ...userReference,
        initials: getUserInitials(newUser),
        roles: newUser.roles,
        status: newUser.status,
        createdAt: newUser.createdAt
      },
      createdBy: {
        userId,
        roles: userRole?.roles
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    if (error instanceof SyntaxError) {
      return json({
        success: false,
        error: 'Invalid request format',
        message: 'Please send valid JSON data'
      }, { status: 400 });
    }

    return json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create user'
    }, { status: 500 });
  }
};

/**
 * Generate mock users for demonstration
 * 
 * @returns Array of mock UserProfile objects
 */
function generateMockUsers(): UserProfile[] {
  const mockUsers: UserProfile[] = [
    {
      id: 'user_001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      roles: [UserRole.USER],
      createdAt: new Date('2024-01-15T10:30:00Z'),
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      avatarUrl: 'https://example.com/avatars/john.jpg',
      phoneNumber: '+1-555-123-4567',
      dateOfBirth: new Date('1990-05-15'),
      bio: 'Software developer passionate about TypeScript',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: new Date('2024-06-18T14:30:00Z'),
      updatedAt: new Date('2024-06-18T10:15:00Z')
    },
    {
      id: 'user_002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      roles: [UserRole.USER, UserRole.EDITOR],
      createdAt: new Date('2024-02-20T09:15:00Z'),
      firstName: 'Jane',
      lastName: 'Smith',
      username: 'janesmith',
      avatarUrl: null,
      phoneNumber: null,
      dateOfBirth: new Date('1985-08-22'),
      bio: 'Content creator and editor',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: new Date('2024-06-17T16:45:00Z'),
      updatedAt: new Date('2024-06-17T12:30:00Z')
    },
    {
      id: 'user_003',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      roles: [UserRole.ADMIN],
      createdAt: new Date('2024-01-01T08:00:00Z'),
      firstName: 'Mike',
      lastName: 'Johnson',
      username: 'mikejohnson',
      avatarUrl: 'https://example.com/avatars/mike.jpg',
      phoneNumber: '+1-555-987-6543',
      dateOfBirth: new Date('1980-12-10'),
      bio: 'System administrator',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: new Date('2024-06-18T08:00:00Z'),
      updatedAt: new Date('2024-06-18T08:00:00Z')
    }
  ];

  return mockUsers;
}

/**
 * Mock function to check if email exists
 * 
 * @param email - Email to check
 * @returns True if email exists
 */
function mockCheckEmailExists(email: string): boolean {
  const existingEmails = [
    'john.doe@example.com',
    'jane.smith@example.com',
    'mike.johnson@example.com'
  ];
  
  return existingEmails.includes(email.toLowerCase());
}

/**
 * Mock function to create a new user
 * 
 * @param userData - User data from CreateUserDTO
 * @param createdBy - ID of the user creating this account
 * @returns Promise resolving to new UserProfile
 */
async function createMockUser(userData: CreateUserDTO, createdBy: string): Promise<UserProfile> {
  // Simulate database save delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const now = new Date();
  
  const newUser: UserProfile = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: userData.name,
    email: userData.email,
    roles: userData.roles || [UserRole.USER],
    createdAt: now,
    firstName: userData.firstName || userData.name.split(' ')[0] || '',
    lastName: userData.lastName || userData.name.split(' ').slice(1).join(' ') || '',
    username: userData.username || null,
    avatarUrl: null,
    phoneNumber: null,
    dateOfBirth: null,
    bio: null,
    status: UserStatus.PENDING_VERIFICATION,
    emailVerified: false,
    lastLoginAt: null,
    updatedAt: now
  };

  console.log('👤 Mock user created:', {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    roles: newUser.roles,
    createdBy
  });

  return newUser;
}
