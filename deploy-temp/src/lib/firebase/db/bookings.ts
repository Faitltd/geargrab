import { firestore } from '../client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  type DocumentSnapshot,
  type QueryConstraint
} from 'firebase/firestore';
import type { Booking } from '$types/firestore';

const BOOKINGS_COLLECTION = 'bookings';

// Get a single booking by ID
export async function getBooking(id: string): Promise<Booking | null> {
  const docRef = doc(firestore, BOOKINGS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  }
  
  return null;
}

// Get bookings for a user (as renter or owner)
export async function getUserBookings(
  userId: string,
  role: 'renter' | 'owner',
  status?: Booking['status'] | Booking['status'][],
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ bookings: Booking[]; lastVisible: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [];
  
  // Filter by user role
  if (role === 'renter') {
    constraints.push(where('renterUid', '==', userId));
  } else {
    constraints.push(where('ownerUid', '==', userId));
  }
  
  // Filter by status if provided
  if (status) {
    if (Array.isArray(status)) {
      if (status.length === 1) {
        constraints.push(where('status', '==', status[0]));
      } else if (status.length > 1) {
        constraints.push(where('status', 'in', status));
      }
    } else {
      constraints.push(where('status', '==', status));
    }
  }
  
  // Add sorting by creation date (newest first)
  constraints.push(orderBy('createdAt', 'desc'));
  
  // Add pagination
  constraints.push(limit(pageSize));
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  // Execute query
  const q = query(collection(firestore, BOOKINGS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results
  const bookings: Booking[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() } as Booking);
    newLastVisible = doc;
  });
  
  return {
    bookings,
    lastVisible: newLastVisible
  };
}

// Get bookings for a specific listing
export async function getListingBookings(
  listingId: string,
  status?: Booking['status'] | Booking['status'][],
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ bookings: Booking[]; lastVisible: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [
    where('listingId', '==', listingId)
  ];
  
  // Filter by status if provided
  if (status) {
    if (Array.isArray(status)) {
      if (status.length === 1) {
        constraints.push(where('status', '==', status[0]));
      } else if (status.length > 1) {
        constraints.push(where('status', 'in', status));
      }
    } else {
      constraints.push(where('status', '==', status));
    }
  }
  
  // Add sorting by start date
  constraints.push(orderBy('startDate', 'asc'));
  
  // Add pagination
  constraints.push(limit(pageSize));
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  // Execute query
  const q = query(collection(firestore, BOOKINGS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results
  const bookings: Booking[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() } as Booking);
    newLastVisible = doc;
  });
  
  return {
    bookings,
    lastVisible: newLastVisible
  };
}

// Create a new booking
export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const bookingWithTimestamps = {
    ...bookingData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(firestore, BOOKINGS_COLLECTION), bookingWithTimestamps);
  return docRef.id;
}

// Update an existing booking
export async function updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
  const docRef = doc(firestore, BOOKINGS_COLLECTION, id);
  
  // Add updated timestamp
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, updatesWithTimestamp);
}

// Check if a listing is available for a specific date range
export async function checkListingAvailability(
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  // Convert dates to timestamps for comparison
  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();
  
  // Query for any overlapping bookings
  const q = query(
    collection(firestore, BOOKINGS_COLLECTION),
    where('listingId', '==', listingId),
    where('status', 'in', ['pending', 'confirmed', 'active']),
    where('endDate', '>', startTimestamp),
    orderBy('endDate'),
    limit(10)
  );
  
  const querySnapshot = await getDocs(q);
  
  // Check for overlapping bookings
  for (const doc of querySnapshot.docs) {
    const booking = doc.data() as Booking;
    const bookingStartTimestamp = booking.startDate.toMillis ? booking.startDate.toMillis() : (booking.startDate as unknown as number);

    // If the booking starts before our end date, there's an overlap
    if (bookingStartTimestamp <= endTimestamp) {
      return false; // Not available
    }
  }
  
  return true; // Available
}
