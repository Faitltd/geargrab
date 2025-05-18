import { browser } from '$app/environment';
import { getDaysBetween } from '$utils/dates';
import type { Listing, Booking } from '$types/firestore';
import { createBooking } from '$firebase/db/bookings';
import { userStore } from '$stores/auth';
import { get } from 'svelte/store';

// Calculate booking fees
export function calculateBookingFees(
  listing: Listing,
  startDate: Date,
  endDate: Date,
  deliveryMethod: 'pickup' | 'dropoff' | 'shipping',
  insuranceTier?: 'basic' | 'standard' | 'premium' | 'none'
): {
  days: number;
  rentalFee: number;
  serviceFee: number;
  deliveryFee: number;
  insuranceFee: number;
  securityDeposit: number;
  totalPrice: number;
} {
  // Calculate number of days
  const days = getDaysBetween(startDate, endDate);
  
  // Calculate rental fee
  const rentalFee = listing.dailyPrice * days;
  
  // Calculate service fee (10% of rental fee)
  const serviceFee = Math.round(rentalFee * 0.1);
  
  // Calculate delivery fee
  let deliveryFee = 0;
  if (deliveryMethod === 'dropoff' && listing.deliveryOptions.dropoffDistance) {
    deliveryFee = 5; // Base fee
  } else if (deliveryMethod === 'shipping' && listing.deliveryOptions.shippingFee) {
    deliveryFee = listing.deliveryOptions.shippingFee;
  }
  
  // Calculate insurance fee
  let insuranceFee = 0;
  if (insuranceTier === 'basic') {
    insuranceFee = 5;
  } else if (insuranceTier === 'standard') {
    insuranceFee = 10;
  } else if (insuranceTier === 'premium') {
    insuranceFee = 15;
  }
  
  // Get security deposit
  const securityDeposit = listing.securityDeposit;
  
  // Calculate total price
  const totalPrice = rentalFee + serviceFee + deliveryFee + insuranceFee;
  
  return {
    days,
    rentalFee,
    serviceFee,
    deliveryFee,
    insuranceFee,
    securityDeposit,
    totalPrice
  };
}

// Create a booking with payment
export async function createBookingWithPayment(
  listing: Listing,
  startDate: Date,
  endDate: Date,
  deliveryMethod: 'pickup' | 'dropoff' | 'shipping',
  insuranceTier?: 'basic' | 'standard' | 'premium' | 'none',
  deliveryDetails?: {
    address?: string;
    instructions?: string;
  }
): Promise<{ bookingId: string }> {
  if (!browser) throw new Error('Payment functions can only be called in the browser');
  
  // Get current user
  const { authUser } = get(userStore);
  if (!authUser) throw new Error('User must be logged in to create a booking');
  
  // Calculate fees
  const fees = calculateBookingFees(listing, startDate, endDate, deliveryMethod, insuranceTier);
  
  // In a real implementation, we would create a payment intent with Stripe here
  // For now, we'll simulate a successful payment
  const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
  
  // Create the booking in Firestore
  const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
    listingId: listing.id,
    listingTitle: listing.title,
    listingImage: listing.images[0] || '',
    ownerUid: listing.ownerUid,
    renterUid: authUser.uid,
    startDate: startDate as any, // Will be converted to Timestamp
    endDate: endDate as any, // Will be converted to Timestamp
    status: 'pending',
    totalPrice: fees.totalPrice,
    securityDeposit: fees.securityDeposit,
    paymentStatus: 'paid',
    paymentIntentId,
    deliveryMethod,
    deliveryDetails,
    insuranceTier,
    insuranceCost: fees.insuranceFee,
    cancellationPolicy: 'moderate' // Default policy
  };
  
  // Create the booking
  const bookingId = await createBooking(bookingData);
  
  return { bookingId };
}

// Process a refund
export async function processRefund(
  bookingId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; refundId?: string }> {
  if (!browser) throw new Error('Payment functions can only be called in the browser');
  
  // In a real implementation, we would call a server endpoint to process the refund
  // For now, we'll simulate a successful refund
  const refundId = `re_${Math.random().toString(36).substring(2, 15)}`;
  
  // Update the booking status in Firestore would happen here
  
  return { success: true, refundId };
}

// Calculate owner payout amount
export function calculateOwnerPayout(booking: Booking): number {
  // Owner gets 85% of the rental fee (excluding service fee, insurance, etc.)
  const days = getDaysBetween(
    booking.startDate.toDate ? booking.startDate.toDate() : new Date(booking.startDate),
    booking.endDate.toDate ? booking.endDate.toDate() : new Date(booking.endDate)
  );
  
  const rentalFee = booking.totalPrice - (booking.insuranceCost || 0);
  return Math.round(rentalFee * 0.85);
}
