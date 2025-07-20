// Firestore Service - Production-ready database operations
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/firebase';

// Type definitions for our collections
export interface User {
  id?: string;
  name: string;
  email: string;
  createdAt: any;
  role: 'user' | 'admin' | 'moderator';
  profileData?: {
    phone?: string;
    location?: string;
    bio?: string;
    avatar?: string;
    verified?: boolean;
  };
}

export interface Listing {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  ownerId: string;
  images: string[];
  status: 'active' | 'booked' | 'archived' | 'inactive';
  createdAt: any;
  updatedAt: any;
  brand?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  tags?: string[];
  availability?: {
    start: any;
    end: any;
    blockedDates?: any[];
  };
}

export interface Booking {
  id?: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  dates: {
    start: any;
    end: any;
  };
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  amount: number;
  createdAt: any;
  paymentId?: string;
  notes?: string;
  insurance?: boolean;
  deposit?: number;
}

export interface Dispute {
  id?: string;
  bookingId: string;
  reporterId: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  messages: Array<{
    userId: string;
    message: string;
    timestamp: any;
  }>;
  createdAt: any;
  resolvedAt?: any;
}

// Generic CRUD operations
export class FirestoreService {
  
  // Create a new document
  static async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Read a single document
  static async read<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error reading document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  static async update<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  static async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Query documents with filters
  static async query<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listener for a collection
  static onCollectionSnapshot<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    const q = query(collection(db, collectionName), ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }

  // Real-time listener for a single document
  static onDocumentSnapshot<T>(
    collectionName: string,
    docId: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, docId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        callback(null);
      }
    });
  }
}

// Specialized services for each collection
export class UserService {
  static async createUser(userData: Omit<User, 'id'>): Promise<string> {
    return FirestoreService.create<User>('users', userData);
  }

  static async getUser(userId: string): Promise<User | null> {
    return FirestoreService.read<User>('users', userId);
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    return FirestoreService.update<User>('users', userId, userData);
  }

  static async getUsersByRole(role: string): Promise<User[]> {
    return FirestoreService.query<User>('users', [where('role', '==', role)]);
  }
}

export class ListingService {
  static async createListing(listingData: Omit<Listing, 'id'>): Promise<string> {
    return FirestoreService.create<Listing>('listings', {
      ...listingData,
      updatedAt: serverTimestamp()
    });
  }

  static async getListing(listingId: string): Promise<Listing | null> {
    return FirestoreService.read<Listing>('listings', listingId);
  }

  static async updateListing(listingId: string, listingData: Partial<Listing>): Promise<void> {
    return FirestoreService.update<Listing>('listings', listingId, listingData);
  }

  static async deleteListing(listingId: string): Promise<void> {
    return FirestoreService.delete('listings', listingId);
  }

  static async getListings(filters: {
    category?: string;
    status?: string;
    ownerId?: string;
    limit?: number;
  } = {}): Promise<Listing[]> {
    const constraints: QueryConstraint[] = [];
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.ownerId) {
      constraints.push(where('ownerId', '==', filters.ownerId));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    return FirestoreService.query<Listing>('listings', constraints);
  }

  static onListingsSnapshot(
    callback: (listings: Listing[]) => void,
    filters: { category?: string; status?: string } = {}
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [];
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));

    return FirestoreService.onCollectionSnapshot<Listing>('listings', callback, constraints);
  }
}

export class BookingService {
  static async createBooking(bookingData: Omit<Booking, 'id'>): Promise<string> {
    return FirestoreService.create<Booking>('bookings', bookingData);
  }

  static async getBooking(bookingId: string): Promise<Booking | null> {
    return FirestoreService.read<Booking>('bookings', bookingId);
  }

  static async updateBooking(bookingId: string, bookingData: Partial<Booking>): Promise<void> {
    return FirestoreService.update<Booking>('bookings', bookingId, bookingData);
  }

  static async getUserBookings(userId: string, asRenter: boolean = true): Promise<Booking[]> {
    const field = asRenter ? 'renterId' : 'ownerId';
    return FirestoreService.query<Booking>('bookings', [
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    ]);
  }

  static async getListingBookings(listingId: string): Promise<Booking[]> {
    return FirestoreService.query<Booking>('bookings', [
      where('listingId', '==', listingId),
      orderBy('createdAt', 'desc')
    ]);
  }
}

export class DisputeService {
  static async createDispute(disputeData: Omit<Dispute, 'id'>): Promise<string> {
    return FirestoreService.create<Dispute>('disputes', disputeData);
  }

  static async getDispute(disputeId: string): Promise<Dispute | null> {
    return FirestoreService.read<Dispute>('disputes', disputeId);
  }

  static async updateDispute(disputeId: string, disputeData: Partial<Dispute>): Promise<void> {
    return FirestoreService.update<Dispute>('disputes', disputeId, disputeData);
  }

  static async getOpenDisputes(): Promise<Dispute[]> {
    return FirestoreService.query<Dispute>('disputes', [
      where('status', 'in', ['open', 'investigating']),
      orderBy('createdAt', 'desc')
    ]);
  }
}
