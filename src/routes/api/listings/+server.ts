import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$firebase/server';
import type { Listing } from '$types/firestore';

// Get all listings
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get query parameters
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Build query
    let query = adminFirestore.collection('listings')
      .where('status', '==', 'active')
      .limit(limit);
    
    // Add filters
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (location) {
      query = query.where('location.city', '==', location);
    }
    
    // Execute query
    const snapshot = await query.get();
    
    // Process results
    const listings: Listing[] = [];
    snapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() } as Listing);
    });
    
    return json({ listings });
  } catch (error) {
    console.error('Error getting listings:', error);
    return json({ error: 'Failed to get listings' }, { status: 500 });
  }
};

// Create a new listing
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const listingData = await request.json();

    // Validate owner
    if (listingData.ownerUid !== locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!listingData.title || !listingData.description || !listingData.dailyPrice) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure location has coordinates if provided
    if (listingData.location && (!listingData.location.lat || !listingData.location.lng)) {
      return json({
        error: 'Location must include latitude and longitude coordinates'
      }, { status: 400 });
    }

    // Add timestamps and default values
    const now = adminFirestore.Timestamp.now();
    const listingWithTimestamps = {
      ...listingData,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      viewCount: 0,
      favoriteCount: 0,
      averageRating: 0,
      reviewCount: 0,
      availabilityRanges: listingData.availabilityRanges || []
    };

    // Create listing
    const docRef = await adminFirestore.collection('listings').add(listingWithTimestamps);

    return json({
      success: true,
      id: docRef.id,
      message: 'Listing created successfully'
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return json({ error: 'Failed to create listing' }, { status: 500 });
  }
};
