import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminStorage } from '$firebase/server';
import { auditLog } from '$lib/security/audit';
import crypto from 'crypto';

// File validation configuration
const LISTING_IMAGE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  maxImages: 10
};

// Validate image file
function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > LISTING_IMAGE_CONFIG.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${LISTING_IMAGE_CONFIG.maxSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (!LISTING_IMAGE_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${LISTING_IMAGE_CONFIG.allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!LISTING_IMAGE_CONFIG.allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} not allowed`
    };
  }

  return { isValid: true };
}

// Generate secure filename
function generateSecureFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}_${timestamp}_${randomBytes}.${extension}`;
}

export const POST: RequestHandler = createSecureHandler(
  async ({ request, getClientAddress }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('image') as File;
      const listingId = formData.get('listingId') as string;

      if (!file) {
        return json({ error: 'No image file provided' }, { status: 400 });
      }

      if (!listingId) {
        return json({ error: 'Listing ID is required' }, { status: 400 });
      }

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        return json({ error: validation.error }, { status: 400 });
      }

      // Generate secure filename
      const secureFileName = generateSecureFileName(file.name, auth.userId);
      const filePath = `listings/${listingId}/${secureFileName}`;

      // Convert File to Buffer for server-side upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Firebase Storage
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(filePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: auth.userId,
            uploadedAt: new Date().toISOString(),
            listingId,
            validated: 'true'
          }
        }
      });

      // Get signed URL (valid for 1 year)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
      });

      // Log successful upload
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'listing_image_uploaded',
        resource: 'listing',
        resourceId: listingId,
        timestamp: new Date(),
        success: true,
        details: {
          originalName: file.name,
          secureFileName,
          fileSize: file.size,
          fileType: file.type,
          path: filePath
        }
      });

      return json({
        success: true,
        url: signedUrl,
        fileName: secureFileName,
        filePath
      });

    } catch (error) {
      console.error('Error uploading listing image:', error);

      // Log the error
      await auditLog.logSecurityEvent({
        type: 'file_upload_error',
        userId: auth.userId,
        ip: getClientAddress(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      return json({ 
        error: 'Failed to upload image. Please try again.' 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: 'api',
    validateCSRF: true
  }
);
