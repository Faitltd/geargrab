import { firestore } from '../client';
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
  serverTimestamp,
  type DocumentSnapshot,
  type QueryConstraint
} from 'firebase/firestore';
import type { Listing } from '$types/firestore';

const LISTINGS_COLLECTION = 'listings';

// Get a single listing by ID
export async function getListing(id: string): Promise<Listing | null> {
  const docRef = doc(firestore, LISTINGS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Listing;
  }
  
  return null;
}

// Get listings with pagination
export async function getListings(
  filters: {
    category?: string;
    subcategory?: string;
    location?: {
      city?: string;
      state?: string;
      zipCode?: string;
    };
    priceRange?: {
      min?: number;
      max?: number;
    };
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    condition?: string[];
    ownerUid?: string;
    status?: 'active' | 'inactive' | 'pending' | 'rejected';
  } = {},
  sortBy: 'createdAt' | 'dailyPrice' | 'averageRating' = 'createdAt',
  sortDirection: 'asc' | 'desc' = 'desc',
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ listings: Listing[]; lastVisible: DocumentSnapshot | null }> {
  // Build query constraints
  const constraints: QueryConstraint[] = [];
  
  // Only show active listings by default unless specifically querying for other statuses
  if (!filters.status) {
    constraints.push(where('status', '==', 'active'));
  } else {
    constraints.push(where('status', '==', filters.status));
  }
  
  // Add filters
  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }
  
  if (filters.subcategory) {
    constraints.push(where('subcategory', '==', filters.subcategory));
  }
  
  if (filters.ownerUid) {
    constraints.push(where('ownerUid', '==', filters.ownerUid));
  }
  
  if (filters.location?.zipCode) {
    constraints.push(where('location.zipCode', '==', filters.location.zipCode));
  } else if (filters.location?.city && filters.location?.state) {
    constraints.push(where('location.city', '==', filters.location.city));
    constraints.push(where('location.state', '==', filters.location.state));
  }
  
  if (filters.priceRange?.min !== undefined) {
    constraints.push(where('dailyPrice', '>=', filters.priceRange.min));
  }
  
  if (filters.priceRange?.max !== undefined) {
    constraints.push(where('dailyPrice', '<=', filters.priceRange.max));
  }
  
  // Add sorting
  constraints.push(orderBy(sortBy, sortDirection));
  
  // Add pagination
  constraints.push(limit(pageSize));
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  // Execute query
  const q = query(collection(firestore, LISTINGS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results
  const listings: Listing[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  querySnapshot.forEach((doc) => {
    listings.push({ id: doc.id, ...doc.data() } as Listing);
    newLastVisible = doc;
  });
  
  return {
    listings,
    lastVisible: newLastVisible
  };
}

// Create a new listing
export async function createListing(listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const listingWithTimestamps = {
    ...listingData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active'
  };
  
  const docRef = await addDoc(collection(firestore, LISTINGS_COLLECTION), listingWithTimestamps);
  return docRef.id;
}

// Update an existing listing
export async function updateListing(id: string, updates: Partial<Listing>): Promise<void> {
  const docRef = doc(firestore, LISTINGS_COLLECTION, id);
  
  // Add updated timestamp
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, updatesWithTimestamp);
}

// Delete a listing
export async function deleteListing(id: string): Promise<void> {
  const docRef = doc(firestore, LISTINGS_COLLECTION, id);
  await deleteDoc(docRef);
}

// Search listings by text
export async function searchListings(
  searchText: string,
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ listings: Listing[]; lastVisible: DocumentSnapshot | null }> {
  // Note: This is a simple implementation. For production, consider using Algolia or Firebase Extensions for search
  const constraints: QueryConstraint[] = [
    where('status', '==', 'active'),
    orderBy('title'),
    limit(pageSize)
  ];
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  const q = query(collection(firestore, LISTINGS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results and filter client-side (not ideal for production)
  const listings: Listing[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  const searchTextLower = searchText.toLowerCase();
  
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Omit<Listing, 'id'>;
    
    // Simple text matching on title and description
    if (
      data.title.toLowerCase().includes(searchTextLower) ||
      data.description.toLowerCase().includes(searchTextLower) ||
      data.brand?.toLowerCase().includes(searchTextLower) ||
      data.model?.toLowerCase().includes(searchTextLower)
    ) {
      listings.push({ id: doc.id, ...data } as Listing);
      newLastVisible = doc;
    }
  });
  
  return {
    listings,
    lastVisible: newLastVisible
  };
}
