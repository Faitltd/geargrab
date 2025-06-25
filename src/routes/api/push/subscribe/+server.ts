// API endpoint for push notification subscription
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/admin';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, subscription } = await request.json();

    // Validate input
    if (!userId || !subscription) {
      return json({ error: 'Missing userId or subscription' }, { status: 400 });
    }

    // Ensure user can only subscribe for themselves
    if (userId !== locals.userId) {
      return json({ error: 'Cannot subscribe for another user' }, { status: 403 });
    }

    // Save subscription to Firestore
    const subscriptionData = {
      userId,
      subscription,
      createdAt: adminFirestore.Timestamp.now(),
      updatedAt: adminFirestore.Timestamp.now(),
      active: true
    };

    // Use subscription endpoint as document ID to prevent duplicates
    const subscriptionId = Buffer.from(subscription.endpoint).toString('base64').slice(0, 20);
    
    await adminFirestore
      .collection('pushSubscriptions')
      .doc(subscriptionId)
      .set(subscriptionData, { merge: true });

    console.log(`✅ Push subscription saved for user ${userId}`);

    return json({ 
      success: true, 
      subscriptionId,
      message: 'Push subscription saved successfully' 
    });

  } catch (error) {
    console.error('Error saving push subscription:', error);
    return json({ error: 'Failed to save push subscription' }, { status: 500 });
  }
};
