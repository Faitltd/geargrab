import { storage } from '$lib/firebase/client';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auditLog } from './audit';

// File type configurations
export const FILE_CONFIGS = {
  // Profile images
  profileImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    path: 'profile-images'
  },

  // Listing images
  listingImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    path: 'listing-images'
  },

  // Message attachments
  messageAttachment: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      '.pdf', '.txt', '.doc', '.docx'
    ],
    path: 'message-attachments'
  },

  // Verification documents
  verificationDocument: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    path: 'verification-documents'
  },

  // Insurance claim documents
  claimDocument: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'text/plain'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt'],
    path: 'claim-documents'
  }
};

// Security validation for files
export class SecureFileUpload {
  // Validate file against security rules
  static validateFile(
    file: File,
    configType: keyof typeof FILE_CONFIGS
  ): { isValid: boolean; error?: string } {
    const config = FILE_CONFIGS[configType];

    // Check file size
    if (file.size > config.maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.formatFileSize(config.maxSize)}`
      };
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
      };
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!config.allowedExtensions.includes(extension.toLowerCase())) {
      return {
        isValid: false,
        error: `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`
      };
    }

    // Check for suspicious file names
    if (this.isSuspiciousFileName(file.name)) {
      return {
        isValid: false,
        error: 'File name contains suspicious characters'
      };
    }

    // Additional security checks
    const securityCheck = this.performSecurityChecks(file);
    if (!securityCheck.isValid) {
      return securityCheck;
    }

    return { isValid: true };
  }

  // Perform additional security checks
  private static performSecurityChecks(file: File): { isValid: boolean; error?: string } {
    // Check for executable file signatures (magic bytes)
    const suspiciousSignatures = [
      'MZ', // Windows executable
      '7zXZ', // 7-Zip
      'Rar!', // RAR archive
      'PK', // ZIP archive (could contain executables)
    ];

    // Note: In a real implementation, you'd read the first few bytes of the file
    // For now, we'll do basic checks based on file properties

    // Check for double extensions (e.g., file.jpg.exe)
    const fileName = file.name.toLowerCase();
    const doubleExtensionPattern = /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg|msi)\./;
    if (doubleExtensionPattern.test(fileName)) {
      return {
        isValid: false,
        error: 'File appears to have a double extension, which is not allowed'
      };
    }

    // Check for null bytes in filename (path traversal attempt)
    if (fileName.includes('\0')) {
      return {
        isValid: false,
        error: 'File name contains invalid characters'
      };
    }

    return { isValid: true };
  }

  // Check for suspicious file names
  private static isSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.\./,           // Path traversal
      /[<>:"|?*]/,      // Invalid filename characters
      /^\./,            // Hidden files
      /\0/,             // Null bytes
      /script/i,        // Script-related names
      /\.php$/i,        // PHP files
      /\.asp$/i,        // ASP files
      /\.jsp$/i,        // JSP files
      /\.exe$/i,        // Executables
      /\.bat$/i,        // Batch files
      /\.cmd$/i,        // Command files
      /\.scr$/i,        // Screen savers
      /\.vbs$/i,        // VB scripts
      /\.js$/i,         // JavaScript files (in this context)
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  // Generate secure file name
  static generateSecureFileName(originalName: string, userId: string): string {
    const extension = this.getFileExtension(originalName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const userPrefix = userId.substring(0, 8);
    
    return `${userPrefix}_${timestamp}_${randomString}${extension}`;
  }

  // Get file extension
  private static getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  // Format file size for display
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Upload file securely
  static async uploadFile(
    file: File,
    configType: keyof typeof FILE_CONFIGS,
    userId: string,
    additionalPath?: string
  ): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    try {
      // Validate file
      const validation = this.validateFile(file, configType);
      if (!validation.isValid) {
        await auditLog.logSecurityEvent({
          type: 'invalid_input',
          userId,
          timestamp: new Date(),
          details: {
            action: 'file_upload_validation_failed',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: validation.error
          },
          severity: 'medium'
        });

        return { success: false, error: validation.error };
      }

      // Generate secure file name
      const secureFileName = this.generateSecureFileName(file.name, userId);
      const config = FILE_CONFIGS[configType];
      
      // Build file path
      let filePath = `${config.path}/${userId}`;
      if (additionalPath) {
        filePath += `/${additionalPath}`;
      }
      filePath += `/${secureFileName}`;

      // Create storage reference
      const storageRef = ref(storage, filePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        customMetadata: {
          originalName: file.name,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          configType,
          validated: 'true'
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Log successful upload
      await auditLog.logUserActivity({
        userId,
        action: 'file_uploaded',
        resource: 'file',
        resourceId: secureFileName,
        timestamp: new Date(),
        success: true,
        details: {
          originalName: file.name,
          secureFileName,
          fileSize: file.size,
          fileType: file.type,
          configType,
          path: filePath
        }
      });

      return {
        success: true,
        url: downloadURL,
        fileName: secureFileName
      };

    } catch (error) {
      console.error('File upload error:', error);

      await auditLog.logSecurityEvent({
        type: 'file_uploaded',
        userId,
        timestamp: new Date(),
        details: {
          action: 'file_upload_failed',
          fileName: file.name,
          error: error.message
        },
        severity: 'medium'
      });

      return {
        success: false,
        error: 'Failed to upload file. Please try again.'
      };
    }
  }

  // Delete file securely
  static async deleteFile(
    filePath: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user has permission to delete this file
      if (!filePath.includes(userId)) {
        await auditLog.logSecurityEvent({
          type: 'unauthorized_access_attempt',
          userId,
          timestamp: new Date(),
          details: {
            action: 'unauthorized_file_deletion_attempt',
            filePath
          },
          severity: 'high'
        });

        return { success: false, error: 'Unauthorized file deletion attempt' };
      }

      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);

      // Log successful deletion
      await auditLog.logUserActivity({
        userId,
        action: 'file_deleted',
        resource: 'file',
        resourceId: filePath,
        timestamp: new Date(),
        success: true
      });

      return { success: true };

    } catch (error) {
      console.error('File deletion error:', error);

      await auditLog.logUserActivity({
        userId,
        action: 'file_deleted',
        resource: 'file',
        resourceId: filePath,
        timestamp: new Date(),
        success: false,
        details: { error: error.message }
      });

      return {
        success: false,
        error: 'Failed to delete file. Please try again.'
      };
    }
  }

  // Scan uploaded file for malware (placeholder for future implementation)
  static async scanFileForMalware(file: File): Promise<{ isSafe: boolean; threats?: string[] }> {
    // In a production environment, you would integrate with a service like:
    // - VirusTotal API
    // - ClamAV
    // - AWS GuardDuty
    // - Google Cloud Security Command Center
    
    // For now, return safe (but log that scanning should be implemented)
    console.warn('File malware scanning not implemented - consider adding virus scanning service');
    
    return { isSafe: true };
  }

  // Get file metadata
  static async getFileMetadata(filePath: string): Promise<any> {
    try {
      const storageRef = ref(storage, filePath);
      // Note: Firebase Storage doesn't provide a direct way to get metadata
      // In a production environment, you might store metadata in Firestore
      return null;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
}
