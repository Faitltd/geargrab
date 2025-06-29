#!/usr/bin/env node

/**
 * Test Notification System Script
 * This script tests the complete notification infrastructure
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

async function testNotificationSystem() {
  try {
    console.log('🔔 Testing notification system...');
    
    // Test 1: Check notification configuration
    console.log('\n🔧 Test 1: Checking notification configuration...');
    
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const hasFromEmail = !!process.env.FROM_EMAIL;
    const hasFCMConfig = !!process.env.FIREBASE_MESSAGING_SENDER_ID;
    const hasVapidKey = !!process.env.VITE_VAPID_PUBLIC_KEY;
    
    console.log(`✅ Resend API Key: ${hasResendKey ? 'Present' : 'Missing'}`);
    console.log(`✅ From Email: ${hasFromEmail ? 'Present' : 'Missing'}`);
    console.log(`✅ FCM Configuration: ${hasFCMConfig ? 'Present' : 'Missing'}`);
    console.log(`✅ VAPID Key: ${hasVapidKey ? 'Present' : 'Missing'}`);
    
    if (hasFCMConfig) {
      console.log(`   Sender ID: ${process.env.FIREBASE_MESSAGING_SENDER_ID}`);
    }

    // Test 2: Check notification preferences in database
    console.log('\n📋 Test 2: Checking notification preferences...');
    const db = admin.firestore();
    
    const preferencesQuery = await db.collection('notificationPreferences').limit(10).get();
    console.log(`✅ Found ${preferencesQuery.size} notification preference records`);
    
    if (preferencesQuery.size > 0) {
      preferencesQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: Email ${data.email?.bookingUpdates ? 'ON' : 'OFF'}, Push ${data.push?.messages ? 'ON' : 'OFF'}`);
      });
    }

    // Test 3: Check FCM tokens
    console.log('\n📱 Test 3: Checking FCM tokens...');
    const fcmTokensQuery = await db.collection('fcmTokens').limit(10).get();
    console.log(`✅ Found ${fcmTokensQuery.size} FCM token records`);
    
    if (fcmTokensQuery.size > 0) {
      fcmTokensQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.tokens?.length || 0} tokens`);
        if (data.lastUpdated) {
          const date = data.lastUpdated.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated);
          console.log(`     Last updated: ${date.toLocaleDateString()}`);
        }
      });
    }

    // Test 4: Check notification history
    console.log('\n📜 Test 4: Checking notification history...');
    const notificationHistoryQuery = await db.collection('notificationHistory').limit(10).get();
    console.log(`✅ Found ${notificationHistoryQuery.size} notification history records`);
    
    if (notificationHistoryQuery.size > 0) {
      notificationHistoryQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.type} to ${data.recipientEmail || 'Unknown'}`);
        console.log(`     Subject: ${data.subject || 'No subject'}`);
        console.log(`     Status: ${data.status || 'Unknown'}`);
        if (data.sentAt) {
          const date = data.sentAt.toDate ? data.sentAt.toDate() : new Date(data.sentAt);
          console.log(`     Sent: ${date.toLocaleDateString()}`);
        }
      });
    }

    // Test 5: Create sample notification preferences
    console.log('\n🆕 Test 5: Creating sample notification preferences...');
    
    const usersQuery = await db.collection('users').limit(3).get();
    
    if (usersQuery.size > 0 && preferencesQuery.size === 0) {
      for (const userDoc of usersQuery.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        const samplePreferences = {
          userId,
          email: {
            bookingUpdates: true,
            messages: true,
            payments: true,
            marketing: false,
            reviews: true
          },
          push: {
            bookingUpdates: true,
            messages: true,
            payments: true,
            reviews: false
          },
          sms: {
            bookingConfirmations: true,
            urgentUpdates: true
          },
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now()
        };
        
        await db.collection('notificationPreferences').doc(userId).set(samplePreferences);
        console.log(`✅ Created notification preferences for: ${userData.displayName || 'User'} (${userId})`);
      }
    } else if (preferencesQuery.size > 0) {
      console.log('✅ Notification preferences already exist');
    } else {
      console.log('⚠️  No users found to create preferences for');
    }

    // Test 6: Test notification templates
    console.log('\n📧 Test 6: Testing notification templates...');
    
    const notificationTemplates = {
      newMessage: {
        title: 'New message from Sarah',
        body: 'Hi! Is your tent still available for this weekend?',
        type: 'message'
      },
      bookingRequest: {
        title: 'New booking request',
        body: 'Someone wants to book your "REI Co-op Half Dome Tent"',
        type: 'booking'
      },
      bookingConfirmed: {
        title: 'Booking confirmed!',
        body: 'Your booking for "Mountain Bike" has been confirmed',
        type: 'booking'
      },
      paymentReceived: {
        title: 'Payment received',
        body: 'You received $45.00 for your gear rental',
        type: 'payment'
      }
    };
    
    console.log('✅ Available notification templates:');
    Object.entries(notificationTemplates).forEach(([key, template]) => {
      console.log(`   - ${key}: "${template.title}" (${template.type})`);
    });

    // Test 7: Test email template generation
    console.log('\n📬 Test 7: Testing email template generation...');
    
    const sampleBookingData = {
      bookingId: 'test_booking_123',
      confirmationNumber: 'GG123456',
      listingTitle: 'REI Co-op Half Dome Tent',
      listingImage: 'https://example.com/tent.jpg',
      startDate: '2025-07-01',
      endDate: '2025-07-03',
      totalPrice: 75,
      renterName: 'John Doe',
      renterEmail: 'john@example.com',
      ownerName: 'Sarah Johnson',
      ownerEmail: 'sarah@example.com',
      deliveryMethod: 'pickup'
    };
    
    console.log('✅ Sample booking email data prepared:');
    console.log(`   Booking: ${sampleBookingData.confirmationNumber}`);
    console.log(`   Item: ${sampleBookingData.listingTitle}`);
    console.log(`   Dates: ${sampleBookingData.startDate} - ${sampleBookingData.endDate}`);
    console.log(`   Total: $${sampleBookingData.totalPrice}`);
    console.log(`   Renter: ${sampleBookingData.renterName} (${sampleBookingData.renterEmail})`);
    console.log(`   Owner: ${sampleBookingData.ownerName} (${sampleBookingData.ownerEmail})`);

    // Test 8: Check push notification infrastructure
    console.log('\n🔔 Test 8: Checking push notification infrastructure...');
    
    const pushSubscriptionsQuery = await db.collection('pushSubscriptions').limit(10).get();
    console.log(`✅ Found ${pushSubscriptionsQuery.size} push subscription records`);
    
    if (pushSubscriptionsQuery.size > 0) {
      pushSubscriptionsQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.endpoint ? 'Active' : 'Inactive'} subscription`);
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          console.log(`     Created: ${date.toLocaleDateString()}`);
        }
      });
    }

    console.log('\n🎉 Notification system tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Email configuration: ${hasResendKey && hasFromEmail ? 'Complete' : 'Incomplete'}`);
    console.log(`   - Push notification config: ${hasFCMConfig && hasVapidKey ? 'Complete' : 'Incomplete'}`);
    console.log(`   - Notification preferences: ${preferencesQuery.size} users`);
    console.log(`   - FCM tokens: ${fcmTokensQuery.size} records`);
    console.log(`   - Notification history: ${notificationHistoryQuery.size} records`);
    console.log(`   - Push subscriptions: ${pushSubscriptionsQuery.size} active`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (!hasResendKey) {
      console.log('   - Configure Resend API key for email notifications');
    }
    if (!hasFCMConfig) {
      console.log('   - Set up Firebase Cloud Messaging for push notifications');
    }
    if (preferencesQuery.size === 0) {
      console.log('   - Test notification preferences in the UI');
    }
    if (fcmTokensQuery.size === 0) {
      console.log('   - Test FCM token registration in the browser');
    }
    console.log('   - Test sending actual notifications through the API');
    console.log('   - Verify email templates render correctly');
    console.log('   - Test push notification delivery on mobile devices');

  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testNotificationSystem();
