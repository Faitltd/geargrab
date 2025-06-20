import { browser } from '$app/environment';
import { firestore } from '$lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import type { Booking } from '$lib/types/firestore';

// Create a new booking
export async function createBooking(bookingData: any): Promise<string> {
  if (!browser) throw new Error('Booking functions can only be called in the browser');

  try {
    const bookingsRef = collection(firestore, 'bookings');

    // Filter out undefined values to avoid Firestore errors
    const cleanedData: any = {};
    for (const [key, value] of Object.entries(bookingData)) {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    const booking = {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(bookingsRef, booking);
    console.log('✅ Booking created:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw error;
  }
}

// Update booking with payment information
export async function updateBookingPayment(
  bookingId: string, 
  paymentData: {
    paymentIntentId: string;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    paidAt?: Date;
  }
): Promise<void> {
  if (!browser) throw new Error('Booking functions can only be called in the browser');
  
  try {
    const bookingRef = doc(firestore, 'bookings', bookingId);
    
    const updateData = {
      ...paymentData,
      updatedAt: serverTimestamp(),
      ...(paymentData.paidAt && { paidAt: Timestamp.fromDate(paymentData.paidAt) })
    };
    
    await updateDoc(bookingRef, updateData);
    console.log('✅ Booking payment updated:', bookingId);
  } catch (error) {
    console.error('❌ Error updating booking payment:', error);
    throw error;
  }
}

// Get booking by ID
export async function getBooking(bookingId: string): Promise<Booking | null> {
  if (!browser) throw new Error('Booking functions can only be called in the browser');
  
  try {
    const bookingRef = doc(firestore, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      const data = bookingSnap.data();
      return {
        id: bookingSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        paidAt: data.paidAt?.toDate()
      } as Booking;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting booking:', error);
    throw error;
  }
}

// Create booking with payment intent
export async function createBookingWithPayment(
  listingId: string,
  listingTitle: string,
  listingImage: string,
  ownerUid: string,
  renterUid: string,
  startDate: Date | string,
  endDate: Date | string,
  totalPrice: number,
  deliveryMethod: 'pickup' | 'delivery',
  deliveryDetails?: any
): Promise<{ bookingId: string; paymentMetadata: Record<string, string> }> {
  if (!browser) throw new Error('Booking functions can only be called in the browser');

  try {
    // Convert to Date objects if needed
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    // Create booking data (filter out undefined values)
    const bookingData: any = {
      listingId,
      listingTitle,
      listingImage,
      ownerUid,
      renterUid,
      startDate: Timestamp.fromDate(start),
      endDate: Timestamp.fromDate(end),
      status: 'pending',
      totalPrice,
      securityDeposit: 0, // Default security deposit
      paymentStatus: 'pending',
      deliveryMethod,
      cancellationPolicy: 'moderate'
    };

    // Only add deliveryDetails if it's not undefined
    if (deliveryDetails !== undefined && deliveryDetails !== null) {
      bookingData.deliveryDetails = deliveryDetails;
    }
    
    // Create the booking
    const bookingId = await createBooking(bookingData);
    
    // Create payment metadata
    const paymentMetadata = {
      bookingId,
      listingId,
      service: 'gear_rental',
      renterUid,
      ownerUid
    };
    
    console.log('✅ Booking created with payment setup:', { bookingId, paymentMetadata });
    
    return { bookingId, paymentMetadata };
  } catch (error) {
    console.error('❌ Error creating booking with payment:', error);
    throw error;
  }
}

// Calculate rental fees
export function calculateRentalFees(
  dailyPrice: number,
  startDate: Date | string,
  endDate: Date | string,
  deliveryMethod: 'pickup' | 'delivery' = 'pickup',
  deliveryFee: number = 0
): {
  days: number;
  rentalFee: number;
  serviceFee: number;
  deliveryFee: number;
  totalPrice: number;
} {
  // Convert to Date objects if needed
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // Calculate number of days
  const timeDiff = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  // Calculate fees
  const rentalFee = dailyPrice * days;
  const serviceFee = Math.round(rentalFee * 0.1); // 10% service fee
  const finalDeliveryFee = deliveryMethod === 'delivery' ? deliveryFee : 0;
  const totalPrice = rentalFee + serviceFee + finalDeliveryFee;
  
  return {
    days,
    rentalFee,
    serviceFee,
    deliveryFee: finalDeliveryFee,
    totalPrice
  };
}

// Validate booking dates
export function validateBookingDates(startDate: Date | string, endDate: Date | string): { valid: boolean; error?: string } {
  // Convert to Date objects if needed
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (startDay < today) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }

  // Allow same-day rentals (end date can be same as start date)
  if (endDay < startDay) {
    return { valid: false, error: 'End date cannot be before start date' };
  }

  const maxDays = 30; // Maximum rental period
  const timeDiff = endDay.getTime() - startDay.getTime();
  const days = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  if (days > maxDays) {
    return { valid: false, error: `Maximum rental period is ${maxDays} days` };
  }

  return { valid: true };
}
