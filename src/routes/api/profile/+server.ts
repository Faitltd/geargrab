/**
 * Profile API Endpoint
 * Handles user profile operations
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserProfile, updateUserProfile } from '$lib/services/users.service';

/**
 * GET /api/profile
 * Get current user's profile
 */
export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Get user profile
    const profile = await getUserProfile(locals.user.uid);
    
    if (!profile) {
      throw error(404, {
        message: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    return json({
      success: true,
      profile
    });

  } catch (err: any) {
    console.error('Error fetching profile:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to fetch profile',
        code: 'FETCH_PROFILE_FAILED'
      }
    }, { status: 500 });
  }
};

/**
 * PUT /api/profile
 * Update current user's profile
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      throw error(401, {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const updateData = await request.json();

    // Validate required fields if provided
    if (updateData.displayName !== undefined && !updateData.displayName.trim()) {
      throw error(400, {
        message: 'Display name cannot be empty',
        code: 'VALIDATION_ERROR'
      });
    }

    if (updateData.location !== undefined && !updateData.location.trim()) {
      throw error(400, {
        message: 'Location cannot be empty',
        code: 'VALIDATION_ERROR'
      });
    }

    // Update the profile
    await updateUserProfile(locals.user.uid, updateData);

    return json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (err: any) {
    console.error('Error updating profile:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    return json({
      success: false,
      error: {
        message: err.message || 'Failed to update profile',
        code: 'UPDATE_PROFILE_FAILED'
      }
    }, { status: 500 });
  }
};
