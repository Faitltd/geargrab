// User Registration API Endpoint
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

// Mock Firebase functions for development/testing
const mockAuth = {
  createUser: async (userData: any) => ({
    uid: `mock-uid-${Date.now()}`,
    email: userData.email,
    displayName: userData.displayName,
    emailVerified: false
  }),
  createCustomToken: async (uid: string) => `mock-custom-token-${uid}`,
  generateEmailVerificationLink: async (email: string) => `https://mock-verification-link.com?email=${email}`
};

const mockFirestore = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      set: async (data: any) => {
        console.log(`Mock Firestore: Setting document ${name}/${id}`, data);
        return Promise.resolve();
      }
    })
  })
};

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const clientIP = getClientAddress();
  const startTime = Date.now();

  try {
    const body: RegisterRequest = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      console.warn('Registration attempt with missing fields', {
        email: email ? 'provided' : 'missing',
        password: password ? 'provided' : 'missing',
        name: name ? 'provided' : 'missing',
        clientIP
      });
      
      throw error(400, {
        message: 'Email, password, and name are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('Registration attempt with invalid email format', {
        email,
        clientIP
      });
      
      throw error(400, {
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Password validation
    if (password.length < 8) {
      console.warn('Registration attempt with weak password', {
        email,
        passwordLength: password.length,
        clientIP
      });
      
      throw error(400, {
        message: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      console.warn('Registration attempt with invalid name', {
        email,
        nameLength: name.trim().length,
        clientIP
      });
      
      throw error(400, {
        message: 'Name must be at least 2 characters long',
        code: 'INVALID_NAME'
      });
    }

    // Use mock services in development/testing
    const auth = dev ? mockAuth : (await import('$lib/server/firebase-admin')).getAdminAuth();
    const firestore = dev ? mockFirestore : (await import('$lib/server/firebase-admin')).getAdminFirestore();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: name.trim(),
      emailVerified: false
    });

    console.log('User created in Auth', {
      uid: userRecord.uid,
      email: userRecord.email,
      clientIP
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      name: name.trim(),
      emailVerified: false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        bio: '',
        location: '',
        phone: '',
        avatar: ''
      },
      preferences: {
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          showEmail: false,
          showPhone: false
        }
      },
      stats: {
        listingsCount: 0,
        bookingsCount: 0,
        reviewsCount: 0,
        rating: 0
      }
    };

    await firestore.collection('users').doc(userRecord.uid).set(userProfile);

    console.log('User profile created in database', {
      uid: userRecord.uid,
      email: userRecord.email,
      duration: Date.now() - startTime,
      clientIP
    });

    // Generate custom token for immediate sign-in
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Send email verification
    try {
      const verificationLink = await auth.generateEmailVerificationLink(userRecord.email!);
      
      // In a real app, you would send this via email service
      console.log('Email verification link generated', {
        uid: userRecord.uid,
        email: userRecord.email,
        verificationLink
      });
    } catch (emailError) {
      console.error('Failed to generate email verification link', {
        uid: userRecord.uid,
        email: userRecord.email,
        error: emailError
      });
      
      // Don't fail registration if email verification fails
    }

    return json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified
      },
      customToken,
      message: 'Account created successfully'
    }, { status: 201 });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    
    // Handle Auth errors
    if (err.code === 'auth/email-already-exists') {
      console.warn('Registration attempt with existing email', {
        error: err.message,
        duration,
        clientIP
      });

      throw error(409, {
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS'
      });
    }

    if (err.code === 'auth/invalid-email') {
      console.warn('Registration attempt with invalid email', {
        error: err.message,
        duration,
        clientIP
      });

      throw error(400, {
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    if (err.code === 'auth/weak-password') {
      console.warn('Registration attempt with weak password', {
        error: err.message,
        duration,
        clientIP
      });

      throw error(400, {
        message: 'Password is too weak. Please choose a stronger password',
        code: 'WEAK_PASSWORD'
      });
    }

    // Log unexpected errors
    console.error('User registration failed', {
      error: err.message,
      code: err.code,
      duration,
      clientIP
    }, err);

    // Re-throw SvelteKit errors
    if (err.status) {
      throw err;
    }

    // Generic error for unexpected issues
    throw error(500, {
      message: 'Registration failed. Please try again later.',
      code: 'REGISTRATION_FAILED'
    });
  }
};
