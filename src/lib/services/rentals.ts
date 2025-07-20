import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import { db } from '$lib/firebase';

// Rental data interface
export interface RentalData {
  id?: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string;
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
  status: 'confirmed' | 'active' | 'completed' | 'cancelled' | 'returned';
  paymentIntentId: string;
  checkoutSessionId: string;
  verification?: {
    beforePhotos: {
      required: boolean;
      completed: boolean;
      completedAt?: any;
      conditionCheckId?: string;
    };
    afterPhotos: {
      required: boolean;
      completed: boolean;
      completedAt?: any;
      conditionCheckId?: string;
    };
  };
  createdAt: any;
  updatedAt: any;
}

// Next action interface
export interface NextAction {
  type: 'verification_before' | 'verification_after' | 'pickup' | 'return' | 'review' | 'none';
  label: string;
  description: string;
  url?: string;
  urgent: boolean;
  dueDate?: Date;
}

/**
 * Get rentals for a specific renter
 */
export const getRenterRentals = async (renterId: string): Promise<RentalData[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'rentals'),
      where('renterId', '==', renterId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const rentals: RentalData[] = [];

    querySnapshot.forEach((doc) => {
      rentals.push({
        id: doc.id,
        ...doc.data()
      } as RentalData);
    });

    // Enrich with listing images
    for (const rental of rentals) {
      try {
        const listingDoc = await getDoc(doc(db, 'listings', rental.listingId));
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          rental.listingImageUrl = listingData.imageUrls?.[0] || '';
        }
      } catch (error) {
        console.warn(`Failed to load listing image for rental ${rental.id}:`, error);
      }
    }

    return rentals;
  } catch (error) {
    console.error('Error getting renter rentals:', error);
    throw new Error('Failed to get renter rentals');
  }
};

/**
 * Get a specific rental by ID
 */
export const getRental = async (rentalId: string): Promise<RentalData | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const rentalDoc = await getDoc(doc(db, 'rentals', rentalId));
    
    if (rentalDoc.exists()) {
      const rental = {
        id: rentalDoc.id,
        ...rentalDoc.data()
      } as RentalData;

      // Enrich with listing image
      try {
        const listingDoc = await getDoc(doc(db, 'listings', rental.listingId));
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          rental.listingImageUrl = listingData.imageUrls?.[0] || '';
        }
      } catch (error) {
        console.warn(`Failed to load listing image for rental ${rental.id}:`, error);
      }

      return rental;
    }

    return null;
  } catch (error) {
    console.error('Error getting rental:', error);
    throw new Error('Failed to get rental');
  }
};

/**
 * Update rental status
 */
