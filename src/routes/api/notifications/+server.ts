// Notifications API endpoint for sending push notifications and managing notification preferences
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/admin';
import admin from 'firebase-admin';

// Use admin.firestore.FieldValue.serverTimestamp() instead of direct import
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const action = url.searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'send':
        return await sendNotification(body);
      case 'preferences':
        return await updateNotificationPreferences(body);
      case 'register-token':
        return await registerFCMToken(body);
      case 'unregister-token':
        return await unregisterFCMToken(body);
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Notifications API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');

    switch (action) {
      case 'preferences':
        return await getNotificationPreferences(userId);
      case 'history':
        return await getNotificationHistory(userId);
      case 'unread-count':
        return await getUnreadNotificationCount(userId);
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Notifications API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

async function sendNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  channels?: string[];
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}) {
  try {
    const { userId, type, title, message, channels = ['push'], data: notificationData, priority = 'medium' } = data;

    // Get user's notification preferences
    const preferencesDoc = await adminFirestore.collection('notificationPreferences').doc(userId).get();
    const preferences = preferencesDoc.data();

    if (!preferences) {
      return json({ error: 'User notification preferences not found' }, { status: 404 });
    }

    const notificationRecord = {
      userId,
      type,
      title,
      message,
      channels,
      priority,
      status: 'pending',
      data: notificationData || {},
      createdAt: serverTimestamp(),
      sentAt: null,
      deliveredAt: null,
      readAt: null
    };

    // Store notification in history
    const notificationRef = await adminFirestore.collection('notificationHistory').add(notificationRecord);

    const results = {
      push: false,
      email: false,
      sms: false
    };

    // Send push notification
    if (channels.includes('push') && preferences.push?.[type] !== false) {
      const pushResult = await sendPushNotification(userId, title, message, notificationData);
      results.push = pushResult;
    }

    // Send email notification
    if (channels.includes('email') && preferences.email?.[type] !== false) {
      const emailResult = await sendEmailNotification(userId, title, message, notificationData);
      results.email = emailResult;
    }

    // Send SMS notification
    if (channels.includes('sms') && preferences.sms?.[type] !== false) {
      const smsResult = await sendSMSNotification(userId, title, message, notificationData);
      results.sms = smsResult;
    }

    // Update notification record with results
    await notificationRef.update({
      status: Object.values(results).some(r => r) ? 'sent' : 'failed',
      sentAt: serverTimestamp(),
      results
    });

    return json({ 
      success: true, 
      notificationId: notificationRef.id,
      results 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

async function sendPushNotification(userId: string, title: string, message: string, data: any = {}): Promise<boolean> {
  try {
    // Get user's FCM tokens
    const tokensSnapshot = await adminFirestore.collection('fcmTokens')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.log('No FCM tokens found for user:', userId);
      return false;
    }

    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    // Send push notification using Firebase Admin SDK
    const messaging = admin.messaging();

    const payload = {
      notification: {
        title,
        body: message,
        icon: '/favicon.png',
        badge: '/favicon.png'
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
        url: data.url || '/'
      }
    };

    const response = await messaging.sendToDevice(tokens, payload);

    console.log('Push notification sent:', response.successCount, 'successful,', response.failureCount, 'failed');

    // Update token status for failed tokens
    if (response.failureCount > 0) {
      const batch = adminFirestore.batch();
      response.results.forEach((result, index) => {
        if (result.error) {
          const tokenDoc = tokensSnapshot.docs[index];
          batch.update(tokenDoc.ref, { isActive: false, lastError: result.error.message });
        }
      });
      await batch.commit();
    }

    return response.successCount > 0;

  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

async function sendEmailNotification(userId: string, title: string, message: string, data: any = {}): Promise<boolean> {
  try {
    // Get user email
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user?.email) {
      console.log('No email found for user:', userId);
      return false;
    }

    // Store email notification for processing by email service
    await adminFirestore.collection('emailQueue').add({
      to: user.email,
      subject: title,
      body: message,
      template: 'notification',
      data: {
        ...data,
        userName: user.displayName || user.email,
        title,
        message
      },
      status: 'pending',
      createdAt: serverTimestamp()
    });

    console.log('Email notification queued for:', user.email);
    return true;

  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

async function sendSMSNotification(userId: string, title: string, message: string, data: any = {}): Promise<boolean> {
  try {
    // Get user phone number
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user?.phoneNumber) {
      console.log('No phone number found for user:', userId);
      return false;
    }

    // Store SMS notification for processing by SMS service
    await adminFirestore.collection('smsQueue').add({
      to: user.phoneNumber,
      message: `${title}: ${message}`,
      data,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    console.log('SMS notification queued for:', user.phoneNumber);
    return true;

  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return false;
  }
}

async function updateNotificationPreferences(data: {
  userId: string;
  preferences: any;
}) {
  try {
    const { userId, preferences } = data;

    await adminFirestore.collection('notificationPreferences').doc(userId).set({
      userId,
      ...preferences,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return json({ success: true });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

async function registerFCMToken(data: {
  userId: string;
  token: string;
  platform: string;
  deviceInfo?: any;
}) {
  try {
    const { userId, token, platform, deviceInfo } = data;

    await adminFirestore.collection('fcmTokens').doc(`${userId}_${platform}_${Date.now()}`).set({
      userId,
      token,
      platform,
      deviceInfo: deviceInfo || {},
      isActive: true,
      createdAt: serverTimestamp(),
      lastUsed: serverTimestamp()
    });

    return json({ success: true });

  } catch (error) {
    console.error('Error registering FCM token:', error);
    return json({ error: 'Failed to register token' }, { status: 500 });
  }
}

async function unregisterFCMToken(data: {
  userId: string;
  token: string;
}) {
  try {
    const { userId, token } = data;

    const tokensSnapshot = await adminFirestore.collection('fcmTokens')
      .where('userId', '==', userId)
      .where('token', '==', token)
      .get();

    const batch = adminFirestore.batch();
    tokensSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();

    return json({ success: true });

  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return json({ error: 'Failed to unregister token' }, { status: 500 });
  }
}

async function getNotificationPreferences(userId: string | null) {
  try {
    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const preferencesDoc = await adminFirestore.collection('notificationPreferences').doc(userId).get();

    if (!preferencesDoc.exists) {
      return json({ error: 'Preferences not found' }, { status: 404 });
    }

    return json({ preferences: preferencesDoc.data() });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return json({ error: 'Failed to get preferences' }, { status: 500 });
  }
}

async function getNotificationHistory(userId: string | null) {
  try {
    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const historySnapshot = await adminFirestore.collection('notificationHistory')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return json({ notifications });

  } catch (error) {
    console.error('Error getting notification history:', error);
    return json({ error: 'Failed to get notification history' }, { status: 500 });
  }
}

async function getUnreadNotificationCount(userId: string | null) {
  try {
    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const unreadSnapshot = await adminFirestore.collection('notificationHistory')
      .where('userId', '==', userId)
      .where('readAt', '==', null)
      .get();

    return json({ count: unreadSnapshot.size });

  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return json({ error: 'Failed to get unread count' }, { status: 500 });
  }
}
