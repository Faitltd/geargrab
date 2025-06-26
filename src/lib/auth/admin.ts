/**
 * Admin Authentication and Authorization
 * Handles admin user detection and permissions
 */

import { simpleAuth } from './simple-auth';
import { firestore } from '$lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Admin user emails - add your email here
const ADMIN_EMAILS = [
  '126212038+Faitltd@users.noreply.github.com', // Your GitHub email
  'faitltd@gmail.com', // Add your personal email if different
  'ray@itsfait.com', // Ray's admin email
  'Ray@itsfait.com', // Ray's admin email (case variation)
  // Add other admin emails as needed
];

// Admin user UIDs (if known)
const ADMIN_UIDS = [
  // Add specific UIDs if known
];

export interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
  adminLevel: 'super' | 'moderator' | 'support';
  permissions: string[];
}

/**
 * Check if current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = simpleAuth.user;
    if (!user) return false;

    return await isUserAdmin(user.uid, user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a user is an admin by UID or email
 */
export async function isUserAdmin(uid: string, email?: string): Promise<boolean> {
  try {
    // Check by UID first
    if (ADMIN_UIDS.includes(uid)) {
      return true;
    }

    // Check by email
    if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
      return true;
    }

    // Check admin collection in Firestore
    const adminDoc = await getDoc(doc(firestore, 'admins', uid));
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      return adminData.isAdmin === true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get admin user data
 */
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  try {
    const adminDoc = await getDoc(doc(firestore, 'admins', uid));
    if (adminDoc.exists()) {
      return adminDoc.data() as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

/**
 * Set user as admin (for initial setup)
 */
export async function setUserAsAdmin(uid: string, email: string, adminLevel: 'super' | 'moderator' | 'support' = 'super'): Promise<void> {
  try {
    const adminData: AdminUser = {
      uid,
      email: email.toLowerCase(),
      isAdmin: true,
      adminLevel,
      permissions: getPermissionsForLevel(adminLevel)
    };

    await setDoc(doc(firestore, 'admins', uid), adminData);
    console.log('✅ User set as admin:', email);
  } catch (error) {
    console.error('Error setting user as admin:', error);
    throw error;
  }
}

/**
 * Get permissions for admin level
 */
function getPermissionsForLevel(level: 'super' | 'moderator' | 'support'): string[] {
  const basePermissions = ['view_admin_panel', 'view_listings'];
  
  switch (level) {
    case 'super':
      return [
        ...basePermissions,
        'delete_any_listing',
        'edit_any_listing',
        'manage_users',
        'manage_admins',
        'view_analytics',
        'manage_payments',
        'system_settings'
      ];
    case 'moderator':
      return [
        ...basePermissions,
        'delete_any_listing',
        'edit_any_listing',
        'view_analytics'
      ];
    case 'support':
      return [
        ...basePermissions,
        'edit_any_listing'
      ];
    default:
      return basePermissions;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const user = simpleAuth.user;
    if (!user) return false;

    const adminUser = await getAdminUser(user.uid);
    if (!adminUser) return false;

    return adminUser.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Initialize admin user (call this when an admin first logs in)
 */
export async function initializeAdminUser(): Promise<void> {
  try {
    const user = simpleAuth.user;
    if (!user) return;

    // Check if user should be admin
    const shouldBeAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '') || 
                         ADMIN_UIDS.includes(user.uid);

    if (shouldBeAdmin) {
      // Check if already in admin collection
      const existingAdmin = await getAdminUser(user.uid);
      if (!existingAdmin) {
        // Set as admin
        await setUserAsAdmin(user.uid, user.email || '', 'super');
        console.log('🔑 Initialized admin user:', user.email);
      }
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

/**
 * Admin guard for components/pages
 */
export async function requireAdmin(): Promise<boolean> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn('🚫 Admin access required');
    return false;
  }
  return true;
}
