#!/usr/bin/env node

/**
 * Test Profile System Script
 * This script tests the user profile and verification system
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

async function testProfileSystem() {
  try {
    console.log('👤 Testing profile system...');
    
    // Get Firestore instance
    const db = admin.firestore();

    // Test 1: Check existing user profiles
    console.log('\n📋 Test 1: Checking user profiles...');
    const usersQuery = await db.collection('users').limit(10).get();
    console.log(`✅ Found ${usersQuery.size} user profiles`);
    
    if (usersQuery.size > 0) {
      usersQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.displayName || 'No name'}`);
        console.log(`     Email: ${data.email || 'No email'}`);
        console.log(`     Verified: ${data.isVerified || false}`);
        console.log(`     Location: ${data.location || 'Not set'}`);
        console.log(`     Bio: ${data.bio ? data.bio.substring(0, 50) + '...' : 'Not set'}`);
        console.log(`     Photo: ${data.photoURL ? 'Yes' : 'No'}`);
      });
    }

    // Test 2: Check verification requests
    console.log('\n🔍 Test 2: Checking verification requests...');
    const verificationQuery = await db.collection('verificationRequests').limit(10).get();
    console.log(`✅ Found ${verificationQuery.size} verification requests`);
    
    if (verificationQuery.size > 0) {
      verificationQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.type} verification`);
        console.log(`     Status: ${data.status}`);
        console.log(`     User: ${data.userId}`);
        if (data.submittedAt) {
          const date = data.submittedAt.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt);
          console.log(`     Submitted: ${date.toLocaleDateString()}`);
        }
      });
    }

    // Test 3: Check user verification statuses
    console.log('\n✅ Test 3: Checking user verification statuses...');
    const userVerificationQuery = await db.collection('userVerifications').limit(10).get();
    console.log(`✅ Found ${userVerificationQuery.size} user verification records`);
    
    if (userVerificationQuery.size > 0) {
      userVerificationQuery.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: Level ${data.verificationLevel || 'none'}`);
        console.log(`     Score: ${data.verificationScore || 0}`);
        console.log(`     Verified: ${data.isVerified || false}`);
        if (data.verifiedMethods) {
          const methods = Object.entries(data.verifiedMethods)
            .filter(([_, verified]) => verified)
            .map(([method, _]) => method);
          console.log(`     Methods: ${methods.join(', ') || 'None'}`);
        }
        if (data.badges && data.badges.length > 0) {
          console.log(`     Badges: ${data.badges.join(', ')}`);
        }
      });
    }

    // Test 4: Create sample verification data if needed
    console.log('\n🆕 Test 4: Creating sample verification data...');
    
    if (usersQuery.size > 0 && userVerificationQuery.size === 0) {
      // Create sample verification status for first user
      const firstUser = usersQuery.docs[0];
      const userId = firstUser.id;
      
      const sampleVerificationStatus = {
        userId,
        isVerified: true,
        verificationLevel: 'basic',
        verifiedMethods: {
          identity: false,
          phone: true,
          email: true,
          address: false,
          payment: false,
          background_check: false
        },
        verificationScore: 40,
        badges: ['Email Verified', 'Phone Verified'],
        lastUpdated: admin.firestore.Timestamp.now()
      };
      
      await db.collection('userVerifications').doc(userId).set(sampleVerificationStatus);
      console.log(`✅ Created sample verification status for user: ${userId}`);
    } else if (userVerificationQuery.size > 0) {
      console.log('✅ Verification data already exists');
    } else {
      console.log('⚠️  No users found to create verification data for');
    }

    // Test 5: Check profile completeness
    console.log('\n📊 Test 5: Analyzing profile completeness...');
    
    let profileStats = {
      total: 0,
      withNames: 0,
      withPhotos: 0,
      withBios: 0,
      withLocations: 0,
      verified: 0
    };
    
    usersQuery.forEach((doc) => {
      const data = doc.data();
      profileStats.total++;
      
      if (data.displayName) profileStats.withNames++;
      if (data.photoURL) profileStats.withPhotos++;
      if (data.bio) profileStats.withBios++;
      if (data.location) profileStats.withLocations++;
      if (data.isVerified) profileStats.verified++;
    });
    
    console.log('Profile completeness statistics:');
    console.log(`   Total profiles: ${profileStats.total}`);
    console.log(`   With names: ${profileStats.withNames} (${Math.round(profileStats.withNames/profileStats.total*100)}%)`);
    console.log(`   With photos: ${profileStats.withPhotos} (${Math.round(profileStats.withPhotos/profileStats.total*100)}%)`);
    console.log(`   With bios: ${profileStats.withBios} (${Math.round(profileStats.withBios/profileStats.total*100)}%)`);
    console.log(`   With locations: ${profileStats.withLocations} (${Math.round(profileStats.withLocations/profileStats.total*100)}%)`);
    console.log(`   Verified: ${profileStats.verified} (${Math.round(profileStats.verified/profileStats.total*100)}%)`);

    // Test 6: Check gear ownership (listings by users)
    console.log('\n🎒 Test 6: Checking gear ownership...');
    
    const listingsQuery = await db.collection('listings').limit(20).get();
    const ownershipStats = {};
    
    listingsQuery.forEach((doc) => {
      const data = doc.data();
      const ownerId = data.ownerUid || data.ownerId;
      if (ownerId) {
        ownershipStats[ownerId] = (ownershipStats[ownerId] || 0) + 1;
      }
    });
    
    console.log(`✅ Found ${listingsQuery.size} total listings`);
    console.log(`✅ ${Object.keys(ownershipStats).length} users have listed gear`);
    
    Object.entries(ownershipStats).forEach(([ownerId, count]) => {
      const user = usersQuery.docs.find(doc => doc.id === ownerId);
      const userName = user?.data()?.displayName || 'Unknown User';
      console.log(`   - ${userName} (${ownerId}): ${count} listings`);
    });

    console.log('\n🎉 Profile system tests completed!');
    console.log('\n📊 Summary:');
    console.log(`   - User profiles: ${usersQuery.size}`);
    console.log(`   - Verification requests: ${verificationQuery.size}`);
    console.log(`   - Verification statuses: ${userVerificationQuery.size}`);
    console.log(`   - Profile completeness: ${Math.round((profileStats.withNames + profileStats.withPhotos + profileStats.withBios + profileStats.withLocations) / (profileStats.total * 4) * 100)}% average`);
    console.log(`   - Users with gear: ${Object.keys(ownershipStats).length}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (profileStats.withPhotos < profileStats.total) {
      console.log('   - Encourage users to add profile photos');
    }
    if (profileStats.withBios < profileStats.total) {
      console.log('   - Prompt users to complete their bio sections');
    }
    if (profileStats.verified < profileStats.total) {
      console.log('   - Implement verification incentives or requirements');
    }
    if (Object.keys(ownershipStats).length < usersQuery.size) {
      console.log('   - Encourage more users to list their gear');
    }
    console.log('   - Test profile editing functionality in the UI');
    console.log('   - Verify photo upload works correctly');
    console.log('   - Test verification flow for different verification types');

  } catch (error) {
    console.error('❌ Error testing profile system:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testProfileSystem();
