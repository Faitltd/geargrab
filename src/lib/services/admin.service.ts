import { dev } from '$app/environment';
import { db } from '$lib/firebase';
import { authStore } from '$lib/stores/auth.store';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import { UserService, ListingService, BookingService, DisputeService } from './firestore.service';

// Admin role types
export type AdminRole = 'super_admin' | 'admin' | 'moderator';

// Admin user interface
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: string[];
  createdAt: any;
  createdBy: string;
  isActive: boolean;
}

// Dispute interface
export interface Dispute {
  id?: string;
  type: 'condition' | 'damage' | 'missing_items' | 'other';
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  rentalId: string;
  listingId: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  title: string;
  description: string;
  evidence: {
    photos: string[];
    documents: string[];
    messages: string[];
  };
  resolution?: {
    action: string;
    reason: string;
    compensation?: number;
    resolvedBy: string;
    resolvedAt: any;
  };
  createdAt: any;
  updatedAt: any;
}

// Review queue item interface
export interface ReviewQueueItem {
  id?: string;
  type: 'listing' | 'user' | 'review' | 'message';
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  priority: 'low' | 'medium' | 'high';
  itemId: string;
  itemType: string;
  reportReason?: string;
  reportedBy?: string;
  reportedAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
  notes?: string;
  createdAt: any;
}

// Admin action log interface
export interface AdminAction {
  id?: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'user' | 'listing' | 'dispute' | 'review';
  targetId: string;
  details: Record<string, any>;
  reason?: string;
  createdAt: any;
}

// Designated admin UIDs (in production, this would be in environment variables or Firestore)
const ADMIN_UIDS = [
  'admin-uid-1', // Replace with actual admin UIDs
  'admin-uid-2',
  'super-admin-uid'
];

/**
 * Check if current user is an admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  if (dev) {
    // In development, check localStorage for mock user
    if (typeof window !== 'undefined') {
      const user = window.localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return await isUserAdmin(userData.uid);
      }
    }
    return false;
  }

  // Get current user from auth store
  const currentUser = authStore.getCurrentUser();
  if (!currentUser) return false;

  return await isUserAdmin(currentUser.uid);
};

/**
 * Check if a user is an admin
 */
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  if (dev) {
    // In development, check against test admin UIDs
    return ADMIN_UIDS.includes(uid);
  }

  try {
    // Check if UID is in designated admin list
    if (ADMIN_UIDS.includes(uid)) {
      return true;
    }

    // Check user document for admin role
    const user = await UserService.getUser(uid);
    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get admin user details
 */
export const getAdminUser = async (uid: string): Promise<AdminUser | null> => {
  if (!db) return null;

  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    
    if (adminDoc.exists()) {
      return {
        uid,
        ...adminDoc.data()
      } as AdminUser;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
};

/**
 * Get all disputes
 */
export const getDisputes = async (status?: string): Promise<Dispute[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const disputesRef = collection(db, 'disputes');
    let q = query(disputesRef, orderBy('createdAt', 'desc'));

    if (status) {
      q = query(disputesRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const disputes: Dispute[] = [];

    snapshot.forEach((doc) => {
      disputes.push({
        id: doc.id,
        ...doc.data()
      } as Dispute);
    });

    return disputes;
  } catch (error) {
    console.error('Error getting disputes:', error);
    throw new Error('Failed to load disputes');
  }
};

/**
 * Resolve a dispute
 */
export const resolveDispute = async (
  disputeId: string,
  resolution: {
    action: string;
    reason: string;
    compensation?: number;
  }
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const user = authStore.getCurrentUser();
  if (!user || !(await isUserAdmin(user.uid))) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const disputeRef = doc(db, 'disputes', disputeId);
    
    await updateDoc(disputeRef, {
      status: 'resolved',
      resolution: {
        ...resolution,
        resolvedBy: user.uid,
        resolvedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Log admin action
    await logAdminAction({
      action: 'resolve_dispute',
      targetType: 'dispute',
      targetId: disputeId,
      details: resolution,
      reason: resolution.reason
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
    throw new Error('Failed to resolve dispute');
  }
};

/**
 * Get review queue items
 */
export const getReviewQueue = async (type?: string): Promise<ReviewQueueItem[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const queueRef = collection(db, 'reviewQueue');
    let q = query(queueRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));

    if (type) {
      q = query(queueRef, where('type', '==', type), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const items: ReviewQueueItem[] = [];

    snapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as ReviewQueueItem);
    });

    return items;
  } catch (error) {
    console.error('Error getting review queue:', error);
    throw new Error('Failed to load review queue');
  }
};

/**
 * Ban a user
 */
export const banUser = async (
  userId: string,
  reason: string,
  duration?: number // Duration in days, undefined for permanent
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const user = authStore.getCurrentUser();
  if (!user || !(await isUserAdmin(user.uid))) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const banData: any = {
      isBanned: true,
      banReason: reason,
      bannedBy: user.uid,
      bannedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (duration) {
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + duration);
      banData.banUntil = banUntil;
    }

    await updateDoc(userRef, banData);

    // Log admin action
    await logAdminAction({
      action: 'ban_user',
      targetType: 'user',
      targetId: userId,
      details: { reason, duration },
      reason
    });

  } catch (error) {
    console.error('Error banning user:', error);
    throw new Error('Failed to ban user');
  }
};

/**
 * Remove a listing
 */
export const removeListing = async (listingId: string, reason: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const user = authStore.getCurrentUser();
  if (!user || !(await isUserAdmin(user.uid))) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const listingRef = doc(db, 'listings', listingId);
    
    await updateDoc(listingRef, {
      status: 'removed',
      removedBy: user.uid,
      removedAt: serverTimestamp(),
      removalReason: reason,
      updatedAt: serverTimestamp()
    });

    // Log admin action
    await logAdminAction({
      action: 'remove_listing',
      targetType: 'listing',
      targetId: listingId,
      details: { reason },
      reason
    });

  } catch (error) {
    console.error('Error removing listing:', error);
    throw new Error('Failed to remove listing');
  }
};

/**
 * Log admin action
 */
export const logAdminAction = async (actionData: Omit<AdminAction, 'id' | 'adminId' | 'adminName' | 'createdAt'>): Promise<void> => {
  if (!db) return;

  const user = authStore.getCurrentUser();
  if (!user) return;

  try {
    await addDoc(collection(db, 'adminActions'), {
      adminId: user.uid,
      adminName: user.displayName || user.email || 'Unknown Admin',
      ...actionData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw error for logging failures
  }
};
