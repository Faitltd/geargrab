import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registrationSchema, validateRegistration, type RegistrationFormData } from '$lib/validation/registration';
import { commonSchemas } from '$lib/validation/common';
import { z } from 'zod';

/**
 * Registration Demo API Route with Zod Validation
 * 
 * This endpoint demonstrates comprehensive form validation using Zod
 * for a standard user registration process (without background checks).
 */

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse request body
    const requestData = await request.json();
    
    console.log('📝 Registration demo attempt:', {
      email: requestData.email,
      hasPassword: !!requestData.password,
      firstName: requestData.firstName,
      lastName: requestData.lastName
    });

    // Validate using Zod schema
    const validationResult = validateRegistration(requestData);

    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.issues);
      
      // Format validation errors for client
      const formattedErrors = formatValidationErrors(validationResult.error);
      
      return json({
        success: false,
        error: 'Validation failed',
        message: 'Please correct the following errors:',
        errors: formattedErrors,
        fieldErrors: groupErrorsByField(validationResult.error)
      }, { status: 400 });
    }

    // Validation successful - extract validated data
    const validatedData: RegistrationFormData = validationResult.data;
    
    console.log('✅ Validation successful for:', validatedData.email);

    // Mock user creation (in real app, you would create actual user)
    const mockUser = await createMockUser(validatedData);

    return json({
      success: true,
      message: 'Registration successful! This is a demo - no actual account was created.',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        username: mockUser.username,
        createdAt: mockUser.createdAt
      },
      validationResults: {
        totalFields: Object.keys(validatedData).length,
        requiredFieldsProvided: [
          'email',
          'password', 
          'firstName',
          'lastName',
          'agreeToTerms',
          'agreeToPrivacy'
        ].filter(field => validatedData[field as keyof RegistrationFormData]),
        optionalFieldsProvided: [
          'username',
          'phoneNumber',
          'age',
          'dateOfBirth',
          'gender',
          'bio',
          'location'
        ].filter(field => {
          const value = validatedData[field as keyof RegistrationFormData];
          return value !== undefined && value !== '' && value !== null;
        })
      },
      nextSteps: [
        'In a real app, this would create a user account',
        'Email verification would be sent',
        'User would be redirected to complete profile'
      ]
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration demo error:', error);
    
    // Handle JSON parsing errors
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
      message: 'Something went wrong. Please try again later.'
    }, { status: 500 });
  }
};

/**
 * Individual field validation endpoint
 */
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const { field, value } = await request.json();
    
    if (!field || value === undefined) {
      return json({
        success: false,
        error: 'Field name and value are required'
      }, { status: 400 });
    }

    // Validate individual field using common schemas
    let fieldSchema;

    switch (field) {
      case 'email':
        fieldSchema = commonSchemas.email;
        break;
      case 'password':
        fieldSchema = commonSchemas.passwordStrong;
        break;
      case 'firstName':
        fieldSchema = commonSchemas.firstName;
        break;
      case 'lastName':
        fieldSchema = commonSchemas.lastName;
        break;
      case 'username':
        fieldSchema = commonSchemas.username.optional().or(z.literal(''));
        break;
      case 'phoneNumber':
        fieldSchema = commonSchemas.phoneNumber.optional().or(z.literal(''));
        break;
      case 'age':
        fieldSchema = commonSchemas.age.optional();
        break;
      default:
        return json({
          success: false,
          error: 'Unknown field',
          message: `Field '${field}' is not recognized`,
          supportedFields: [
            'email', 'password', 'firstName', 'lastName',
            'username', 'phoneNumber', 'age'
          ]
        }, { status: 400 });
    }

    const result = fieldSchema.safeParse(value);
    
    if (!result.success) {
      return json({
        success: false,
        field,
        errors: result.error.issues.map(issue => issue.message),
        isValid: false
      });
    }

    return json({
      success: true,
      field,
      value: result.data,
      isValid: true,
      message: `${field} is valid`
    });

  } catch (error) {
    console.error('Field validation error:', error);
    return json({
      success: false,
      error: 'Validation error'
    }, { status: 500 });
  }
};

/**
 * Get validation schema information
 */
export const GET: RequestHandler = async () => {
  return json({
    success: true,
    message: 'Registration Demo API with Zod Validation',
    endpoints: {
      'POST /api/auth/register-demo': 'Full registration validation',
      'PATCH /api/auth/register-demo': 'Individual field validation',
      'GET /api/auth/register-demo': 'This endpoint - schema information'
    },
    validationFeatures: {
      emailValidation: {
        format: 'Valid email format required',
        maxLength: '254 characters maximum',
        normalization: 'Automatically converted to lowercase',
        restrictions: 'No + symbols allowed'
      },
      passwordValidation: {
        minLength: '8 characters minimum',
        maxLength: '128 characters maximum',
        requirements: [
          'At least one uppercase letter',
          'At least one lowercase letter', 
          'At least one number',
          'At least one special character',
          'No common patterns (123456, password, etc.)'
        ]
      },
      nameValidation: {
        format: 'Letters, spaces, hyphens, and apostrophes only',
        maxLength: '50 characters maximum',
        required: 'First and last names are required'
      },
      optionalFields: [
        'username (3-30 characters, alphanumeric + _ -)',
        'phoneNumber (US format)',
        'age (13-120 years)',
        'dateOfBirth (YYYY-MM-DD format)',
        'gender (predefined options)',
        'bio (500 characters maximum)',
        'location (city, state, country, zipCode)',
        'preferences (newsletter, marketing, notifications, theme)'
      ],
      requiredAgreements: [
        'agreeToTerms (must be true)',
        'agreeToPrivacy (must be true)'
      ]
    },
    exampleRequest: {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe123',
      phoneNumber: '(555) 123-4567',
      age: 25,
      gender: 'male',
      bio: 'Outdoor enthusiast',
      location: {
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        zipCode: '94102'
      },
      preferences: {
        newsletter: true,
        marketing: false,
        notifications: true,
        theme: 'auto'
      },
      agreeToTerms: true,
      agreeToPrivacy: true,
      marketingConsent: false
    }
  });
};

/**
 * Format Zod validation errors for client consumption
 */
function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}

/**
 * Group validation errors by field for form highlighting
 */
function groupErrorsByField(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  
  error.issues.forEach(issue => {
    const fieldPath = issue.path.join('.');
    const fieldName = fieldPath || 'general';
    
    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = [];
    }
    
    fieldErrors[fieldName].push(issue.message);
  });
  
  return fieldErrors;
}

/**
 * Mock user creation for demo purposes
 */
async function createMockUser(data: RegistrationFormData) {
  const mockUser = {
    id: `demo_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username || null,
    phoneNumber: data.phoneNumber || null,
    age: data.age || null,
    dateOfBirth: data.dateOfBirth || null,
    gender: data.gender || null,
    bio: data.bio || null,
    location: data.location || null,
    preferences: data.preferences || {
      newsletter: false,
      marketing: false,
      notifications: true,
      theme: 'auto'
    },
    agreeToTerms: data.agreeToTerms,
    agreeToPrivacy: data.agreeToPrivacy,
    marketingConsent: data.marketingConsent || false,
    createdAt: new Date().toISOString(),
    emailVerified: false,
    status: 'demo_account'
  };

  // Simulate database save delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('👤 Demo user created:', {
    id: mockUser.id,
    email: mockUser.email,
    name: `${mockUser.firstName} ${mockUser.lastName}`
  });

  return mockUser;
}
