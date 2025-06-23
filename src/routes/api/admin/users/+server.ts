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
  // Email/password user creation is disabled. Only social logins are supported.
  return json({
    error: 'User creation with email and password is disabled. Please use social login (Google, Facebook, Apple, GitHub) to sign up and sign in.'
  }, { status: 400 });
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
