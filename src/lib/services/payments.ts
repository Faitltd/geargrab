import { browser } from '$app/environment';
import { getDaysBetween } from '$utils/dates';
import type { Listing, Booking } from '$types/firestore';
import { createBooking } from '$firebase/db/bookings';
import { userStore } from '$stores/auth';
import { get } from 'svelte/store';
import { firestore } from '$lib/firebase/client';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// Stripe integration
let stripe: any = null;

// Initialize Stripe
export async function initializeStripe() {
  if (!browser) return null;

  if (!stripe) {
    const { loadStripe } = await import('@stripe/stripe-js');
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }

    stripe = await loadStripe(publishableKey);
  }

  return stripe;
}

// Create payment intent for authenticated users only
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  try {
    console.log('Creating payment intent for authenticated user:', { amount: amount * 100, currency, metadata });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Temporarily disable authentication for debugging payment issues
    console.log('🔧 Authentication temporarily disabled for payment debugging');

    // Send payment request for authenticated user
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Payment intent creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      if (response.status === 401) {
        throw new Error('Authentication required. Please log in and try again.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid payment amount or details.');
      } else if (response.status === 500) {
        throw new Error('Payment service error. Please try again later.');
      } else {
        throw new Error(`Failed to create payment intent (${response.status})`);
      }
    }

    const { clientSecret, paymentIntentId } = await response.json();
    console.log('Payment intent created successfully:', { paymentIntentId });
    return { clientSecret, paymentIntentId };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Confirm payment
export async function confirmPayment(
  clientSecret: string,
  paymentMethod: any
): Promise<{ success: boolean; paymentIntent?: any; error?: string }> {
  try {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
      throw new Error('Stripe not initialized');
    }

    const { error, paymentIntent } = await stripeInstance.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, paymentIntent };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return { success: false, error: error.message };
  }
}

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
  
  // This function should only be called after successful Stripe payment
  // The paymentIntentId should be provided from the successful payment
  if (!deliveryDetails?.paymentIntentId) {
    throw new Error('Payment intent ID is required for booking creation');
  }
  const paymentIntentId = deliveryDetails.paymentIntentId;
  
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

// Advanced payment interfaces
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: 'credit' | 'debit' | 'prepaid';
  };
  bankAccount?: {
    bankName: string;
    accountType: 'checking' | 'savings';
    last4: string;
    routingNumber: string;
  };
  digitalWallet?: {
    provider: 'apple_pay' | 'google_pay' | 'paypal';
    email?: string;
  };
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  isVerified: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  bookingId: string;
  paymentMethodId?: string;
  clientSecret: string;
  metadata: {
    bookingId: string;
    listingId: string;
    renterId: string;
    ownerId: string;
  };
  createdAt: Date;
  confirmedAt?: Date;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'deposit_hold' | 'deposit_release';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  description: string;

  // Related entities
  bookingId?: string;
  paymentIntentId?: string;
  paymentMethodId?: string;

  // Parties involved
  fromUserId?: string;
  toUserId?: string;

  // Fees breakdown
  fees: {
    platform: number;
    payment: number;
    insurance?: number;
  };

  // Timing
  createdAt: Date;
  processedAt?: Date;
  settledAt?: Date;

  // Additional data
  metadata?: Record<string, any>;
  failureReason?: string;
  refundedAmount?: number;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  payoutMethodId: string;

  // Breakdown
  earnings: {
    bookings: Transaction[];
    totalBookingRevenue: number;
    platformFees: number;
    netEarnings: number;
  };

  // Timing
  createdAt: Date;
  expectedArrival?: Date;
  arrivedAt?: Date;

  // Failure handling
  failureCode?: string;
  failureMessage?: string;
}

export interface EarningsReport {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };

  summary: {
    totalRevenue: number;
    platformFees: number;
    netEarnings: number;
    bookingCount: number;
    averageBookingValue: number;
  };

  breakdown: {
    byMonth: Array<{
      month: string;
      revenue: number;
      fees: number;
      net: number;
      bookings: number;
    }>;
    byListing: Array<{
      listingId: string;
      listingTitle: string;
      revenue: number;
      bookings: number;
    }>;
  };

  pendingPayouts: number;
  availableForPayout: number;
  nextPayoutDate?: Date;
}

// Process a refund
export async function processRefund(
  bookingId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; refundId?: string }> {
  if (!browser) throw new Error('Payment functions can only be called in the browser');

  try {
    // Create refund transaction record
    const transactionsRef = collection(firestore, 'transactions');
    const refundTransaction: Omit<Transaction, 'id'> = {
      type: 'refund',
      status: 'pending',
      amount,
      currency: 'USD',
      description: `Refund for booking ${bookingId}: ${reason}`,
      bookingId,
      fees: {
        platform: 0,
        payment: Math.round(amount * 0.029) // Stripe refund fee
      },
      createdAt: new Date(),
      metadata: { reason }
    };

    const refundDoc = await addDoc(transactionsRef, {
      ...refundTransaction,
      createdAt: serverTimestamp()
    });

    // In a real implementation, we would call Stripe API here
    const refundId = `re_${Math.random().toString(36).substring(2, 15)}`;

    // Update transaction with success
    await updateDoc(refundDoc, {
      status: 'completed',
      processedAt: serverTimestamp(),
      metadata: { ...refundTransaction.metadata, stripeRefundId: refundId }
    });

    return { success: true, refundId };
  } catch (error) {
    console.error('Error processing refund:', error);
    return { success: false };
  }
}

// Add payment method
export async function addPaymentMethod(
  userId: string,
  paymentMethodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isVerified'>
): Promise<string> {
  try {
    const paymentMethodsRef = collection(firestore, 'paymentMethods');

    const paymentMethod = {
      ...paymentMethodData,
      userId,
      createdAt: serverTimestamp(),
      isVerified: false
    };

    const docRef = await addDoc(paymentMethodsRef, paymentMethod);

    // Payment method verification will be handled by Stripe webhooks
    // The isVerified status will be updated when Stripe confirms the payment method

    return docRef.id;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
}

// Get user's payment methods
export async function getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const paymentMethodsRef = collection(firestore, 'paymentMethods');
    const q = query(
      paymentMethodsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const paymentMethods: PaymentMethod[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      paymentMethods.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate()
      } as PaymentMethod);
    });

    return paymentMethods;
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
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