export const updateRentalStatus = async (
  rentalId: string,
  status: RentalData['status']
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    await updateDoc(doc(db, 'rentals', rentalId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating rental status:', error);
    throw new Error('Failed to update rental status');
  }
};

/**
 * Determine the next action required for a rental
 */
export const getNextAction = (rental: RentalData): NextAction => {
  const now = new Date();
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  
  // Calculate days until start/end
  const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceEnd = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

  switch (rental.status) {
    case 'confirmed':
      // Check if before photos are required and not completed
      if (rental.verification?.beforePhotos?.required && !rental.verification.beforePhotos.completed) {
        const urgent = daysUntilStart <= 2;
        return {
          type: 'verification_before',
          label: 'Upload Before Photos',
          description: urgent 
            ? 'Upload condition photos before pickup (due soon!)' 
            : 'Upload condition photos before pickup',
          url: `/verification/before?rentalId=${rental.id}&listingId=${rental.listingId}&ownerId=${rental.ownerId}`,
          urgent,
          dueDate: startDate
        };
      }

      // Ready for pickup
      if (daysUntilStart > 0) {
        return {
          type: 'pickup',
          label: 'Pickup Scheduled',
          description: `Pickup in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}`,
          urgent: daysUntilStart <= 1,
          dueDate: startDate
        };
      }

      // Should be active now
      return {
        type: 'pickup',
        label: 'Ready for Pickup',
        description: 'Your rental period has started',
        urgent: true,
        dueDate: startDate
      };

    case 'active':
      // Check if rental period has ended
      if (daysUntilEnd <= 0) {
        // Check if after photos are required
        if (rental.verification?.afterPhotos?.required && !rental.verification.afterPhotos.completed) {
          return {
            type: 'verification_after',
            label: 'Upload Return Photos',
            description: daysSinceEnd > 0 
              ? `Return photos overdue by ${daysSinceEnd} ${daysSinceEnd === 1 ? 'day' : 'days'}!`
              : 'Upload condition photos for return',
            url: `/verification/after?rentalId=${rental.id}&listingId=${rental.listingId}&ownerId=${rental.ownerId}&role=renter`,
            urgent: true,
            dueDate: endDate
          };
        }

        return {
          type: 'return',
          label: 'Return Item',
          description: daysSinceEnd > 0 
            ? `Return overdue by ${daysSinceEnd} ${daysSinceEnd === 1 ? 'day' : 'days'}!`
            : 'Return the item to complete rental',
          urgent: true,
          dueDate: endDate
        };
      }

      // Still in rental period
      return {
        type: 'return',
        label: 'Enjoy Your Rental',
        description: `Return in ${Math.abs(daysUntilEnd)} ${Math.abs(daysUntilEnd) === 1 ? 'day' : 'days'}`,
        urgent: daysUntilEnd <= 1,
        dueDate: endDate
      };

    case 'completed':
      // Check if review is needed
      return {
        type: 'review',
        label: 'Leave a Review',
        description: 'Share your experience with this rental',
        url: `/rentals/${rental.id}/complete`,
        urgent: false
      };

    case 'returned':
      // Waiting for owner verification or completion
      return {
        type: 'none',
        label: 'Awaiting Completion',
        description: 'Waiting for owner to complete the return process',
        urgent: false
      };

    case 'cancelled':
      return {
        type: 'none',
        label: 'Cancelled',
        description: 'This rental has been cancelled',
        urgent: false
      };

    case 'pending':
      return {
        type: 'payment',
        label: 'Complete Payment',
        description: 'Complete payment to confirm your rental',
        url: `/rentals/${rental.id}/payment`,
        urgent: true
      };

    default:
      return {
        type: 'none',
        label: 'No Action Required',
        description: 'Everything is up to date',
        urgent: false
      };
  }
};

/**
 * Group rentals by status
 */
export const groupRentalsByStatus = (rentals: RentalData[]) => {
  const groups = {
    pending: [] as RentalData[],
    confirmed: [] as RentalData[],
    active: [] as RentalData[],
    completed: [] as RentalData[],
    cancelled: [] as RentalData[]
  };

  const now = new Date();

  rentals.forEach(rental => {
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);

    if (rental.status === 'cancelled') {
      groups.cancelled.push(rental);
    } else if (rental.status === 'completed' || rental.status === 'returned') {
      groups.completed.push(rental);
    } else if (rental.status === 'active') {
      groups.active.push(rental);
    } else if (rental.status === 'confirmed') {
      // Confirmed rentals that haven't started yet
      if (startDate > now) {
        groups.confirmed.push(rental);
      } else {
        // Confirmed rentals that should be active
        groups.active.push(rental);
      }
    } else {
      // Handle any other statuses or pending payments
      groups.pending.push(rental);
    }
  });

  return groups;
};

/**
 * Format rental dates for display
 */
export const formatRentalDates = (rental: RentalData): string => {
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  };

  const start = startDate.toLocaleDateString('en-US', formatOptions);
  const end = endDate.toLocaleDateString('en-US', formatOptions);

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
};

/**
 * Calculate rental duration in days
 */
export const getRentalDuration = (rental: RentalData): number => {
  return rental.dates.length;
};
