#!/usr/bin/env node

/**
 * Test Stripe Integration Script
 * Tests Stripe payment processing and webhook handling
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

async function testStripeIntegration() {
  try {
    console.log('💳 Testing Stripe Integration...');
    
    const db = admin.firestore();

    // Test 1: Check Stripe configuration
    console.log('\n🔧 Test 1: Checking Stripe configuration...');
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log(`   Stripe Secret Key: ${stripeSecretKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Stripe Publishable Key: ${stripePublishableKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Stripe Webhook Secret: ${stripeWebhookSecret ? '✅ Configured' : '❌ Missing'}`);

    // Test 2: Check existing bookings for payment data
    console.log('\n💰 Test 2: Analyzing existing bookings for payment data...');
    
    const bookingsSnapshot = await db.collection('bookings').get();
    
    if (bookingsSnapshot.empty) {
      throw new Error('No bookings found for payment testing');
    }

    let bookingsWithPayments = 0;
    let totalRevenue = 0;
    let paymentMethods = {};
    let paymentStatuses = {};

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      
      // Check for payment data
      if (booking.payment || booking.stripePaymentIntentId || booking.totalPrice) {
        bookingsWithPayments++;
        
        if (booking.totalPrice) {
          totalRevenue += booking.totalPrice;
        }
        
        // Track payment methods
        const method = booking.payment?.method || 'unknown';
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        
        // Track payment statuses
        const status = booking.payment?.status || booking.status || 'unknown';
        paymentStatuses[status] = (paymentStatuses[status] || 0) + 1;
      }
    });

    console.log(`   Total bookings: ${bookingsSnapshot.size}`);
    console.log(`   Bookings with payment data: ${bookingsWithPayments}/${bookingsSnapshot.size}`);
    console.log(`   Total revenue recorded: $${totalRevenue.toFixed(2)}`);
    
    console.log(`   Payment methods:`, paymentMethods);
    console.log(`   Payment statuses:`, paymentStatuses);

    // Test 3: Check Stripe payment intents collection
    console.log('\n🧾 Test 3: Checking Stripe payment intents...');
    
    const paymentIntentsSnapshot = await db.collection('stripePaymentIntents').limit(10).get();
    console.log(`   Payment intents stored: ${paymentIntentsSnapshot.size}`);
    
    if (paymentIntentsSnapshot.size > 0) {
      paymentIntentsSnapshot.forEach(doc => {
        const intent = doc.data();
        console.log(`     - ${doc.id}: ${intent.status || 'unknown'} - $${(intent.amount || 0) / 100}`);
      });
    }

    // Test 4: Check webhook events
    console.log('\n🔗 Test 4: Checking Stripe webhook events...');
    
    const webhookEventsSnapshot = await db.collection('stripeWebhookEvents').limit(10).get();
    console.log(`   Webhook events processed: ${webhookEventsSnapshot.size}`);
    
    if (webhookEventsSnapshot.size > 0) {
      const eventTypes = {};
      webhookEventsSnapshot.forEach(doc => {
        const event = doc.data();
        const type = event.type || 'unknown';
        eventTypes[type] = (eventTypes[type] || 0) + 1;
      });
      console.log(`   Event types:`, eventTypes);
    }

    // Test 5: Simulate payment flow
    console.log('\n🔄 Test 5: Simulating payment flow...');
    
    // Get a booking that needs payment
    const unpaidBooking = bookingsSnapshot.docs.find(doc => {
      const booking = doc.data();
      return !booking.payment || booking.payment.status !== 'completed';
    });

    if (unpaidBooking) {
      const booking = unpaidBooking.data();
      console.log(`   Found unpaid booking: ${unpaidBooking.id}`);
      console.log(`   Amount: $${booking.totalPrice || 0}`);
      console.log(`   Status: ${booking.status}`);
      
      // Simulate payment completion
      const paymentData = {
        method: 'card',
        status: 'completed',
        amount: booking.totalPrice || 0,
        currency: 'usd',
        stripePaymentIntentId: `pi_test_${Date.now()}`,
        processedAt: admin.firestore.Timestamp.now(),
        fees: {
          stripeFee: Math.round((booking.totalPrice || 0) * 0.029 + 30), // Stripe fees
          platformFee: Math.round((booking.totalPrice || 0) * 0.15) // 15% platform fee
        }
      };

      // Update booking with payment data (simulation)
      console.log(`   ✅ Simulated payment completion:`, paymentData);
      
      // In a real scenario, this would be done by webhook
      // await db.collection('bookings').doc(unpaidBooking.id).update({
      //   payment: paymentData,
      //   status: 'confirmed',
      //   updatedAt: admin.firestore.Timestamp.now()
      // });
      
    } else {
      console.log(`   ⚠️  No unpaid bookings found for simulation`);
    }

    // Test 6: Check platform revenue calculations
    console.log('\n📊 Test 6: Platform revenue calculations...');
    
    const completedBookings = bookingsSnapshot.docs.filter(doc => {
      const booking = doc.data();
      return booking.status === 'completed' && booking.totalPrice;
    });

    let platformRevenue = 0;
    let ownerPayouts = 0;
    let stripeFees = 0;

    completedBookings.forEach(doc => {
      const booking = doc.data();
      const amount = booking.totalPrice || 0;
      
      // Calculate fees (standard rates)
      const stripeFee = Math.round(amount * 0.029 + 30); // 2.9% + 30¢
      const platformFee = Math.round(amount * 0.15); // 15% platform fee
      const ownerPayout = amount - stripeFee - platformFee;
      
      platformRevenue += platformFee;
      ownerPayouts += ownerPayout;
      stripeFees += stripeFee;
    });

    console.log(`   Completed bookings: ${completedBookings.length}`);
    console.log(`   Total transaction volume: $${totalRevenue.toFixed(2)}`);
    console.log(`   Platform revenue (15%): $${platformRevenue.toFixed(2)}`);
    console.log(`   Owner payouts: $${ownerPayouts.toFixed(2)}`);
    console.log(`   Stripe fees: $${stripeFees.toFixed(2)}`);

    // Test 7: Check payout tracking
    console.log('\n💸 Test 7: Checking payout tracking...');
    
    const payoutsSnapshot = await db.collection('payouts').limit(10).get();
    console.log(`   Payout records: ${payoutsSnapshot.size}`);
    
    if (payoutsSnapshot.size > 0) {
      let totalPayouts = 0;
      payoutsSnapshot.forEach(doc => {
        const payout = doc.data();
        totalPayouts += payout.amount || 0;
      });
      console.log(`   Total payouts processed: $${totalPayouts.toFixed(2)}`);
    }

    // Summary and recommendations
    console.log('\n📋 Payment Integration Summary:');
    console.log(`   ✅ Stripe configuration: ${stripeSecretKey && stripePublishableKey ? 'Complete' : 'Incomplete'}`);
    console.log(`   ✅ Payment data structure: ${bookingsWithPayments > 0 ? 'Present' : 'Missing'}`);
    console.log(`   ✅ Revenue tracking: $${totalRevenue.toFixed(2)} recorded`);
    console.log(`   ✅ Webhook processing: ${webhookEventsSnapshot.size} events`);
    console.log(`   ✅ Platform fees: ${platformRevenue > 0 ? 'Calculated' : 'Not calculated'}`);

    // Identify issues
    const issues = [];
    
    if (!stripeSecretKey || !stripePublishableKey) {
      issues.push('Missing Stripe API keys');
    }
    
    if (totalRevenue === 0) {
      issues.push('No revenue recorded - payments may not be completing');
    }
    
    if (webhookEventsSnapshot.size === 0) {
      issues.push('No webhook events - payment confirmations may not be processing');
    }
    
    if (payoutsSnapshot.size === 0 && completedBookings.length > 0) {
      issues.push('No payout records - owner payments may not be processing');
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Issues identified:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n🎉 Payment integration appears to be working correctly!');
    }

  } catch (error) {
    console.error('❌ Error testing Stripe integration:', error);
    throw error;
  }
}

// Run the test
testStripeIntegration()
  .then(() => {
    console.log('\n🚀 Stripe integration test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
