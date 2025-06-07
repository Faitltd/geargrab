import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminStorage } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';
import crypto from 'crypto';

// File validation configuration for message attachments
const MESSAGE_ATTACHMENT_CONFIG = {
  maxSize: 25 * 1024 * 1024, // 25MB
  allowedTypes: [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    // Documents
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archives
    'application/zip', 'application/x-rar-compressed'
  ],
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx',
    '.zip', '.rar'
  ]
};

// Validate attachment file
function validateAttachmentFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MESSAGE_ATTACHMENT_CONFIG.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${MESSAGE_ATTACHMENT_CONFIG.maxSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (!MESSAGE_ATTACHMENT_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} not allowed`
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!MESSAGE_ATTACHMENT_CONFIG.allowedExtensions.includes(extension)) {
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
  const extension = originalName.split('.').pop()?.toLowerCase() || 'bin';
  return `${userId}_${timestamp}_${randomBytes}.${extension}`;
}

// Get file type category
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('word') || mimeType.includes('excel') || mimeType === 'text/plain') return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  return 'file';
}

export const POST: RequestHandler = createSecureHandler(
  async ({ request, getClientAddress }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('attachment') as File;
      const conversationId = formData.get('conversationId') as string;

      if (!file) {
        return json({ error: 'No attachment file provided' }, { status: 400 });
      }

      if (!conversationId) {
        return json({ error: 'Conversation ID is required' }, { status: 400 });
      }

      // Validate file
      const validation = validateAttachmentFile(file);
      if (!validation.isValid) {
        return json({ error: validation.error }, { status: 400 });
      }

      // Generate secure filename
      const secureFileName = generateSecureFileName(file.name, auth.userId);
      const filePath = `message_attachments/${conversationId}/${secureFileName}`;

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
            conversationId,
            fileCategory: getFileCategory(file.type),
            validated: 'true'
          }
        }
      });

      // Get signed URL (valid for 7 days)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Log successful upload
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'message_attachment_uploaded',
        resource: 'message',
        resourceId: conversationId,
        timestamp: new Date(),
        success: true,
        details: {
          originalName: file.name,
          secureFileName,
          fileSize: file.size,
          fileType: file.type,
          fileCategory: getFileCategory(file.type),
          path: filePath
        }
      });

      return json({
        success: true,
        url: signedUrl,
        fileName: secureFileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileCategory: getFileCategory(file.type),
        filePath
      });

    } catch (error) {
      console.error('Error uploading message attachment:', error);

      // Log the error
      await auditLog.logSecurityEvent({
        type: 'file_upload_error',
        userId: auth.userId,
        ip: getClientAddress(),
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      return json({ 
        error: 'Failed to upload attachment. Please try again.' 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: 'api',
    validateCSRF: true
  }
);
