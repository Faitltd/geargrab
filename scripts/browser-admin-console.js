/**
 * Browser Console Admin Script
 * 
 * INSTRUCTIONS:
 * 1. Open your GearGrab app in the browser (http://localhost:5173)
 * 2. Make sure you're logged in as Admin@itsfait.com
 * 3. Open browser developer tools (F12)
 * 4. Go to the Console tab
 * 5. Copy and paste this entire script
 * 6. Press Enter to run it
 * 
 * This script will make you an admin directly from the browser.
 */

(async function makeCurrentUserAdmin() {
  try {
    console.log('🔧 GearGrab Browser Admin Setup');
    console.log('================================\n');

    // Check if Firebase is available
    if (typeof window === 'undefined') {
      throw new Error('This script must be run in a browser');
    }

    // Import Firebase functions from the app
    const { auth, firestore } = await import('/src/lib/firebase/client.ts');
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    console.log('✅ Firebase modules loaded');

    // Check if user is logged in
    if (!auth.currentUser) {
      throw new Error('❌ No user is currently logged in. Please log in first.');
    }

    const user = auth.currentUser;
    console.log(`👤 Current user: ${user.email} (${user.uid})`);

    // Verify this is the correct user
    if (user.uid !== 'NivAg90815PbcmUrbtYOtqX30J02') {
      console.warn(`⚠️  Warning: Expected UID 'NivAg90815PbcmUrbtYOtqX30J02' but got '${user.uid}'`);
      console.log('Continuing anyway...');
    }

    console.log('🔄 Creating admin document...');

    // Create admin document
    const adminRef = doc(firestore, 'adminUsers', user.uid);
    await setDoc(adminRef, {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: 'browser-console-script',
      userEmail: user.email
    });

    console.log('✅ Successfully granted admin privileges!');
    console.log(`📧 Admin user: ${user.email}`);
    console.log(`🆔 User UID: ${user.uid}`);
    console.log('🔗 You can now access admin features at: /admin/users');
    console.log('🔄 Refresh the page to see the admin navigation.');

    // Test the admin check function
    console.log('\n🧪 Testing admin check...');
    const { isCurrentUserAdmin } = await import('/src/lib/firebase/auth.ts');
    const isAdmin = await isCurrentUserAdmin();
    console.log(`✅ Admin check result: ${isAdmin}`);

    if (isAdmin) {
      console.log('🎉 SUCCESS! You are now an admin!');
      console.log('💡 Refresh the page to see the yellow "Admin" link in the navbar.');
    } else {
      console.log('❌ Admin check failed. There might be a caching issue.');
      console.log('💡 Try refreshing the page and running the check again.');
    }

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied. This could be due to Firestore rules.');
      console.log('Try the Firebase Console method instead:');
      console.log('1. Go to Firebase Console > Firestore Database');
      console.log('2. Create collection "adminUsers"');
      console.log('3. Add document with ID: NivAg90815PbcmUrbtYOtqX30J02');
      console.log('4. Add fields: isAdmin (boolean: true), role (string: "admin"), permissions (array: ["all"])');
    }
  }
})();

// Also provide a simple function for manual execution
window.makeCurrentUserAdmin = async function() {
  const { auth, firestore } = await import('/src/lib/firebase/client.ts');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  
  if (!auth.currentUser) {
    console.error('No user logged in');
    return;
  }
  
  const adminRef = doc(firestore, 'adminUsers', auth.currentUser.uid);
  await setDoc(adminRef, {
    isAdmin: true,
    role: 'admin',
    createdAt: serverTimestamp(),
    permissions: ['all'],
    createdBy: 'manual-browser-function'
  });
  
  console.log('Admin privileges granted! Refresh the page.');
};

console.log('💡 You can also run: makeCurrentUserAdmin() manually');
