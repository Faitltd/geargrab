/**
 * Profile Photo API Endpoint
 * Handles profile photo upload and deletion
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadProfilePhoto, deleteProfilePhoto } from '$lib/services/users.service';

/**
 * POST /api/profile/photo
 * Upload profile photo
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      throw error(400, {
        message: 'No photo file provided',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw error(400, {
        message: 'File must be an image',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw error(400, {
        message: 'Image must be smaller than 5MB',
        code: 'VALIDATION_ERROR'
      });
    }

    // Upload the photo
    const photoURL = await uploadProfilePhoto(locals.user.uid, file);

    return json({
      success: true,
      photoURL,
      message: 'Photo uploaded successfully'
    });

  } catch (err: any) {
    console.error('Error uploading photo:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to upload photo',
        code: 'UPLOAD_PHOTO_FAILED'
      }
    }, { status: 500 });
  }
};

/**
 * DELETE /api/profile/photo
 * Delete profile photo
 */
export const DELETE: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const photoURL = url.searchParams.get('url');
    
    if (!photoURL) {
      throw error(400, {
        message: 'Photo URL is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Delete the photo
    await deleteProfilePhoto(locals.user.uid, photoURL);

    return json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (err: any) {
    console.error('Error deleting photo:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to delete photo',
        code: 'DELETE_PHOTO_FAILED'
      }
    }, { status: 500 });
  }
};
