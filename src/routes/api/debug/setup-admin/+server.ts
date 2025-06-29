import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, isFirebaseAdminAvailable } from '$lib/firebase/server';

export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    if (!locals.userId || !locals.user?.email) {
      return json({ 
        error: 'Not authenticated',
        message: 'You must be logged in to set up admin access'
      }, { status: 401 });
    }

    if (!isFirebaseAdminAvailable()) {
      return json({ 
        error: 'Firebase Admin not available',
        message: 'Cannot set up admin access without Firebase Admin SDK'
      }, { status: 500 });
    }

    const { force } = await request.json().catch(() => ({}));

    // Check if user is already admin
    const existingAdminDoc = await adminFirestore.collection('adminUsers').doc(locals.userId).get();
    
    if (existingAdminDoc.exists && !force) {
      return json({
        success: false,
        message: 'User is already in admin collection',
        existingData: existingAdminDoc.data()
      });
    }

    // Set user as admin
    const adminData = {
      uid: locals.userId,
      email: locals.user.email.toLowerCase(),
      isAdmin: true,
      adminLevel: 'super',
      permissions: [
        'view_admin_panel',
        'view_listings',
        'delete_any_listing',
        'edit_any_listing',
        'manage_users',
        'manage_admins',
        'view_analytics',
        'manage_payments',
        'system_settings'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminFirestore.collection('adminUsers').doc(locals.userId).set(adminData);

    console.log('✅ Admin user created:', locals.user.email);

    return json({
      success: true,
      message: 'Admin access granted successfully',
      adminData,
      userId: locals.userId,
      email: locals.user.email
    });

  } catch (error) {
    console.error('Error setting up admin:', error);
    return json({ 
      error: 'Failed to set up admin access',
      details: error.message
    }, { status: 500 });
  }
};
