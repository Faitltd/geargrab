import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, adminAuth } from '$firebase/server';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminDoc = await adminFirestore
      .collection('adminUsers')
      .doc(userId)
      .get();
    
    return adminDoc.exists && adminDoc.data()?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    // For now, we'll skip auth check in development
    // In production, you'd verify the admin token here
    
    // Get all users from Firestore
    const usersSnapshot = await adminFirestore.collection('users').get();
    const adminUsersSnapshot = await adminFirestore.collection('adminUsers').get();
    
    const adminUids = new Set(adminUsersSnapshot.docs.map(doc => doc.id));
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isAdmin: adminUids.has(doc.id),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    return json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, displayName, password, role, sendWelcomeEmail = true } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // For development: Create user in real Firebase Auth for login capability
    let userRecord;

    try {
      // Import Firebase Admin functions for real user creation
      const { getAuth } = await import('firebase-admin/auth');
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');

      // Try to use real Firebase Admin if available, otherwise fall back to client-side creation
      let realFirebaseAuth = null;

      try {
        // Check if we have Firebase Admin configured
        if (getApps().length === 0) {
          // For development, we'll use client-side Firebase Auth
          throw new Error('No admin app configured, using client-side auth');
        }
        realFirebaseAuth = getAuth();
      } catch (adminError) {
        console.log('📝 Using client-side Firebase Auth for development');
      }

      if (realFirebaseAuth) {
        // Use real Firebase Admin SDK
        userRecord = await realFirebaseAuth.createUser({
          email,
          password,
          displayName: displayName || undefined,
          emailVerified: false
        });
        console.log('✅ Real Firebase Admin user created:', userRecord.uid);
      } else {
        // Use client-side Firebase Auth (development mode)
        const { createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { auth } = await import('$lib/firebase/client');

        try {
          // Create user with client-side Firebase Auth
          const realUserCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log('✅ Real Firebase client user created:', realUserCredential.user.uid);

          // Sign out immediately so we don't interfere with admin session
          await signOut(auth);

          // Create userRecord object to match admin SDK format
          userRecord = {
            uid: realUserCredential.user.uid,
            email: realUserCredential.user.email,
            displayName: displayName || '',
            emailVerified: false
          };

        } catch (clientError) {
          console.log('⚠️ Client Firebase creation failed, using mock:', clientError.message);

          // Fall back to mock user creation
          userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: displayName || undefined,
            emailVerified: false
          });
        }
      }

    } catch (error) {
      console.error('User creation failed:', error);
      return json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName || '',
      isVerified: false,
      status: 'active',
      createdAt: new Date(),
      createdBy: 'admin',
      lastLoginAt: null,
      profileComplete: false,
      preferences: {
        notifications: true,
        marketing: false
      }
    };

    await adminFirestore.collection('users').doc(userRecord.uid).set(userData);

    // If admin role, create admin document
    if (role === 'admin') {
      await adminFirestore.collection('adminUsers').doc(userRecord.uid).set({
        isAdmin: true,
        role: 'admin',
        createdAt: new Date(),
        permissions: ['all'],
        createdBy: 'admin-panel',
        userEmail: email
      });
    }

    // Send welcome email (optional)
    if (sendWelcomeEmail) {
      try {
        // You can implement email sending here
        console.log(`Welcome email would be sent to ${email}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the user creation if email fails
      }
    }

    return json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: displayName || '',
        isAdmin: role === 'admin',
        isVerified: false,
        status: 'active',
        createdAt: userData.createdAt
      },
      note: 'User created successfully! You can now log in with these credentials at /auth/login'
    });

  } catch (error) {
    console.error('Error creating user:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return json({ error: 'A user with this email already exists' }, { status: 409 });
    } else if (error.code === 'auth/invalid-email') {
      return json({ error: 'Invalid email address' }, { status: 400 });
    } else if (error.code === 'auth/weak-password') {
      return json({ error: 'Password is too weak' }, { status: 400 });
    }

    return json({ error: 'Failed to create user' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const { userId, action, ...updateData } = await request.json();

    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'verify':
        await adminFirestore.collection('users').doc(userId).update({
          isVerified: true,
          verifiedAt: new Date()
        });
        break;

      case 'suspend':
        await adminFirestore.collection('users').doc(userId).update({
          status: 'suspended',
          suspendedAt: new Date()
        });
        break;

      case 'activate':
        await adminFirestore.collection('users').doc(userId).update({
          status: 'active',
          activatedAt: new Date()
        });
        break;

      case 'update':
        // Update user profile data
        const allowedFields = ['displayName', 'email'];
        const updates = {};
        for (const field of allowedFields) {
          if (updateData[field] !== undefined) {
            updates[field] = updateData[field];
          }
        }
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await adminFirestore.collection('users').doc(userId).update(updates);
        }
        break;

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return json({ error: 'Failed to update user' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId);

    // Delete from Firestore
    await adminFirestore.collection('users').doc(userId).delete();
    
    // Delete admin privileges if they exist
    try {
      await adminFirestore.collection('adminUsers').doc(userId).delete();
    } catch (error) {
      // Admin document might not exist, that's okay
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return json({ error: 'Failed to delete user' }, { status: 500 });
  }
};
