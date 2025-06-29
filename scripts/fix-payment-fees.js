#!/usr/bin/env node

/**
 * Fix Payment Fees Script
 * Adjusts fee calculations for realistic payment processing
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

async function fixPaymentFees() {
  try {
    console.log('💰 Fixing payment fee calculations...');
    
    const db = admin.firestore();

    // Get all bookings with payments
    const bookingsSnapshot = await db.collection('bookings')
      .where('payment.status', '==', 'completed')
      .get();

    if (bookingsSnapshot.empty) {
      console.log('No completed payments found to fix');
      return;
    }

    const batch = db.batch();
    let fixedPayments = 0;

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const amount = booking.totalPrice || 0;

      if (amount <= 0) return;

      // Improved fee calculation for small amounts
      let stripeFee, platformFee, ownerPayout;

      if (amount < 50) {
        // For small amounts, use minimal fees
        stripeFee = Math.round(amount * 0.029 + 30); // Standard Stripe fee
        platformFee = Math.max(Math.round(amount * 0.10), 100); // Minimum $1 platform fee, 10% for small amounts
        ownerPayout = Math.max(amount - stripeFee - platformFee, amount * 0.60); // Owner gets at least 60%
      } else {
        // Standard fee structure for larger amounts
        stripeFee = Math.round(amount * 0.029 + 30); // 2.9% + 30¢
        platformFee = Math.round(amount * 0.15); // 15% platform fee
        ownerPayout = amount - stripeFee - platformFee;
      }

      // Ensure owner payout is never negative
      if (ownerPayout < 0) {
        ownerPayout = Math.round(amount * 0.50); // Owner gets 50% minimum
        platformFee = amount - stripeFee - ownerPayout;
      }

      const updatedPaymentData = {
        ...booking.payment,
        fees: {
          stripeFee: stripeFee,
          platformFee: platformFee,
          ownerPayout: ownerPayout
        },
        breakdown: {
          subtotal: amount,
          taxes: 0,
          stripeFee: stripeFee,
          platformFee: platformFee,
          ownerPayout: ownerPayout,
          total: amount
        }
      };

      batch.update(doc.ref, {
        payment: updatedPaymentData,
        updatedAt: admin.firestore.Timestamp.now()
      });

      fixedPayments++;
      console.log(`   ✓ Fixed ${doc.id}: $${amount} → Owner: $${ownerPayout}, Platform: $${platformFee}, Stripe: $${stripeFee}`);
    });

    // Update payout records
    const payoutsSnapshot = await db.collection('payouts').get();
    
    payoutsSnapshot.forEach(doc => {
      const payout = doc.data();
      const bookingId = payout.bookingId;
      
      // Find corresponding booking
      const bookingDoc = bookingsSnapshot.docs.find(b => b.id === bookingId);
      if (bookingDoc) {
        const booking = bookingDoc.data();
        const newAmount = booking.payment?.fees?.ownerPayout || payout.amount;
        
        if (newAmount !== payout.amount) {
          batch.update(doc.ref, {
            amount: newAmount,
            updatedAt: admin.firestore.Timestamp.now()
          });
          console.log(`   ✓ Updated payout ${doc.id}: $${payout.amount} → $${newAmount}`);
        }
      }
    });

    if (fixedPayments > 0) {
      await batch.commit();
      console.log(`✅ Fixed ${fixedPayments} payment fee calculations`);
    }

    // Generate updated revenue summary
    console.log('\n📊 Updated revenue summary...');
    
    const updatedBookingsSnapshot = await db.collection('bookings')
      .where('payment.status', '==', 'completed')
      .get();
    
    let totalRevenue = 0;
    let totalPlatformRevenue = 0;
    let totalOwnerPayouts = 0;
    let totalStripeFees = 0;

    updatedBookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.payment && booking.payment.fees) {
        totalRevenue += booking.totalPrice || 0;
        totalPlatformRevenue += booking.payment.fees.platformFee || 0;
        totalOwnerPayouts += booking.payment.fees.ownerPayout || 0;
        totalStripeFees += booking.payment.fees.stripeFee || 0;
      }
    });

    console.log(`   Total transaction volume: $${totalRevenue.toFixed(2)}`);
    console.log(`   Platform revenue: $${totalPlatformRevenue.toFixed(2)} (${((totalPlatformRevenue / totalRevenue) * 100).toFixed(1)}%)`);
    console.log(`   Owner payouts: $${totalOwnerPayouts.toFixed(2)} (${((totalOwnerPayouts / totalRevenue) * 100).toFixed(1)}%)`);
    console.log(`   Stripe fees: $${totalStripeFees.toFixed(2)} (${((totalStripeFees / totalRevenue) * 100).toFixed(1)}%)`);

    console.log('\n✅ Payment fee calculations are now realistic and profitable!');

  } catch (error) {
    console.error('❌ Error fixing payment fees:', error);
    throw error;
  }
}

// Run the script
fixPaymentFees()
  .then(() => {
    console.log('\n🎉 Payment fees fixed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
