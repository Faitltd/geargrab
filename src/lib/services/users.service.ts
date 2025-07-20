import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { updateProfile, type User } from 'firebase/auth';
import { db, storage } from '$lib/firebase';
import { authStore } from '$lib/stores/auth.store';

// User profile interface
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  isVerified: boolean;
  verificationLevel: 'none' | 'email' | 'phone' | 'id' | 'full';
  rating: number;
  reviewCount: number;
  listingCount: number;
  rentalCount: number;
  saleCount: number;
  joinedAt: any;
  lastActiveAt: any;
  createdAt: any;
  updatedAt: any;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    publicProfile: boolean;
  };
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return {
        uid,
        ...userDoc.data()
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to load user profile');
  }
};

/**
 * Create or update user profile in Firestore
 */
export const updateUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    const updateData = {
      ...profileData,
      updatedAt: serverTimestamp()
    };

    if (userDoc.exists()) {
      // Update existing profile
      await updateDoc(userRef, updateData);
    } else {
      // Create new profile
      await setDoc(userRef, {
        uid,
        isVerified: false,
        verificationLevel: 'none',
        rating: 0,
        reviewCount: 0,
        listingCount: 0,
        rentalCount: 0,
        saleCount: 0,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: true,
          publicProfile: true
        },
        createdAt: serverTimestamp(),
        ...updateData
      });
    }

    // Update Firebase Auth profile if display name or photo URL changed
    const currentUser = authStore.getCurrentUser();
    if (currentUser && (profileData.displayName || profileData.photoURL)) {
      const authUpdateData: { displayName?: string; photoURL?: string } = {};
      
      if (profileData.displayName) {
        authUpdateData.displayName = profileData.displayName;
      }
      
      if (profileData.photoURL) {
        authUpdateData.photoURL = profileData.photoURL;
      }

      await updateProfile(currentUser, authUpdateData);
      
      // Refresh auth store to reflect changes
      authStore.refreshUser();
    }

  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
};

/**
 * Create user profile in Firestore
 */
export const createUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userRef = doc(db, 'users', uid);
    const defaultProfile: UserProfile = {
      uid,
      displayName: '',
      email: '',
      photoURL: '',
      location: '',
      bio: '',
      phoneNumber: '',
      website: '',
      socialLinks: {
        instagram: '',
        facebook: '',
        twitter: ''
      },
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        publicProfile: true,
        showEmail: false,
        showPhone: false,
        showLocation: true
      },
      stats: {
        listingCount: 0,
        rentalCount: 0,
        saleCount: 0,
        totalEarnings: 0,
        averageRating: 0,
        reviewCount: 0
      },
      memberSince: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      verified: false,
      ...profileData
    };

    await setDoc(userRef, defaultProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

/**
 * Upload user avatar to Firebase Storage
 */
export const uploadUserAvatar = async (uid: string, file: File): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image file must be less than 5MB');
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `avatar_${timestamp}.${extension}`;
    
    // Upload to Firebase Storage
    const avatarRef = ref(storage, `users/${uid}/avatar/${filename}`);
    const snapshot = await uploadBytes(avatarRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar');
  }
};

/**
 * Upload profile photo to Firebase Storage
 */
export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  return uploadUserAvatar(uid, file);
};

/**
 * Delete profile photo from Firebase Storage
 */
export const deleteProfilePhoto = async (photoUrl: string): Promise<void> => {
  return deleteUserAvatar(photoUrl);
};

/**
 * Delete user avatar from Firebase Storage
 */
export const deleteUserAvatar = async (avatarUrl: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Extract storage path from URL
    const url = new URL(avatarUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const avatarRef = ref(storage, storagePath);
      await deleteObject(avatarRef);
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't throw error for avatar deletion failures
  }
};

/**
 * Subscribe to user profile changes
 */
export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const userRef = doc(db, 'users', uid);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({
        uid,
        ...doc.data()
      } as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in user profile subscription:', error);
    callback(null);
  });
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  uid: string, 
  preferences: Partial<UserProfile['preferences']>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      preferences,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('Failed to update preferences');
  }
};

/**
 * Update user's last active timestamp
 */
export const updateLastActive = async (uid: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last active:', error);
    // Don't throw error for last active updates
  }
};

/**
 * Increment user statistics
 */
export const incrementUserStats = async (
  uid: string,
  stats: {
    listingCount?: number;
    rentalCount?: number;
    saleCount?: number;
    reviewCount?: number;
  }
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentData = userDoc.data();
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (stats.listingCount !== undefined) {
        updateData.listingCount = (currentData.listingCount || 0) + stats.listingCount;
      }
      
      if (stats.rentalCount !== undefined) {
        updateData.rentalCount = (currentData.rentalCount || 0) + stats.rentalCount;
      }
      
      if (stats.saleCount !== undefined) {
        updateData.saleCount = (currentData.saleCount || 0) + stats.saleCount;
      }
      
      if (stats.reviewCount !== undefined) {
        updateData.reviewCount = (currentData.reviewCount || 0) + stats.reviewCount;
      }

      await updateDoc(userRef, updateData);
    }
  } catch (error) {
    console.error('Error incrementing user stats:', error);
    throw new Error('Failed to update user statistics');
  }
};

/**
 * Check if user profile is complete for onboarding
 */
export function isProfileComplete(profile: UserProfile): boolean {
  const requiredFields = [
    'displayName',
    'location',
    'bio'
  ];

  return requiredFields.every(field => {
    const value = profile[field as keyof UserProfile];
    return value && value.toString().trim().length > 0;
  });
}

/**
 * Complete user profile setup (onboarding)
 */
export async function completeProfileSetup(uid: string, profileData: {
  displayName: string;
  location: string;
  bio: string;
  phoneNumber?: string;
  preferences?: Partial<UserProfile['preferences']>;
}): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    const updateData = {
      displayName: profileData.displayName,
      location: profileData.location,
      bio: profileData.bio,
      phoneNumber: profileData.phoneNumber || '',
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        publicProfile: true,
        ...profileData.preferences
      },
      updatedAt: serverTimestamp(),
      profileCompletedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);

    // Update Firebase Auth profile
    const authUser = authStore.getCurrentUser();
    if (authUser) {
      await updateProfile(authUser, {
        displayName: profileData.displayName
      });
    }

  } catch (error) {
    console.error('Error completing profile setup:', error);
    throw new Error('Failed to complete profile setup');
  }
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletionPercentage(profile: UserProfile): number {
  const fields = [
    'displayName',
    'location',
    'bio',
    'phoneNumber',
    'photoURL'
  ];

  const completedFields = fields.filter(field => {
    const value = profile[field as keyof UserProfile];
    return value && value.toString().trim().length > 0;
  });

  return Math.round((completedFields.length / fields.length) * 100);
}
