import { adminFirestore } from '$lib/firebase/server';
import { paymentService } from './payment';
import { sendBookingEmails } from './email';
import type { Timestamp } from 'firebase-admin/firestore';

export interface BookingRequest {
  listingId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  deliveryMethod: 'pickup' | 'delivery';
  specialRequests?: string;
  insuranceTier: 'standard' | 'premium';
}

export interface BookingStatus {
  id: string;
  status: 'pending_payment' | 'pending_owner_approval' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  timeline: BookingTimelineEvent[];
}

export interface BookingTimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
  actor: 'system' | 'renter' | 'owner' | 'admin';
  actorName?: string;
}

class BookingManagementService {
  /**
   * Create a new booking request
   */
  async createBooking(request: BookingRequest): Promise<string> {
    try {
      // Get listing details
      const listingRef = adminFirestore.collection('listings').doc(request.listingId);
      const listingDoc = await listingRef.get();
      
      if (!listingDoc.exists) {
        throw new Error('Listing not found');
      }
      
      const listing = listingDoc.data();
      
      // Calculate pricing
      const days = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const pricing = paymentService.calculateBookingPricing(listing.dailyPrice, days);
      
      // Create booking document
      const bookingData = {
        listingId: request.listingId,
        listingTitle: listing.title,
        ownerId: listing.ownerUid,
        ownerEmail: listing.ownerEmail,
        renterId: request.renterId,
        
        // Dates
        startDate: request.startDate,
        endDate: request.endDate,
        days,
        
        // Pricing
        dailyPrice: listing.dailyPrice,
        basePrice: pricing.basePrice,
        serviceFee: pricing.serviceFee,
        totalPrice: pricing.totalPrice,
        securityDeposit: listing.securityDeposit || 100,
        
        // Details
        deliveryMethod: request.deliveryMethod,
        specialRequests: request.specialRequests || '',
        insuranceTier: request.insuranceTier,
        
        // Status
        status: 'pending_payment',
        paymentStatus: 'pending',
        
        // Payment tracking
        upfrontPaymentStatus: 'pending',
        rentalPaymentStatus: 'pending',
        securityDepositStatus: 'pending',
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Timeline
        timeline: [{
          timestamp: new Date(),
          event: 'booking_created',
          description: 'Booking request created',
          actor: 'renter'
        }]
      };
      
      const bookingRef = await adminFirestore.collection('bookings').add(bookingData);
      
      console.log(`✅ Booking created: ${bookingRef.id}`);
      return bookingRef.id;
      
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }
  
  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string, 
    newStatus: BookingStatus['status'], 
    actorId: string,
    actorType: 'renter' | 'owner' | 'admin' = 'renter',
    notes?: string
  ) {
    try {
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }
      
      const booking = bookingDoc.data();
      const timeline = booking.timeline || [];
      
      // Add timeline event
      timeline.push({
        timestamp: new Date(),
        event: `status_changed_to_${newStatus}`,
        description: notes || `Status changed to ${newStatus}`,
        actor: actorType,
        actorId
      });
      
      // Update booking
      await bookingRef.update({
        status: newStatus,
        updatedAt: new Date(),
        timeline
      });
      
      // Send appropriate notifications
      await this.sendStatusChangeNotifications(bookingId, newStatus);
      
      console.log(`✅ Booking ${bookingId} status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
  
  /**
   * Approve booking (owner action)
   */
  async approveBooking(bookingId: string, ownerId: string) {
    try {
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }
      
      const booking = bookingDoc.data();
      
      // Verify owner
      if (booking.ownerId !== ownerId) {
        throw new Error('Unauthorized - not the listing owner');
      }
      
      // Update status
      await this.updateBookingStatus(bookingId, 'confirmed', ownerId, 'owner', 'Booking approved by owner');
      
      // Send confirmation emails
      await sendBookingEmails(bookingId, 'booking_approved');
      
    } catch (error) {
      console.error('Error approving booking:', error);
      throw error;
    }
  }
  
  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, userId: string, reason: string, userType: 'renter' | 'owner' | 'admin') {
    try {
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }
      
      const booking = bookingDoc.data();
      
      // Verify authorization
      if (userType === 'renter' && booking.renterId !== userId) {
        throw new Error('Unauthorized - not your booking');
      }
      if (userType === 'owner' && booking.ownerId !== userId) {
        throw new Error('Unauthorized - not your listing');
      }
      
      // Process refunds if applicable
      await this.processBookingRefunds(bookingId, reason);
      
      // Update status
      await this.updateBookingStatus(bookingId, 'cancelled', userId, userType, `Cancelled: ${reason}`);
      
      // Send cancellation emails
      await sendBookingEmails(bookingId, 'booking_cancelled');
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }
  
  /**
   * Mark booking as completed
   */
  async completeBooking(bookingId: string, userId: string) {
    try {
      await this.updateBookingStatus(bookingId, 'completed', userId, 'renter', 'Booking completed');
      
      // Release security deposit after 48 hours (in real implementation, use a scheduled function)
      setTimeout(async () => {
        try {
          await paymentService.releaseSecurityDeposit(bookingId);
        } catch (error) {
          console.error('Error releasing security deposit:', error);
        }
      }, 48 * 60 * 60 * 1000); // 48 hours
      
      // Send completion emails
      await sendBookingEmails(bookingId, 'booking_completed');
      
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  }
  
  /**
   * Get booking details with status
   */
  async getBookingStatus(bookingId: string): Promise<BookingStatus> {
    try {
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        throw new Error('Booking not found');
      }
      
      const booking = bookingDoc.data();
      
      return {
        id: bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        timeline: booking.timeline || []
      };
      
    } catch (error) {
      console.error('Error getting booking status:', error);
      throw error;
    }
  }
  
  /**
   * Process refunds for cancelled booking
   */
  private async processBookingRefunds(bookingId: string, reason: string) {
    try {
      const bookingRef = adminFirestore.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (!bookingDoc.exists) {
        return;
      }
      
      const booking = bookingDoc.data();
      
      // Refund upfront payment if paid
      if (booking.upfrontPaymentId && booking.upfrontPaymentStatus === 'paid') {
        await paymentService.refundPayment(booking.upfrontPaymentId, undefined, reason);
      }
      
      // Refund rental payment if paid
      if (booking.rentalPaymentId && booking.rentalPaymentStatus === 'paid') {
        await paymentService.refundPayment(booking.rentalPaymentId, undefined, reason);
      }
      
      // Release security deposit if held
      if (booking.securityDepositPaymentId && booking.securityDepositStatus === 'held') {
        await paymentService.releaseSecurityDeposit(bookingId);
      }
      
    } catch (error) {
      console.error('Error processing refunds:', error);
    }
  }
  
  /**
   * Send status change notifications
   */
  private async sendStatusChangeNotifications(bookingId: string, status: string) {
    try {
      const emailType = this.getEmailTypeForStatus(status);
      if (emailType) {
        await sendBookingEmails(bookingId, emailType);
      }
    } catch (error) {
      console.error('Error sending status change notifications:', error);
    }
  }
  
  /**
   * Get email type for status
   */
  private getEmailTypeForStatus(status: string): string | null {
    const statusEmailMap: Record<string, string> = {
      'confirmed': 'booking_confirmed',
      'active': 'booking_started',
      'completed': 'booking_completed',
      'cancelled': 'booking_cancelled',
      'disputed': 'booking_disputed'
    };
    
    return statusEmailMap[status] || null;
  }
}

export const bookingManagementService = new BookingManagementService();
