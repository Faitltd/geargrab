#!/usr/bin/env node

import admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "geargrabco",
  private_key_id: "f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6HrIYQnK32r8c\nMIuYoFYTUWglGEFMbCjIg35QkhMH3pi25Xd0fjqcDmYw0zQxSeIYhXJwJX5hFd+k\niKWNneSKhTW4sDxiDJU2o8f6+kFa0aChSHNq4HYA0wbmyzVglJju5RavqRfCWoOO\n8HGWFpMpWAYPxCVYLsAVsHKUCEDd4bQuCWpY9ShicFqgPH+n/F6GalQLVRQ4rJN/\nDVWYudUUmGTLz4BZIL3ZTDvRRD6xlbaeJAQtwvrB/RPy7HgJFcac8ubCJEsKiqZu\n6bUMxTeJQn4FXVzSi8E42eKZ2V3wlW5C7xjJKZMkfrKb+rLrqSYaDs8prKTg65FQ\nGIPXtTFlAgMBAAECggEAG6Xmr+rjDsPMgvwFKLmcv8bmkSgevyMMFelOsNpaQF+F\nURoaWjBMNZWAAb3GMZI3p4vfWaCAOxzcOZ1g9n4fjqJGPjbT6X7UBadj1Dkrzzl3\nwq24E4bfkLTIgC1ssvmwFEDs01Brqp/2jhvSy8hzuP8N+3aYU5aySyaIhswJEsyt\nIZcmDfns5XOQ9jb5OtuDu/kXjrpeWMj1OPviISLQH9Hz6cA2Jvi2Xhmogy8Z60j3\nAtSSlZ2e3V1fSMyKf2Nd0Rv0Ek9yjWOuXyk/1Z9Rrrw1MhjzaQMjzPc5XBuMtmeM\n53Uwwkeo8lQ9ztn1zk1zMag4s48VMMykF8zAnIY+oQKBgQDlB4c/rpj13dFi61v+\nDZUIriQ5JFGcRP36MkRl6cLZw0mNtp86z0EsPji/NQSGTYoH/vvcjkHRKyZrfJ9z\nGy+vhT/qOQlkya88t54lEJzCNN4H0bPXeyzynh/aXYbANr13fvpEnRrEuKP80z23\n6TwEudyEyxuYgasfUEk75ZL+cQKBgQDQCZbUxJPKFrGMM/2/kq3zFEWJ91uwJDBy\nJb8V6qg4RGG21s/0Ji1rvsIqN63AS6w4uywqxgkEzVsk41Of8Xck3z+tBi3gEKa5\nF9lf0KKKVp4GQPbAJvV/mMRblW1t2y3t0yO4nXxVl/yFxB3FKZmR5DcelHpjX7dh\n/KHKyPjENQKBgQDZbVk32sB6AbiLiVcPC8PltrTKzrDvgwv+X4RRoCeMZnpIoAvw\nX9vGbdefpmyCN9CHoMlobGENe0KBHpGdTDzsC7tO2BET7uh+4u6uz2OSd3Alyi5K\nrjRQrE8fFlUb25vpetGLG/7SrVt5ZO2d0D1bWzt/kfbDxK45DxZHV75B8QKBgFC/\nyBniC3Nfh57h91ZKutYlQjChIKeoBF3qJNd+87iTYlIz4xfjUbIGoxr77ac8OCb1\nD9mycIG6q+wPiMAGW7amKPMh+OCF1hD2HtvAAbcsk73drWk8NgJG68CYqZcAgj1T\nvQPFrSMUEWJikyOaWA92w6ZM/4xe9LFF/A7YHycZAoGAMlHOAksYPLTRa5p9tQ24\nW9+1OvKssod//abisI//7hIqzKdsCfkGiS7zOv04ZyEmTpttvCxvlWQryFZR1Vny\n5CtKPMKWWGr0iHr5k5cOqhAzq1UXcs9T4jfZn5CqwJXOHXZ9/DcybhDVVSP59TdV\n2CaTrGlniuXZscrwhlLjdM0=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@geargrabco.iam.gserviceaccount.com",
  client_id: "116053103137829395095",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/v1/metadata/x509/firebase-adminsdk-fbsvc%40geargrabco.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'geargrabco'
});

const db = admin.firestore();

async function checkListingData() {
  try {
    console.log('🔍 Checking listing data in Firestore...\n');

    // Get all listings
    const listingsSnapshot = await db.collection('listings').get();
    
    console.log(`📊 Found ${listingsSnapshot.size} total listings\n`);

    if (listingsSnapshot.empty) {
      console.log('❌ No listings found in database');
      return;
    }

    // Check each listing
    listingsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 Listing ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Title: ${data.title || 'No title'}`);
      console.log(`   Status: ${data.status || 'No status'}`);
      console.log(`   Owner UID: ${data.ownerUid || 'No ownerUid'}`);
      console.log(`   Owner ID: ${data.ownerId || 'No ownerId'}`);
      console.log(`   Category: ${data.category || 'No category'}`);
      console.log(`   Daily Price: $${data.dailyPrice || 'No price'}`);
      console.log(`   Created At: ${data.createdAt ? data.createdAt.toDate() : 'No timestamp'}`);
      console.log(`   Is Active: ${data.isActive}`);
      console.log('   ---');
    });

    // Check for the specific listing created in debug
    const debugListing = await db.collection('listings').doc('1CcnJph8XAI0epSliVdN').get();
    if (debugListing.exists) {
      console.log('\n🎯 Debug listing found:');
      console.log(JSON.stringify(debugListing.data(), null, 2));
    } else {
      console.log('\n❌ Debug listing (1CcnJph8XAI0epSliVdN) not found');
    }

  } catch (error) {
    console.error('❌ Error checking listing data:', error);
  }
}

checkListingData().then(() => {
  console.log('\n✅ Listing data check complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
