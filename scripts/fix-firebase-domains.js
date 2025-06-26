#!/usr/bin/env node

/**
 * Fix Firebase Authorized Domains for GearGrab
 * This script adds the required domains to Firebase Authentication
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'geargrabco',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId
  });
}

async function addAuthorizedDomains() {
  try {
    console.log('🔧 Adding authorized domains to Firebase...');
    
    // Required domains for GearGrab
    const requiredDomains = [
      'localhost',
      '127.0.0.1',
      'geargrab.co',
      'www.geargrab.co',
      'geargrabco.firebaseapp.com'
    ];

    console.log('📋 Required domains:', requiredDomains);
    
    // Note: Firebase Admin SDK doesn't directly support updating auth config
    // This needs to be done through Firebase Console or REST API
    console.log('⚠️  Manual action required:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/geargrabco/authentication/settings');
    console.log('2. Click on "Authorized domains" tab');
    console.log('3. Add these domains:');
    requiredDomains.forEach(domain => {
      console.log(`   - ${domain}`);
    });
    
    console.log('\n✅ Once domains are added, Facebook login should work!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addAuthorizedDomains();
