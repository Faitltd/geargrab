/**
 * Storage Service for Firebase Storage
 */

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '$lib/firebase/client';

// Initialize Firebase Storage
const storage = getStorage(firebaseApp);

/**
 * Upload file to Firebase Storage
 * @param file - File to upload
 * @param folder - Storage folder path
 * @returns Promise<string> - Download URL
 */
export async function uploadToFirebaseStorage(file: File, folder: string = 'uploads'): Promise<string> {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomId}.${extension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${filename}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Compress image before upload
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Promise<File> - Compressed file
 */
export async function compressImage(
  file: File, 
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file
 * @param file - File to validate
 * @param options - Validation options
 * @returns boolean - Is valid
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { isValid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
    };
  }
  
  return { isValid: true };
}
