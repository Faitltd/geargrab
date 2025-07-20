import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import type { ListingData } from './listings';

// Booking data interface
export interface BookingData {
  id?: string;
  listingId: string;
  listingTitle: string;
  ownerId: string;
  renterId: string;
  renterEmail: string;
  dates: string[];
  startDate: string;
  endDate: string;
  deliveryOption: 'pickup' | 'delivery';
  insuranceOption: boolean;
  totalCost: number;
  breakdown: {
    basePrice: number;
    days: number;
    subtotal: number;
    deliveryFee: number;
    insuranceFee: number;
    taxAmount: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: any;
  updatedAt: any;
}

// Date overlap detection result
export interface DateOverlapResult {
  hasOverlap: boolean;
  conflictingBookings: BookingData[];
  conflictingDates: string[];
}

// Utility function to check if two date ranges overlap
export const datesOverlap = (dates1: string[], dates2: string[]): boolean => {
  const set1 = new Set(dates1);
  return dates2.some(date => set1.has(date));
};

// Get conflicting dates between two date arrays
export const getConflictingDates = (dates1: string[], dates2: string[]): string[] => {
  const set1 = new Set(dates1);
  return dates2.filter(date => set1.has(date));
};

// Check for date overlaps with existing bookings
export const checkDateOverlap = async (
  listingId: string,
  requestedDates: string[],
  excludeBookingId?: string
): Promise<DateOverlapResult> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Query for active bookings for this listing
    let q = query(
      collection(db, 'bookings'),
      where('listingId', '==', listingId),
      where('status', 'in', ['pending', 'confirmed']),
      orderBy('startDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const existingBookings: BookingData[] = [];
    
    querySnapshot.forEach((doc) => {
      const booking = {
        id: doc.id,
        ...doc.data()
      } as BookingData;
      
      // Exclude the current booking if specified (for updates)
      if (excludeBookingId && booking.id === excludeBookingId) {
        return;
      }
      
      existingBookings.push(booking);
    });

    // Check for overlaps
    const conflictingBookings: BookingData[] = [];
    const allConflictingDates: string[] = [];

    for (const booking of existingBookings) {
      if (datesOverlap(requestedDates, booking.dates)) {
        conflictingBookings.push(booking);
        const conflictDates = getConflictingDates(requestedDates, booking.dates);
        allConflictingDates.push(...conflictDates);
      }
    }

    // Remove duplicates from conflicting dates
    const uniqueConflictingDates = [...new Set(allConflictingDates)];

    return {
      hasOverlap: conflictingBookings.length > 0,
      conflictingBookings,
      conflictingDates: uniqueConflictingDates
    };

  } catch (error) {
    console.error('Error checking date overlap:', error);
    throw new Error('Failed to check date availability');
  }
};

// Create a new booking
export const createBooking = async (bookingData: Omit<BookingData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // First check for date conflicts
    const overlapResult = await checkDateOverlap(bookingData.listingId, bookingData.dates);
    
    if (overlapResult.hasOverlap) {
      throw new Error(`Selected dates conflict with existing bookings: ${overlapResult.conflictingDates.join(', ')}`);
    }

    // Create the booking
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return bookingRef.id;

  } catch (error) {
    console.error('Error creating booking:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create booking');
  }
};

// Get a single booking by ID
export const getBooking = async (bookingId: string): Promise<BookingData | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (bookingSnap.exists()) {
      return {
        id: bookingSnap.id,
        ...bookingSnap.data()
      } as BookingData;
    }

    return null;

  } catch (error) {
    console.error('Error getting booking:', error);
    throw new Error('Failed to get booking');
  }
};

// Get bookings for a user (as renter or owner)
export const getUserBookings = async (userId: string, role: 'renter' | 'owner' = 'renter'): Promise<BookingData[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const fieldName = role === 'renter' ? 'renterId' : 'ownerId';
    const q = query(
      collection(db, 'bookings'),
      where(fieldName, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings: BookingData[] = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      } as BookingData);
    });

    return bookings;

  } catch (error) {
    console.error('Error getting user bookings:', error);
    throw new Error('Failed to get user bookings');
  }
};

// Get bookings for a specific listing
export const getListingBookings = async (listingId: string): Promise<BookingData[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'bookings'),
      where('listingId', '==', listingId),
      orderBy('startDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const bookings: BookingData[] = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      } as BookingData);
    });

    return bookings;

  } catch (error) {
    console.error('Error getting listing bookings:', error);
    throw new Error('Failed to get listing bookings');
  }
};

// Update booking status
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingData['status'],
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // First verify the user has permission to update this booking
    const booking = await getBooking(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Only the renter or owner can update the booking
    if (booking.renterId !== userId && booking.ownerId !== userId) {
      throw new Error('You do not have permission to update this booking');
    }

    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status,
      updatedAt: serverTimestamp()
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update booking status');
  }
};

// Cancel a booking
export const cancelBooking = async (bookingId: string, userId: string): Promise<void> => {
  await updateBookingStatus(bookingId, 'cancelled', userId);
};

// Confirm a booking (owner action)
export const confirmBooking = async (bookingId: string, ownerId: string): Promise<void> => {
  await updateBookingStatus(bookingId, 'confirmed', ownerId);
};
