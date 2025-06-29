#!/usr/bin/env node

/**
 * Fix Admin Permissions Script
 * Ensures proper admin users with correct permissions
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

async function fixAdminPermissions() {
  try {
    console.log('🔧 Fixing Admin Permissions...');
    
    const db = admin.firestore();

    // Update existing admin users with proper permissions
    const adminUsersSnapshot = await db.collection('adminUsers').get();
    
    console.log(`Found ${adminUsersSnapshot.size} admin users to update`);
    
    const batch = db.batch();
    let updatedCount = 0;
    
    adminUsersSnapshot.forEach(doc => {
      const adminData = doc.data();
      const email = adminData.email || '';
      
      let permissions = [];
      
      // Assign permissions based on email
      if (email.includes('ray@itsfait') || email.includes('admin@itsfait')) {
        permissions = ['super_admin', 'content_moderation', 'user_management', 'analytics_access', 'claims_management'];
      } else if (email.includes('support')) {
        permissions = ['customer_support', 'claims_management'];
      } else {
        permissions = ['content_moderation', 'user_management'];
      }
      
      // Update the document
      batch.update(doc.ref, {
        permissions,
        role: permissions.includes('super_admin') ? 'super_admin' : 
              permissions.includes('content_moderation') ? 'moderator' : 'support',
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      updatedCount++;
      console.log(`   ✓ Updated ${email}: ${permissions.join(', ')}`);
    });
    
    // If no admin users exist, create default ones
    if (adminUsersSnapshot.empty) {
      console.log('No admin users found, creating default admin users...');
      
      const defaultAdmins = [
        {
          email: 'ray@itsfait.com',
          uid: 'admin_ray_itsfait',
          permissions: ['super_admin', 'content_moderation', 'user_management', 'analytics_access', 'claims_management'],
          role: 'super_admin',
          createdAt: admin.firestore.Timestamp.now(),
          isActive: true
        },
        {
          email: 'admin@itsfait.com',
          uid: 'admin_itsfait',
          permissions: ['super_admin', 'content_moderation', 'user_management', 'analytics_access', 'claims_management'],
          role: 'super_admin',
          createdAt: admin.firestore.Timestamp.now(),
          isActive: true
        }
      ];
      
      for (const adminUser of defaultAdmins) {
        batch.set(db.collection('adminUsers').doc(adminUser.uid), adminUser);
        updatedCount++;
        console.log(`   ✓ Created ${adminUser.email}: ${adminUser.permissions.join(', ')}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    console.log(`✅ Updated ${updatedCount} admin users with proper permissions`);
    
    // Verify the fix
    const updatedAdminSnapshot = await db.collection('adminUsers').get();
    let superAdmins = 0;
    let moderators = 0;
    let supportAgents = 0;
    
    updatedAdminSnapshot.forEach(doc => {
      const admin = doc.data();
      const permissions = admin.permissions || [];
      
      if (permissions.includes('super_admin')) {
        superAdmins++;
      } else if (permissions.includes('content_moderation')) {
        moderators++;
      } else if (permissions.includes('customer_support')) {
        supportAgents++;
      }
    });
    
    console.log('\n📊 Admin User Summary:');
    console.log(`   Super Admins: ${superAdmins}`);
    console.log(`   Moderators: ${moderators}`);
    console.log(`   Support Agents: ${supportAgents}`);
    console.log(`   Total: ${updatedAdminSnapshot.size}`);
    
    if (superAdmins === 0) {
      throw new Error('Still no super admin users after fix');
    }
    
    console.log('\n🎉 Admin permissions fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
    throw error;
  }
}

// Run the fix
fixAdminPermissions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
