import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '$lib/firebase';
import type { CapturedPhoto } from './camera';

// Condition check data interfaces
export interface ConditionCheckPhoto {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: any;
  metadata?: {
    width?: number;
    height?: number;
    deviceInfo?: string;
  };
}

export interface ConditionCheck {
  id?: string;
  rentalId: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  type: 'before' | 'after';
  status: 'pending' | 'completed' | 'approved' | 'disputed';
  photos: ConditionCheckPhoto[];
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  deviceInfo?: {
    userAgent: string;
    timestamp: number;
  };
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

// Upload progress callback
export type UploadProgressCallback = (progress: number, photoIndex: number) => void;

/**
 * Upload condition check photos to Firebase Storage
 */
export const uploadConditionCheckPhotos = async (
  rentalId: string,
  type: 'before' | 'after',
  photos: CapturedPhoto[],
  onProgress?: UploadProgressCallback
): Promise<ConditionCheckPhoto[]> => {
  if (!storage) {
    throw new Error('Firebase storage not initialized');
  }

  if (photos.length === 0) {
    throw new Error('No photos to upload');
  }

  const uploadedPhotos: ConditionCheckPhoto[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    try {
      // Create filename with timestamp and index
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${type}_${timestamp}_${i + 1}.jpg`;
      
      // Create storage reference
      const photoRef = ref(storage, `conditionChecks/${rentalId}/${type}/${filename}`);
      
      // Upload photo
      const snapshot = await uploadBytes(photoRef, photo.blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          originalId: photo.id,
          captureTimestamp: photo.timestamp.toString(),
          size: photo.size.toString()
        }
      });

      // Get download URL
      const url = await getDownloadURL(snapshot.ref);

      // Create photo record
      const uploadedPhoto: ConditionCheckPhoto = {
        id: photo.id,
        url,
        filename,
        size: photo.size,
        uploadedAt: serverTimestamp(),
        metadata: {
          deviceInfo: navigator.userAgent
        }
      };

      uploadedPhotos.push(uploadedPhoto);

      // Report progress
      if (onProgress) {
        onProgress(((i + 1) / photos.length) * 100, i);
      }

    } catch (error) {
      console.error(`Failed to upload photo ${i + 1}:`, error);
      throw new Error(`Failed to upload photo ${i + 1}: ${error}`);
    }
  }

  return uploadedPhotos;
};

/**
 * Upload photos for before pickup condition check
 */
export const uploadBeforePickupPhotos = async (
  rentalId: string,
  photos: CapturedPhoto[],
  userId: string,
  notes?: string,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Check if before condition check already exists
    const existingChecks = await getDocs(
      query(
        collection(db, 'conditionChecks'),
        where('rentalId', '==', rentalId),
        where('type', '==', 'before')
      )
    );

    if (!existingChecks.empty) {
      throw new Error('Before pickup condition check already exists for this rental');
    }

    // Get current location
    const location = await getCurrentLocation();

    // Upload photos to storage
    const uploadedPhotos = await uploadConditionCheckPhotos(
      rentalId,
      'before',
      photos,
      onProgress
    );

    // Get rental details for the condition check
    const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
    if (!rentalDoc.exists()) {
      throw new Error('Rental not found');
    }

    const rentalData = rentalDoc.data();

    // Create condition check record
    const conditionCheckData: Omit<ConditionCheck, 'id' | 'createdAt' | 'updatedAt'> = {
      rentalId,
      listingId: rentalData.listingId,
      renterId: rentalData.renterId,
      ownerId: rentalData.ownerId,
      type: 'before',
      status: 'completed',
      photos: uploadedPhotos,
      notes: notes || '',
      location,
      deviceInfo: {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      completedAt: serverTimestamp()
    };

    // Save to Firestore
    const conditionCheckRef = await addDoc(collection(db, 'conditionChecks'), {
      ...conditionCheckData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update rental status to indicate before photos are uploaded
    await updateDoc(doc(db, 'rentals', rentalId), {
      'conditionChecks.before': {
        id: conditionCheckRef.id,
        status: 'completed',
        completedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return conditionCheckRef.id;

  } catch (error) {
    console.error('Error uploading before pickup photos:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload before pickup photos');
  }
};

/**
 * Get condition check by rental ID and type
 */
export const getConditionCheck = async (
  rentalId: string,
  type: 'before' | 'after'
): Promise<ConditionCheck | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'conditionChecks'),
      where('rentalId', '==', rentalId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ConditionCheck;

  } catch (error) {
    console.error('Error getting condition check:', error);
    throw new Error('Failed to get condition check');
  }
};

/**
 * Get all condition checks for a rental
 */
export const getRentalConditionChecks = async (
  rentalId: string
): Promise<{ before?: ConditionCheck; after?: ConditionCheck }> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'conditionChecks'),
      where('rentalId', '==', rentalId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const result: { before?: ConditionCheck; after?: ConditionCheck } = {};

    querySnapshot.forEach((doc) => {
      const conditionCheck = {
        id: doc.id,
        ...doc.data()
      } as ConditionCheck;

      if (conditionCheck.type === 'before') {
        result.before = conditionCheck;
      } else if (conditionCheck.type === 'after') {
        result.after = conditionCheck;
      }
    });

    return result;

  } catch (error) {
    console.error('Error getting rental condition checks:', error);
    throw new Error('Failed to get rental condition checks');
  }
};

/**
 * Check if condition check exists for rental and type
 */
export const checkConditionCheckExists = async (
  rentalId: string,
  type: 'before' | 'after'
): Promise<boolean> => {
  try {
    const conditionCheck = await getConditionCheck(rentalId, type);
    return conditionCheck !== null;
  } catch (error) {
    console.error('Error checking condition check existence:', error);
    return false;
  }
};

/**
 * Create a condition check record
 */
export const createConditionCheck = async (
  conditionCheckData: Omit<ConditionCheck, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const conditionCheckRef = await addDoc(collection(db, 'conditionChecks'), {
      ...conditionCheckData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return conditionCheckRef.id;
  } catch (error) {
    console.error('Error creating condition check:', error);
    throw new Error('Failed to create condition check record');
  }
};

/**
 * Update condition check status
 */
export const updateConditionCheckStatus = async (
  conditionCheckId: string,
  status: ConditionCheck['status'],
  notes?: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'conditionChecks', conditionCheckId), updateData);
  } catch (error) {
    console.error('Error updating condition check status:', error);
    throw new Error('Failed to update condition check status');
  }
};



/**
 * Get condition checks for a user (as renter or owner)
 */
export const getUserConditionChecks = async (
  userId: string,
  role: 'renter' | 'owner' = 'renter'
): Promise<ConditionCheck[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const fieldName = role === 'renter' ? 'renterId' : 'ownerId';
    const q = query(
      collection(db, 'conditionChecks'),
      where(fieldName, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conditionChecks: ConditionCheck[] = [];

    querySnapshot.forEach((doc) => {
      conditionChecks.push({
        id: doc.id,
        ...doc.data()
      } as ConditionCheck);
    });

    return conditionChecks;
  } catch (error) {
    console.error('Error getting user condition checks:', error);
    throw new Error('Failed to get user condition checks');
  }
};



/**
 * Delete condition check photos from storage
 */
export const deleteConditionCheckPhotos = async (
  rentalId: string,
  type: 'before' | 'after'
): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase storage not initialized');
  }

  try {
    const folderRef = ref(storage, `conditionChecks/${rentalId}/${type}`);
    const listResult = await listAll(folderRef);

    const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting condition check photos:', error);
    // Don't throw error for cleanup operations
  }
};

/**
 * Complete condition check process
 */
export const completeConditionCheck = async (
  rentalId: string,
  listingId: string,
  renterId: string,
  ownerId: string,
  type: 'before' | 'after',
  photos: CapturedPhoto[],
  notes?: string,
  location?: ConditionCheck['location'],
  onProgress?: UploadProgressCallback
): Promise<string> => {
  if (photos.length < 3) {
    throw new Error('At least 3 photos are required for condition check');
  }

  try {
    // Check if condition check already exists
    const existingCheck = await checkConditionCheckExists(rentalId, type);
    if (existingCheck) {
      throw new Error(`${type} condition check already exists for this rental`);
    }

    // Upload photos
    const uploadedPhotos = await uploadConditionCheckPhotos(
      rentalId,
      type,
      photos,
      onProgress
    );

    // Create condition check record
    const conditionCheckData: Omit<ConditionCheck, 'id' | 'createdAt' | 'updatedAt'> = {
      rentalId,
      listingId,
      renterId,
      ownerId,
      type,
      status: 'completed',
      photos: uploadedPhotos,
      notes,
      location,
      deviceInfo: {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      completedAt: serverTimestamp()
    };

    const conditionCheckId = await createConditionCheck(conditionCheckData);

    // Update rental verification status
    await updateRentalVerificationStatus(rentalId, type, conditionCheckId);

    return conditionCheckId;

  } catch (error) {
    console.error('Error completing condition check:', error);
    throw error;
  }
};

/**
 * Update rental verification status
 */
export const updateRentalVerificationStatus = async (
  rentalId: string,
  type: 'before' | 'after',
  conditionCheckId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const updateData: any = {};
    updateData[`verification.${type}Photos.completed`] = true;
    updateData[`verification.${type}Photos.completedAt`] = serverTimestamp();
    updateData[`verification.${type}Photos.conditionCheckId`] = conditionCheckId;
    updateData.updatedAt = serverTimestamp();

    await updateDoc(doc(db, 'rentals', rentalId), updateData);
    console.log(`Updated rental ${rentalId} verification status for ${type} photos`);
  } catch (error) {
    console.error('Error updating rental verification status:', error);
    throw new Error('Failed to update rental verification status');
  }
};

/**
 * Get rental verification status
 */
export const getRentalVerificationStatus = async (rentalId: string): Promise<{
  beforePhotos: { required: boolean; completed: boolean; completedAt?: any; conditionCheckId?: string };
  afterPhotos: { required: boolean; completed: boolean; completedAt?: any; conditionCheckId?: string };
} | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));

    if (rentalDoc.exists()) {
      const rentalData = rentalDoc.data();
      return rentalData.verification || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting rental verification status:', error);
    throw new Error('Failed to get rental verification status');
  }
};

/**
 * Get device location for condition check
 */
export const getCurrentLocation = (): Promise<ConditionCheck['location']> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Failed to get location:', error);
        // Don't reject, location is optional
        resolve(undefined);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};
