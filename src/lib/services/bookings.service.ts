/**
 * Bookings Service
 * Handles all booking-related operations with Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import { listingsService } from './listings.service';
import { getUserProfile } from './users.service';
import { createReviewRequest } from './reviews.service';
import type {
  Booking,
  BookingRequest,
  BookingFilters,
  AvailabilityCheck,
  BookingPricing,
  BookingTimelineEvent,
  BookingStatus
} from '$lib/types/bookings';

export class BookingsService {
  private readonly COLLECTION = 'bookings';

  /**
   * Create a new booking request
   */
  async createBooking(bookingData: BookingRequest): Promise<string> {
    try {
      // Get listing and user details
      const listing = await listingsService.getListing(bookingData.listingId);
      const renter = await getUserProfile(bookingData.renterId);
      const owner = await getUserProfile(bookingData.ownerId);

      if (!listing || !renter || !owner) {
        throw new Error('Invalid listing or user data');
      }

      // Create initial timeline event
      const timeline: BookingTimelineEvent[] = [{
        id: 'created',
        type: 'created',
        title: 'Booking Request Created',
        description: `${renter.displayName} requested to rent ${listing.title}`,
        timestamp: new Date(),
        actor: {
          id: renter.uid,
          name: renter.displayName,
          role: 'renter'
        }
      }];

      const booking: Omit<Booking, 'id'> = {
        listingId: bookingData.listingId,
        listing: {
          id: listing.id!,
          title: listing.title,
          images: listing.images || [],
          category: listing.category,
          owner: {
            id: owner.uid,
            name: owner.displayName,
            photoURL: owner.photoURL
          }
        },
        renterId: bookingData.renterId,
        renter: {
          id: renter.uid,
          name: renter.displayName,
          photoURL: renter.photoURL,
          email: renter.email,
          phone: renter.phoneNumber
        },
        ownerId: bookingData.ownerId,
        owner: {
          id: owner.uid,
          name: owner.displayName,
          photoURL: owner.photoURL,
          email: owner.email,
          phone: owner.phoneNumber
        },
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalDays: bookingData.totalDays,
        status: 'pending',
        pricing: bookingData.pricing,
        pickupMethod: bookingData.pickupMethod,
        pickupLocation: bookingData.pickupLocation,
        deliveryAddress: bookingData.deliveryAddress,
        insurance: bookingData.insurance,
        message: bookingData.message,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startDate: Timestamp.fromDate(booking.startDate),
        endDate: Timestamp.fromDate(booking.endDate)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          confirmedAt: data.confirmedAt?.toDate(),
          cancelledAt: data.cancelledAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        } as Booking;
      }

      return null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw new Error('Failed to fetch booking');
    }
  }

  /**
   * Get bookings with filters
   */
  async getBookings(filters: BookingFilters = {}): Promise<{
    bookings: Booking[];
    hasMore: boolean;
  }> {
    try {
      let q = collection(db, this.COLLECTION);
      const constraints: any[] = [];

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters.renterId) {
        constraints.push(where('renterId', '==', filters.renterId));
      }

      if (filters.ownerId) {
        constraints.push(where('ownerId', '==', filters.ownerId));
      }

      if (filters.listingId) {
        constraints.push(where('listingId', '==', filters.listingId));
      }

      // Default ordering by creation date
      constraints.push(orderBy('createdAt', 'desc'));

      // Apply pagination
      constraints.push(limit(filters.limit || 20));

      const queryRef = query(q, ...constraints);
      const snapshot = await getDocs(queryRef);

      const bookings: Booking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          confirmedAt: data.confirmedAt?.toDate(),
          cancelledAt: data.cancelledAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        } as Booking);
      });

      const hasMore = snapshot.docs.length === (filters.limit || 20);

      return { bookings, hasMore };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    actorId: string,
    message?: string
  ): Promise<void> {
    try {
      const booking = await this.getBooking(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const actor = booking.renterId === actorId ? booking.renter! : booking.owner!;
      const role = booking.renterId === actorId ? 'renter' : 'owner';

      // Create timeline event
      const timelineEvent: BookingTimelineEvent = {
        id: `${status}_${Date.now()}`,
        type: status === 'confirmed' ? 'confirmed' : 
              status === 'cancelled' ? 'cancelled' : 'message',
        title: this.getStatusUpdateTitle(status, role),
        description: message,
        timestamp: new Date(),
        actor: {
          id: actorId,
          name: actor.name,
          role
        }
      };

      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        timeline: [...booking.timeline, timelineEvent]
      };

      // Add status-specific timestamps
      if (status === 'confirmed') {
        updateData.confirmedAt = serverTimestamp();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      } else if (status === 'completed') {
        updateData.completedAt = serverTimestamp();

        // Trigger post-completion logic
        this.handleBookingCompletion(booking, actorId);
      }

      // Add messages
      if (message) {
        if (role === 'renter') {
          updateData.renterMessage = message;
        } else {
          updateData.ownerMessage = message;
        }
      }

      const docRef = doc(db, this.COLLECTION, bookingId);
      await updateDoc(docRef, updateData);

    } catch (error) {
      console.error('Error updating booking status:', error);
      throw new Error('Failed to update booking status');
    }
  }

  /**
   * Check availability for a listing
   */
  async checkAvailability(
    listingId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AvailabilityCheck> {
    try {
      // Get all bookings for this listing that overlap with the requested dates
      const q = query(
        collection(db, this.COLLECTION),
        where('listingId', '==', listingId),
        where('status', 'in', ['confirmed', 'paid', 'active'])
      );

      const snapshot = await getDocs(q);
      const conflictingBookings: string[] = [];

      snapshot.forEach((doc) => {
        const booking = doc.data();
        const bookingStart = booking.startDate.toDate();
        const bookingEnd = booking.endDate.toDate();

        // Check for date overlap
        if (
          (startDate >= bookingStart && startDate < bookingEnd) ||
          (endDate > bookingStart && endDate <= bookingEnd) ||
          (startDate <= bookingStart && endDate >= bookingEnd)
        ) {
          conflictingBookings.push(doc.id);
        }
      });

      return {
        listingId,
        startDate,
        endDate,
        available: conflictingBookings.length === 0,
        conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined
      };

    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Calculate booking pricing
   */
  calculatePricing(
    dailyRate: number, 
    totalDays: number, 
    insurance: boolean = false,
    deliveryFee: number = 0
  ): BookingPricing {
    const subtotal = dailyRate * totalDays;
    const insuranceFee = insurance ? Math.max(subtotal * 0.1, 5) : 0; // 10% or $5 minimum
    const serviceFee = Math.max(subtotal * 0.05, 2); // 5% or $2 minimum
    
    const total = subtotal + insuranceFee + serviceFee + deliveryFee;

    const breakdown = [
      {
        label: `$${dailyRate}/day × ${totalDays} day${totalDays > 1 ? 's' : ''}`,
        amount: subtotal,
        type: 'charge' as const,
        description: 'Base rental cost'
      },
      {
        label: 'Service fee',
        amount: serviceFee,
        type: 'fee' as const,
        description: 'Platform service fee'
      }
    ];

    if (insurance) {
      breakdown.push({
        label: 'Damage protection',
        amount: insuranceFee,
        type: 'fee' as const,
        description: 'Optional damage protection'
      });
    }

    if (deliveryFee > 0) {
      breakdown.push({
        label: 'Delivery fee',
        amount: deliveryFee,
        type: 'fee' as const,
        description: 'Delivery to your location'
      });
    }

    return {
      dailyRate,
      totalDays,
      subtotal,
      insurance: insurance ? insuranceFee : undefined,
      serviceFee,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      total,
      breakdown
    };
  }

  /**
   * Handle post-completion logic (review requests, notifications, etc.)
   */
  private async handleBookingCompletion(booking: Booking, actorId: string): Promise<void> {
    try {
      // Create review requests for both parties
      await this.createPostCompletionReviewRequests(booking);

      // TODO: Send completion notifications
      // TODO: Update user statistics
      // TODO: Handle any other post-completion logic

    } catch (error) {
      console.error('Error handling booking completion:', error);
      // Don't throw error to avoid blocking the main completion flow
    }
  }

  /**
   * Create review requests after booking completion
   */
  private async createPostCompletionReviewRequests(booking: Booking): Promise<void> {
    try {
      const listing = await listingsService.getById(booking.listingId);
      if (!listing) {
        console.error('Listing not found for review request creation:', booking.listingId);
        return;
      }

      // Create review request for renter to review the gear/owner
      await createReviewRequest(
        booking.id!,
        undefined, // rentalId - we don't have this in the booking object
        booking.listingId,
        booking.listing?.title || listing.title,
        listing.images?.[0],
        booking.renterId,
        booking.renter?.name || 'Renter',
        booking.ownerId,
        booking.owner?.name || 'Owner',
        booking.owner?.avatar,
        'listing' // Review type for gear
      );

      // Create review request for owner to review the renter
      await createReviewRequest(
        booking.id!,
        undefined, // rentalId
        booking.listingId,
        booking.listing?.title || listing.title,
        listing.images?.[0],
        booking.ownerId,
        booking.owner?.name || 'Owner',
        booking.renterId,
        booking.renter?.name || 'Renter',
        booking.renter?.avatar,
        'renter' // Review type for renter
      );

      console.log(`Review requests created for completed booking: ${booking.id}`);

    } catch (error) {
      console.error('Error creating review requests:', error);
    }
  }

  /**
   * Get status update title for timeline
   */
  private getStatusUpdateTitle(status: BookingStatus, role: 'renter' | 'owner'): string {
    const titles: Record<BookingStatus, Record<string, string>> = {
      pending: { renter: 'Booking Requested', owner: 'Booking Requested' },
      confirmed: { renter: 'Booking Confirmed', owner: 'Booking Confirmed' },
      paid: { renter: 'Payment Completed', owner: 'Payment Received' },
      active: { renter: 'Rental Started', owner: 'Rental Started' },
      completed: { renter: 'Rental Completed', owner: 'Rental Completed' },
      cancelled: { renter: 'Booking Cancelled', owner: 'Booking Cancelled' },
      declined: { renter: 'Booking Declined', owner: 'Booking Declined' }
    };

    return titles[status]?.[role] || 'Status Updated';
  }
}

// Export singleton instance
export const bookingsService = new BookingsService();
