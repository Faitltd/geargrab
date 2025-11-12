import { browser } from '$app/environment';
import { firestore, storage } from '$lib/firebase/client';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type {
  GearConditionReport,
  ConditionPhoto,
  ConditionPhotoCategory
} from '$lib/types/gear-condition';

export interface GearDamage {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  photos: ConditionPhoto[];
  estimatedCost: number;
  repairRequired: boolean;
  discoveredBy: 'owner' | 'renter';
  discoveredAt: Date;
  resolvedAt?: Date;
}

const COLLECTION = 'conditionReports';

function ensureBrowser() {
  if (!browser) {
    throw new Error('Condition reports are only available in the browser.');
  }
}

function defaultPhotoBuckets(): Record<ConditionPhotoCategory, ConditionPhoto[]> {
  return {
    overview: [],
    damage: [],
    wear: [],
    serialNumber: [],
    accessories: [],
    custom: []
  };
}

export async function createConditionReport(
  bookingId: string,
  listingId: string,
  reportType: 'pickup' | 'return',
  createdBy: string,
  userRole: 'owner' | 'renter'
): Promise<string> {
  ensureBrowser();

  const reportData = {
    bookingId,
    listingId,
    reportType,
    createdBy,
    userRole,
    status: 'draft',
    photos: defaultPhotoBuckets(),
    damages: [],
    overallCondition: 'good',
    conditionNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const reportRef = await addDoc(collection(firestore, COLLECTION), reportData);
  return reportRef.id;
}

export async function getConditionReport(reportId: string): Promise<GearConditionReport | null> {
  ensureBrowser();
  const reportRef = doc(firestore, COLLECTION, reportId);
  const snapshot = await getDoc(reportRef);
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as GearConditionReport) : null;
}

export async function getConditionReportsForBooking(bookingId: string): Promise<GearConditionReport[]> {
  ensureBrowser();
  const reportsQuery = query(
    collection(firestore, COLLECTION),
    where('bookingId', '==', bookingId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as GearConditionReport));
}

export async function updateConditionReport(
  reportId: string,
  updates: Partial<GearConditionReport>
): Promise<void> {
  ensureBrowser();
  const reportRef = doc(firestore, COLLECTION, reportId);
  await updateDoc(reportRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function confirmConditionReport(
  reportId: string,
  confirmation: {
    signature: string;
    notes?: string;
    userId: string;
  }
): Promise<void> {
  await updateConditionReport(reportId, {
    status: 'completed',
    confirmationSignature: confirmation.signature,
    confirmationNotes: confirmation.notes || '',
    confirmedBy: confirmation.userId,
    confirmedAt: serverTimestamp()
  } as Partial<GearConditionReport>);
}

export async function uploadConditionPhoto(
  file: File,
  bookingId: string,
  photoType: ConditionPhotoCategory,
  uploadedBy: string,
  uploadedByRole: 'owner' | 'renter',
  onProgress?: (progress: number) => void
): Promise<ConditionPhoto> {
  ensureBrowser();

  if (!storage) {
    throw new Error('Firebase storage is not configured.');
  }

  const path = `condition-reports/${bookingId}/${photoType}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const photo: ConditionPhoto = {
          id: uploadTask.snapshot.ref.name,
          url,
          category: photoType,
          uploaderId: uploadedBy,
          uploadedAt: new Date(),
          metadata: {
            role: uploadedByRole,
            size: file.size,
            type: file.type
          }
        };
        resolve(photo);
      }
    );
  });
}

export async function addDamageToReport(
  reportId: string,
  damage: Omit<GearDamage, 'id'>
): Promise<string> {
  ensureBrowser();
  const reportRef = doc(firestore, COLLECTION, reportId);
  const damageRecord: GearDamage = {
    id: `damage_${Date.now()}`,
    ...damage
  };

  await updateDoc(reportRef, {
    damages: arrayUnion(damageRecord),
    updatedAt: serverTimestamp()
  });

  return damageRecord.id;
}
