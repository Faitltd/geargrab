// API endpoint for sending push notifications
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/admin';
import webpush from 'web-push';

// Configure web-push (you'll need to set these environment variables)
webpush.setVapidDetails(
  'mailto:support@geargrab.co',
  process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key',
  process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key'
);

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, notification } = await request.json();

    // Validate input
    if (!userId || !notification) {
      return json({ error: 'Missing userId or notification data' }, { status: 400 });
    }

    // Get user's push subscriptions
    const subscriptionsQuery = await adminFirestore
      .collection('pushSubscriptions')
      .where('userId', '==', userId)
      .where('active', '==', true)
      .get();

    if (subscriptionsQuery.empty) {
      return json({ error: 'No active push subscriptions found for user' }, { status: 404 });
    }

    const sendPromises = [];
    const failedSubscriptions = [];

    // Send notification to all user's subscriptions
    for (const doc of subscriptionsQuery.docs) {
      const subscriptionData = doc.data();
      const subscription = subscriptionData.subscription;

      try {
        const pushPromise = webpush.sendNotification(
          subscription,
          JSON.stringify(notification),
          {
            TTL: 24 * 60 * 60, // 24 hours
            urgency: 'normal'
          }
        );

        sendPromises.push(pushPromise);
      } catch (error) {
        console.error(`Failed to send push to subscription ${doc.id}:`, error);
        failedSubscriptions.push(doc.id);
      }
    }

    // Wait for all notifications to be sent
    const results = await Promise.allSettled(sendPromises);
    
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        console.error(`Push notification failed:`, result.reason);
        
        // If subscription is invalid, mark it as inactive
        if (result.reason?.statusCode === 410) {
          const docId = subscriptionsQuery.docs[index].id;
          failedSubscriptions.push(docId);
        }
      }
    });

    // Deactivate failed subscriptions
    if (failedSubscriptions.length > 0) {
      const batch = adminFirestore.batch();
      failedSubscriptions.forEach(docId => {
        const docRef = adminFirestore.collection('pushSubscriptions').doc(docId);
        batch.update(docRef, { active: false, updatedAt: adminFirestore.Timestamp.now() });
      });
      await batch.commit();
    }

    console.log(`📱 Push notifications sent: ${successCount} success, ${failureCount} failed`);

    return json({
      success: true,
      sent: successCount,
      failed: failureCount,
      message: `Push notification sent to ${successCount} device(s)`
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return json({ error: 'Failed to send push notification' }, { status: 500 });
  }
};
