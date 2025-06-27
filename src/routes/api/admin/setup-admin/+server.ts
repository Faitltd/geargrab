import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isAdminInitialized } from '$lib/firebase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Check if Firebase Admin is available
    if (!isAdminInitialized || !adminFirestore) {
      return json({ 
        error: 'Firebase Admin not initialized',
        details: 'Missing Firebase Admin credentials'
      }, { status: 500 });
    }

    const { email, uid } = await request.json();
    
    if (!email || !uid) {
      return json({ error: 'Email and UID are required' }, { status: 400 });
    }

    // Admin emails that should have admin access
    const adminEmails = [
      'admin@itsfait.com',
      'ray@itsfait.com',
      '126212038+faitltd@users.noreply.github.com',
      'faitltd@gmail.com'
    ];

    const isAdminEmail = adminEmails.includes(email.toLowerCase());
    
    if (!isAdminEmail) {
      return json({ 
        error: 'Not an admin email',
        providedEmail: email,
        adminEmails: adminEmails
      }, { status: 403 });
    }

    // Set user as admin in Firestore
    await adminFirestore.collection('adminUsers').doc(uid).set({
      uid,
      email,
      isAdmin: true,
      adminLevel: 'super',
      permissions: ['all'],
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now()
    });

    return json({ 
      success: true, 
      message: 'Admin user setup complete',
      adminUser: { uid, email, isAdmin: true }
    });

  } catch (error) {
    console.error('Error setting up admin:', error);
    return json({ 
      error: 'Failed to setup admin user',
      details: error.message
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  try {
    // Check if Firebase Admin is available
    if (!isAdminInitialized || !adminFirestore) {
      return json({ 
        error: 'Firebase Admin not initialized',
        details: 'Missing Firebase Admin credentials'
      }, { status: 500 });
    }

    // Get all admin users
    const adminSnapshot = await adminFirestore.collection('adminUsers').get();
    const adminUsers = adminSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return json({ 
      success: true,
      adminUsers,
      count: adminUsers.length
    });

  } catch (error) {
    console.error('Error getting admin users:', error);
    return json({ 
      error: 'Failed to get admin users',
      details: error.message
    }, { status: 500 });
  }
};
