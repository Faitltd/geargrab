/**
 * Listing View Tracking API Endpoint
 * Handles incrementing view counts for listings
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ListingService } from '$lib/services/firestore.service';

/**
 * POST /api/listings/[id]/view
 * Increment view count for a listing
 */
export const POST: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      throw error(400, {
        message: 'Listing ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get the current listing to check if it exists
    const listing = await ListingService.getListing(id);
    
    if (!listing) {
      throw error(404, {
        message: 'Listing not found',
        code: 'LISTING_NOT_FOUND'
      });
    }

    // Increment the view count
    const currentViews = listing.views || 0;
    await ListingService.updateListing(id, {
      views: currentViews + 1
    });

    return json({
      success: true,
      views: currentViews + 1
    });

  } catch (err: any) {
    console.error('Error incrementing view count:', err);
    
    if (err.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    // Don't fail the request if view tracking fails
    // This is a non-critical operation
    return json({
      success: false,
      error: {
        message: 'Failed to track view',
        code: 'VIEW_TRACKING_FAILED'
      }
    }, { status: 200 }); // Return 200 instead of 500 for view tracking
  }
};
