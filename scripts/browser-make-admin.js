/**
 * Browser Console Script to Make Current User Admin
 * 
 * Instructions:
 * 1. Open your browser and go to your GearGrab app
 * 2. Make sure you're logged in
 * 3. Open Developer Tools (F12)
 * 4. Go to Console tab
 * 5. Copy and paste this entire script
 * 6. Press Enter to run
 */

(async function makeCurrentUserAdmin() {
  try {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase not found. Make sure you\'re on the GearGrab app page.');
      return;
    }

    // Get current user
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No user is currently logged in. Please log in first.');
      return;
    }

    console.log(`🔄 Making user ${user.email} (${user.uid}) an admin...`);

    // Get Firestore instance
    const db = firebase.firestore();
    
    // Create admin document
    await db.collection('adminUsers').doc(user.uid).set({
      isAdmin: true,
      role: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      permissions: ['all'],
      createdBy: 'browser-script',
      userEmail: user.email
    });

    console.log('✅ Successfully granted admin privileges!');
    console.log(`📧 Admin user: ${user.email}`);
    console.log(`🆔 User UID: ${user.uid}`);
    console.log('🔗 You can now access admin features at: /admin/users');
    console.log('🔄 You may need to refresh the page for changes to take effect.');

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    
    if (error.code === 'permission-denied') {
      console.log('💡 This might be due to Firestore security rules. You may need to:');
      console.log('   1. Use the Firebase Console method instead');
      console.log('   2. Or temporarily modify security rules to allow this operation');
    }
  }
})();

// Alternative method using the app's auth functions (if available)
console.log('🔄 Attempting alternative method...');

(async function alternativeMethod() {
  try {
    // Check if the app's auth functions are available
    if (typeof makeUserAdmin !== 'undefined') {
      const auth = firebase.auth();
      const user = auth.currentUser;
      
      if (user) {
        await makeUserAdmin(user.uid);
        console.log('✅ Alternative method successful!');
      }
    } else {
      console.log('ℹ️ App auth functions not available in global scope');
    }
  } catch (error) {
    console.log('ℹ️ Alternative method not available:', error.message);
  }
})();
