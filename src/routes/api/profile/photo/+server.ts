import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore, adminStorage, isFirebaseAdminAvailable } from '$lib/firebase/server';
import { updateProfile } from 'firebase/auth';
import crypto from 'crypto';

// Generate secure filename for profile photos
function generateSecureFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `profile_${userId}_${timestamp}_${randomBytes}.${extension}`;
}

// Upload profile photo
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      return json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return json({ error: 'No photo file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Generate secure filename
    const secureFileName = generateSecureFileName(file.name, locals.userId);
    const filePath = `profile_photos/${locals.userId}/${secureFileName}`;

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: locals.userId,
          uploadedAt: new Date().toISOString(),
          photoType: 'profile',
          validated: 'true'
        }
      }
    });

    // Get public URL
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    });

    // Update user document in Firestore
    await adminFirestore.collection('users').doc(locals.userId).update({
      photoURL: signedUrl,
      updatedAt: new Date()
    });

    // Delete old profile photo if it exists
    try {
      const userDoc = await adminFirestore.collection('users').doc(locals.userId).get();
      const userData = userDoc.data();
      
      if (userData?.photoURL && userData.photoURL.includes('profile_photos/')) {
        // Extract the file path from the old URL
        const oldUrlParts = userData.photoURL.split('/');
        const oldFileName = oldUrlParts[oldUrlParts.length - 1].split('?')[0];
        const oldFilePath = `profile_photos/${locals.userId}/${oldFileName}`;
        
        const oldFileRef = bucket.file(oldFilePath);
        await oldFileRef.delete().catch(() => {
          // Ignore errors if file doesn't exist
          console.log('Old profile photo not found or already deleted');
        });
      }
    } catch (error) {
      console.warn('Failed to delete old profile photo:', error);
      // Don't fail the request if we can't delete the old photo
    }

    return json({
      success: true,
      photoURL: signedUrl,
      message: 'Profile photo updated successfully'
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return json({ 
      error: 'Failed to upload profile photo',
      details: error.message 
    }, { status: 500 });
  }
};

// Delete profile photo
export const DELETE: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      return json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get current user data
    const userDoc = await adminFirestore.collection('users').doc(locals.userId).get();
    
    if (!userDoc.exists) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    if (!userData?.photoURL) {
      return json({ error: 'No profile photo to delete' }, { status: 400 });
    }

    // Delete photo from Firebase Storage if it's a custom upload
    if (userData.photoURL.includes('profile_photos/')) {
      try {
        const bucket = adminStorage.bucket();
        const urlParts = userData.photoURL.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        const filePath = `profile_photos/${locals.userId}/${fileName}`;
        
        const fileRef = bucket.file(filePath);
        await fileRef.delete();
      } catch (error) {
        console.warn('Failed to delete photo from storage:', error);
        // Continue with removing the URL from user document
      }
    }

    // Remove photoURL from user document
    await adminFirestore.collection('users').doc(locals.userId).update({
      photoURL: '',
      updatedAt: new Date()
    });

    return json({
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return json({ 
      error: 'Failed to delete profile photo',
      details: error.message 
    }, { status: 500 });
  }
};
