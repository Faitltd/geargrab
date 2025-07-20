// Firebase Storage Service - File upload functionality
import { storage } from '$lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  type UploadTask
} from 'firebase/storage';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export class StorageService {
  
  /**
   * Upload a file to Firebase Storage
   */
  static async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      const storageRef = ref(storage, path);
      
      if (onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress: UploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              };
              onProgress(progress);
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  url: downloadURL,
                  path,
                  size: file.size,
                  contentType: file.type
                });
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Simple upload without progress tracking
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
          url: downloadURL,
          path,
          size: file.size,
          contentType: file.type
        };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: File[],
    basePath: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${basePath}/${fileName}`;
      
      const result = await this.uploadFile(
        file,
        filePath,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );
      
      results.push(result);
    }
    
    return results;
  }

  /**
   * Delete a file from Firebase Storage
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }

      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(paths: string[]): Promise<void> {
    const deletePromises = paths.map(path => this.deleteFile(path));
    await Promise.all(deletePromises);
  }

  /**
   * Generate a unique file path for uploads
   */
  static generateFilePath(category: string, userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${category}/${userId}/${timestamp}-${randomId}-${cleanFileName}`;
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxWidth?: number;
    maxHeight?: number;
  } = {}): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxWidth = 4000,
      maxHeight = 4000
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
      };
    }

    // For images, we could add dimension validation here
    // This would require reading the image file, which is async
    // For now, we'll just return valid

    return { valid: true };
  }

  /**
   * Compress image before upload (client-side)
   */
  static async compressImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
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
}

// Specialized services for different file types
export class ListingImageService {
  static async uploadListingImages(
    files: File[],
    listingId: string,
    userId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const basePath = `listings/${listingId}`;
    const results = await StorageService.uploadFiles(files, basePath, onProgress);
    return results.map(result => result.url);
  }

  static async deleteListingImages(imagePaths: string[]): Promise<void> {
    await StorageService.deleteFiles(imagePaths);
  }
}

export class ProfileImageService {
  static async uploadProfileImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Compress image before upload
    const compressedFile = await StorageService.compressImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.9
    });

    const path = StorageService.generateFilePath('profiles', userId, compressedFile.name);
    const result = await StorageService.uploadFile(compressedFile, path, onProgress);
    return result.url;
  }

  static async deleteProfileImage(imagePath: string): Promise<void> {
    await StorageService.deleteFile(imagePath);
  }
}
