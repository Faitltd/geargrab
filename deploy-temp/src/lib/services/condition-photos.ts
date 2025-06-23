import { browser } from '$app/environment';
import { storage } from '$lib/firebase/client';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestore } from '$lib/firebase/client';
import { collection, doc, addDoc, updateDoc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { GearConditionPhoto, GearConditionReport, PhotoUploadProgress, GearDamage } from '$lib/types/gear-condition';

// Upload condition photo to Firebase Storage
export async function uploadConditionPhoto(
  file: File,
  bookingId: string,
  photoType: string,
  uploadedBy: string,
  uploadedByRole: 'owner' | 'renter',
  onProgress?: (progress: number) => void
): Promise<GearConditionPhoto> {
  if (!browser) throw new Error('Photo upload can only be called in the browser');

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `condition-photos/${bookingId}/${photoType}/${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create photo record
            const photo: Omit<GearConditionPhoto, 'id'> = {
              url: downloadURL,
              caption: '',
              timestamp: new Date(),
              uploadedBy,
              uploadedByRole,
              photoType: photoType as any,
              metadata: {
                location: '',
                weather: '',
                notes: ''
              }
            };
            
            // Save to Firestore
            const photosRef = collection(firestore, 'conditionPhotos');
            const docRef = await addDoc(photosRef, {
              ...photo,
              timestamp: serverTimestamp()
            });
            
            const savedPhoto: GearConditionPhoto = {
              id: docRef.id,
              ...photo
            };
            
            console.log('✅ Photo uploaded successfully:', savedPhoto.id);
            resolve(savedPhoto);
            
          } catch (error) {
            console.error('Error saving photo record:', error);
            reject(error);
          }
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Error uploading condition photo:', error);
    throw error;
  }
}

// Delete condition photo
export async function deleteConditionPhoto(photoId: string, photoUrl: string): Promise<void> {
  if (!browser) throw new Error('Photo deletion can only be called in the browser');

  try {
    // Delete from Storage
    const storageRef = ref(storage, photoUrl);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    const photoRef = doc(firestore, 'conditionPhotos', photoId);
    await updateDoc(photoRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    });
    
    console.log('✅ Photo deleted successfully:', photoId);
  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    throw error;
  }
}

// Create condition report
export async function createConditionReport(
  bookingId: string,
  listingId: string,
  reportType: 'pickup' | 'return',
  createdBy: string
): Promise<string> {
  if (!browser) throw new Error('Condition report creation can only be called in the browser');

  try {
    const report: Omit<GearConditionReport, 'id'> = {
      bookingId,
      listingId,
      reportType,
      status: 'pending',
      photos: {
        overview: [],
        damage: [],
        wear: [],
        serialNumber: [],
        accessories: [],
        custom: []
      },
      overallCondition: 'good',
      conditionNotes: '',
      damages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    const reportsRef = collection(firestore, 'conditionReports');
    const docRef = await addDoc(reportsRef, {
      ...report,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Condition report created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating condition report:', error);
    throw error;
  }
}

// Update condition report
export async function updateConditionReport(
  reportId: string,
  updates: Partial<GearConditionReport>
): Promise<void> {
  if (!browser) throw new Error('Condition report update can only be called in the browser');

  try {
    const reportRef = doc(firestore, 'conditionReports', reportId);
    await updateDoc(reportRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Condition report updated:', reportId);
  } catch (error) {
    console.error('❌ Error updating condition report:', error);
    throw error;
  }
}

// Get condition report
export async function getConditionReport(reportId: string): Promise<GearConditionReport | null> {
  if (!browser) throw new Error('Condition report retrieval can only be called in the browser');

  try {
    const reportRef = doc(firestore, 'conditionReports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (reportSnap.exists()) {
      const data = reportSnap.data();
      return {
        id: reportSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as GearConditionReport;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting condition report:', error);
    throw error;
  }
}

// Get condition reports for booking
export async function getConditionReportsForBooking(bookingId: string): Promise<GearConditionReport[]> {
  if (!browser) throw new Error('Condition reports retrieval can only be called in the browser');

  try {
    const reportsRef = collection(firestore, 'conditionReports');
    const q = query(reportsRef, where('bookingId', '==', bookingId));
    const querySnapshot = await getDocs(q);

    const reports: GearConditionReport[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as GearConditionReport);
    });

    return reports;
  } catch (error) {
    console.error('❌ Error getting condition reports for booking:', error);
    throw error;
  }
}

// Add damage to report
export async function addDamageToReport(
  reportId: string,
  damage: Omit<GearDamage, 'id'>
): Promise<string> {
  if (!browser) throw new Error('Damage addition can only be called in the browser');

  try {
    const damageId = `damage_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const damageWithId: GearDamage = {
      id: damageId,
      ...damage
    };

    const reportRef = doc(firestore, 'conditionReports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (reportSnap.exists()) {
      const currentData = reportSnap.data() as GearConditionReport;
      const updatedDamages = [...(currentData.damages || []), damageWithId];

      await updateDoc(reportRef, {
        damages: updatedDamages,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Damage added to report:', damageId);
      return damageId;
    } else {
      throw new Error('Condition report not found');
    }
  } catch (error) {
    console.error('❌ Error adding damage to report:', error);
    throw error;
  }
}

// Confirm condition report
export async function confirmConditionReport(
  reportId: string,
  userRole: 'owner' | 'renter',
  signature?: string,
  notes?: string
): Promise<void> {
  if (!browser) throw new Error('Condition report confirmation can only be called in the browser');

  try {
    const confirmation = {
      confirmed: true,
      timestamp: new Date(),
      signature,
      notes
    };

    const updateField = userRole === 'owner' ? 'ownerConfirmation' : 'renterConfirmation';
    
    await updateConditionReport(reportId, {
      [updateField]: confirmation,
      status: 'completed'
    });

    console.log('✅ Condition report confirmed by:', userRole);
  } catch (error) {
    console.error('❌ Error confirming condition report:', error);
    throw error;
  }
}

// Resize image for thumbnail
export function resizeImage(file: File, maxWidth: number = 300, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
}
