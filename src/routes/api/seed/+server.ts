import { json } from '@sveltejs/kit';
import { listingsService } from '$lib/services/listings.service';
import { sampleListings } from '$lib/data/sample-listings';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV === 'production') {
      return json({ error: 'Seeding not allowed in production' }, { status: 403 });
    }

    const { force } = await request.json();

    // Check if listings already exist (unless force is true)
    if (!force) {
      const existingListings = await listingsService.searchListings({}, { limit: 1 });
      if (existingListings.data.length > 0) {
        return json({ 
          message: 'Listings already exist. Use force=true to override.',
          count: existingListings.total 
        });
      }
    }

    // Create sample listings
    const createdListings = [];
    for (const listingData of sampleListings) {
      try {
        const listing = await listingsService.create(listingData as any);
        createdListings.push(listing);
        console.log(`Created listing: ${listingData.title}`);
      } catch (error) {
        console.error(`Failed to create listing ${listingData.title}:`, error);
      }
    }

    return json({
      success: true,
      message: `Successfully created ${createdListings.length} sample listings`,
      listings: createdListings.map(l => ({ id: l.id, title: l.title }))
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async () => {
  try {
    // Get current listings count
    const result = await listingsService.searchListings({}, { limit: 1 });
    
    return json({
      message: 'Seed endpoint ready',
      currentListings: result.total,
      sampleListingsAvailable: sampleListings.length,
      usage: 'POST to this endpoint with { "force": true } to seed data'
    });

  } catch (error) {
    console.error('Error checking listings:', error);
    return json(
      { error: 'Failed to check listings', details: error.message },
      { status: 500 }
    );
  }
};
