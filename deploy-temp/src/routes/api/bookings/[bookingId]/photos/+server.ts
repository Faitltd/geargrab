import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSecureHandler } from '$lib/security/middleware';
import { adminStorage, adminFirestore } from '$lib/firebase/server';
import { auditLog } from '$lib/security/audit';
import crypto from 'crypto';
import type { RentalPhoto } from '$lib/types/firestore';

// Validate file for rental photo upload
function validateRentalPhoto(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  // Check file size (10MB max for rental photos)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  // Check filename
  if (file.name.length > 255) {
    return { isValid: false, error: 'Filename too long' };
  }

  return { isValid: true };
}

// Generate secure filename for rental photos
function generateSecureFileName(originalName: string, userId: string, photoType: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${photoType}_${userId}_${timestamp}_${randomBytes}.${extension}`;
}

// Upload rental photo
export const POST: RequestHandler = createSecureHandler(
  async ({ request, params, getClientAddress }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      // Get booking to verify user access
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookingDoc.data();
      if (!booking) {
        return json({ error: 'Invalid booking data' }, { status: 400 });
      }

      // Check if user is involved in the booking
      if (booking.ownerUid !== auth.userId && booking.renterUid !== auth.userId) {
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
      }

      // Parse form data
      const formData = await request.formData();
      const file = formData.get('photo') as File;
      const photoType = formData.get('photoType') as string;
      const rentalPhase = formData.get('rentalPhase') as string; // 'pre' or 'post'
      const description = formData.get('description') as string;

      if (!file) {
        return json({ error: 'Photo file is required' }, { status: 400 });
      }

      if (!photoType || !['condition', 'damage', 'general', 'serial_number', 'accessories'].includes(photoType)) {
        return json({ error: 'Valid photo type is required' }, { status: 400 });
      }

      if (!rentalPhase || !['pre', 'post'].includes(rentalPhase)) {
        return json({ error: 'Valid rental phase is required (pre or post)' }, { status: 400 });
      }

      // Validate file
      const validation = validateRentalPhoto(file);
      if (!validation.isValid) {
        return json({ error: validation.error }, { status: 400 });
      }

      // Generate secure filename
      const secureFileName = generateSecureFileName(file.name, auth.userId, photoType);
      const filePath = `rental_photos/${bookingId}/${rentalPhase}/${auth.userId}/${secureFileName}`;

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
            bookingId,
            photoType,
            rentalPhase,
            description: description || '',
            validated: 'true'
          }
        }
      });

      // Get signed URL (valid for 5 years for insurance purposes)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 5 * 365 * 24 * 60 * 60 * 1000 // 5 years
      });

      // Create rental photo record
      const rentalPhoto: Omit<RentalPhoto, 'id'> = {
        url: signedUrl,
        fileName: secureFileName,
        uploadedBy: auth.userId,
        uploadedAt: adminFirestore.Timestamp.now(),
        photoType: photoType as any,
        description: description || undefined,
        metadata: {
          location: filePath,
          timestamp: new Date().toISOString(),
          deviceInfo: request.headers.get('User-Agent') || 'unknown'
        }
      };

      // Add photo to booking document
      const userRole = booking.ownerUid === auth.userId ? 'owner' : 'renter';
      const photoField = `photoDocumentation.${rentalPhase}Rental.${userRole}Photos`;

      // Initialize photoDocumentation structure if it doesn't exist
      const updateData: any = {
        [photoField]: adminFirestore.FieldValue.arrayUnion(rentalPhoto),
        updatedAt: adminFirestore.Timestamp.now()
      };

      // Ensure the nested structure exists
      if (!booking.photoDocumentation) {
        updateData.photoDocumentation = {
          preRental: { ownerPhotos: [], renterPhotos: [], ownerConfirmed: false, renterConfirmed: false },
          postRental: { ownerPhotos: [], renterPhotos: [], ownerConfirmed: false, renterConfirmed: false }
        };
      }

      await adminFirestore.collection('bookings').doc(bookingId).update(updateData);

      // Log successful upload
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'rental_photo_uploaded',
        resource: 'booking',
        resourceId: bookingId,
        timestamp: new Date(),
        success: true,
        details: {
          originalName: file.name,
          secureFileName,
          fileSize: file.size,
          fileType: file.type,
          photoType,
          rentalPhase,
          path: filePath,
          userRole
        }
      });

      return json({
        success: true,
        photo: {
          ...rentalPhoto,
          id: secureFileName
        },
        message: 'Rental photo uploaded successfully'
      });

    } catch (error) {
      console.error('Error uploading rental photo:', error);
      
      await auditLog.logUserActivity({
        userId: auth.userId,
        action: 'rental_photo_upload_failed',
        resource: 'booking',
        resourceId: bookingId,
        timestamp: new Date(),
        success: false,
        details: {
          error: error.message,
          stack: error.stack
        }
      });

      return json({ 
        error: 'Failed to upload rental photo',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50 // 50 photo uploads per 15 minutes
    }
  }
);

// Get rental photos for a booking
export const GET: RequestHandler = createSecureHandler(
  async ({ params }, { auth }) => {
    if (!auth) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.bookingId;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    try {
      // Get booking to verify user access
      const bookingDoc = await adminFirestore.collection('bookings').doc(bookingId).get();
      if (!bookingDoc.exists) {
        return json({ error: 'Booking not found' }, { status: 404 });
      }

      const booking = bookingDoc.data();
      if (!booking) {
        return json({ error: 'Invalid booking data' }, { status: 400 });
      }

      // Check if user is involved in the booking
      if (booking.ownerUid !== auth.userId && booking.renterUid !== auth.userId) {
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
      }

      // Return photo documentation
      return json({
        success: true,
        photoDocumentation: booking.photoDocumentation || {
          preRental: { ownerPhotos: [], renterPhotos: [] },
          postRental: { ownerPhotos: [], renterPhotos: [] }
        },
        userRole: booking.ownerUid === auth.userId ? 'owner' : 'renter'
      });

    } catch (error) {
      console.error('Error fetching rental photos:', error);
      return json({ 
        error: 'Failed to fetch rental photos',
        details: error.message 
      }, { status: 500 });
    }
  },
  {
    requireAuth: true
  }
);
