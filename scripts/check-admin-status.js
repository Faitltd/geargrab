// Check and grant admin status for current user
// Run this in the browser console on localhost:5174 (or whatever port the dev server is using)

console.log('🔍 Checking admin status...');

async function checkAndGrantAdmin() {
  try {
    // Import Firebase modules
    const { auth, firestore } = await import('/src/lib/firebase/client.ts');
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { isCurrentUserAdmin } = await import('/src/lib/firebase/auth.ts');

    // Check if user is logged in
    if (!auth.currentUser) {
      console.error('❌ No user is currently logged in');
      console.log('💡 Please log in first, then run this script again');
      return;
    }

    const user = auth.currentUser;
    console.log(`👤 Current user: ${user.email} (${user.uid})`);

    // Check current admin status
    console.log('🔍 Checking current admin status...');
    const isAdmin = await isCurrentUserAdmin();
    console.log(`📊 Current admin status: ${isAdmin}`);

    if (isAdmin) {
      console.log('✅ User already has admin privileges!');
      console.log('🔗 You can access admin features at: /admin');
      return;
    }

    // Check if admin document exists
    const adminRef = doc(firestore, 'adminUsers', user.uid);
    const adminSnap = await getDoc(adminRef);
    
    if (adminSnap.exists()) {
      console.log('📄 Admin document exists:', adminSnap.data());
    } else {
      console.log('📄 No admin document found, creating one...');
    }

    // Grant admin privileges
    console.log('🔄 Granting admin privileges...');
    await setDoc(adminRef, {
      isAdmin: true,
      role: 'admin',
      createdAt: serverTimestamp(),
      permissions: ['all'],
      createdBy: 'check-admin-status-script',
      userEmail: user.email
    });

    console.log('✅ Successfully granted admin privileges!');
    console.log(`📧 Admin user: ${user.email}`);
    console.log(`🆔 User UID: ${user.uid}`);
    console.log('🔗 You can now access admin features at: /admin');
    console.log('🔄 Refresh the page to see the admin navigation.');

    // Verify the change
    console.log('\n🧪 Verifying admin status...');
    const newAdminStatus = await isCurrentUserAdmin();
    console.log(`✅ New admin status: ${newAdminStatus}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkAndGrantAdmin();

// Also provide a simple function for manual execution
window.checkAndGrantAdmin = checkAndGrantAdmin;

console.log('💡 You can also run: checkAndGrantAdmin() manually');
