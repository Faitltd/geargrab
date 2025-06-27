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
import type { Guide, GuideBooking } from '$lib/types/firestore';

const GUIDES_COLLECTION = 'guides';
const GUIDE_BOOKINGS_COLLECTION = 'guideBookings';

// Get a single guide by ID
export async function getGuide(id: string): Promise<Guide | null> {
  const docRef = doc(firestore, GUIDES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Guide;
  }
  
  return null;
}

// Get guides with pagination and filters
export async function getGuides(
  filters: {
    specialty?: string;
    location?: {
      city?: string;
      state?: string;
      zipCode?: string;
    };
    rateRange?: {
      min?: number;
      max?: number;
    };
    availability?: string[];
    guideId?: string;
    status?: 'active' | 'inactive' | 'pending' | 'suspended';
    isVerified?: boolean;
  } = {},
  sortBy: 'createdAt' | 'hourlyRate' | 'averageRating' | 'totalBookings' = 'createdAt',
  sortDirection: 'asc' | 'desc' = 'desc',
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ guides: Guide[]; lastVisible: DocumentSnapshot | null }> {
  // Build query constraints
  const constraints: QueryConstraint[] = [];

  // Default to active guides only
  if (!filters.status) {
    constraints.push(where('status', '==', 'active'));
  } else {
    constraints.push(where('status', '==', filters.status));
  }

  // Filter by guide ID
  if (filters.guideId) {
    constraints.push(where('guideId', '==', filters.guideId));
  }

  // Filter by verification status
  if (filters.isVerified !== undefined) {
    constraints.push(where('isVerified', '==', filters.isVerified));
  }

  // Filter by location
  if (filters.location?.city) {
    constraints.push(where('location.city', '==', filters.location.city));
  }
  if (filters.location?.state) {
    constraints.push(where('location.state', '==', filters.location.state));
  }

  // Add sorting
  constraints.push(orderBy(sortBy, sortDirection));

  // Add pagination
  constraints.push(limit(pageSize));
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  // Execute query
  const q = query(collection(firestore, GUIDES_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results
  const guides: Guide[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  querySnapshot.forEach((doc) => {
    const guideData = { id: doc.id, ...doc.data() } as Guide;
    
    // Apply client-side filters
    let includeGuide = true;
    
    // Specialty filter
    if (filters.specialty && !guideData.specialties.includes(filters.specialty)) {
      includeGuide = false;
    }
    
    // Rate range filter
    if (filters.rateRange) {
      if (filters.rateRange.min && guideData.hourlyRate < filters.rateRange.min) {
        includeGuide = false;
      }
      if (filters.rateRange.max && guideData.hourlyRate > filters.rateRange.max) {
        includeGuide = false;
      }
    }
    
    // Availability filter
    if (filters.availability && filters.availability.length > 0) {
      const hasAvailability = filters.availability.some(day => 
        guideData.availability.daysOfWeek.includes(day)
      );
      if (!hasAvailability) {
        includeGuide = false;
      }
    }
    
    if (includeGuide) {
      guides.push(guideData);
      newLastVisible = doc;
    }
  });
  
  return {
    guides,
    lastVisible: newLastVisible
  };
}

// Create a new guide profile
export async function createGuide(guideData: Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const guideWithTimestamps = {
    ...guideData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'pending', // Guides start as pending until verified
    isActive: false,
    isVerified: false,
    totalBookings: 0,
    averageRating: 0,
    reviewCount: 0,
    // Add search terms for better text search
    searchTerms: generateGuideSearchTerms(guideData)
  };

  const docRef = await addDoc(collection(firestore, GUIDES_COLLECTION), guideWithTimestamps);
  console.log('✅ Created guide profile with ID:', docRef.id);
  return docRef.id;
}

// Generate search terms for better searchability
function generateGuideSearchTerms(guideData: Omit<Guide, 'id' | 'createdAt' | 'updatedAt'>): string[] {
  const terms: string[] = [];
  
  // Add name words
  terms.push(...guideData.displayName.toLowerCase().split(' '));
  
  // Add bio words (first 50 words)
  const bioWords = guideData.bio.toLowerCase().split(' ').slice(0, 50);
  terms.push(...bioWords);
  
  // Add specialties
  terms.push(...guideData.specialties.map(s => s.toLowerCase()));
  
  // Add certifications
  terms.push(...guideData.certifications.map(c => c.toLowerCase()));
  
  // Add location
  terms.push(guideData.location.city.toLowerCase());
  terms.push(guideData.location.state.toLowerCase());
  
  // Add languages
  terms.push(...guideData.languages.map(l => l.toLowerCase()));
  
  // Add equipment
  if (guideData.equipment) {
    terms.push(...guideData.equipment.map(e => e.toLowerCase()));
  }
  
  // Remove duplicates and empty strings
  return [...new Set(terms.filter(term => term.length > 0))];
}

// Update an existing guide
export async function updateGuide(id: string, updates: Partial<Guide>): Promise<void> {
  const docRef = doc(firestore, GUIDES_COLLECTION, id);
  
  // Add updated timestamp
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, updatesWithTimestamp);
}

// Delete a guide
export async function deleteGuide(id: string): Promise<void> {
  const docRef = doc(firestore, GUIDES_COLLECTION, id);
  await deleteDoc(docRef);
}

// Search guides by text
export async function searchGuides(
  searchText: string,
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ guides: Guide[]; lastVisible: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'active'),
    where('isVerified', '==', true),
    orderBy('displayName'),
    limit(pageSize)
  ];
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  const q = query(collection(firestore, GUIDES_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results and filter client-side
  const guides: Guide[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  const searchTextLower = searchText.toLowerCase();
  
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Omit<Guide, 'id'>;
    
    // Simple text matching on name, bio, specialties, and certifications
    if (
      data.displayName.toLowerCase().includes(searchTextLower) ||
      data.bio.toLowerCase().includes(searchTextLower) ||
      data.specialties.some(s => s.toLowerCase().includes(searchTextLower)) ||
      data.certifications.some(c => c.toLowerCase().includes(searchTextLower))
    ) {
      guides.push({ id: doc.id, ...data } as Guide);
      newLastVisible = doc;
    }
  });
  
  return {
    guides,
    lastVisible: newLastVisible
  };
}

// Get guides by guide user ID
export async function getGuidesByUserId(
  guideId: string,
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ guides: Guide[]; lastVisible: DocumentSnapshot | null }> {
  return getGuides(
    { guideId },
    'createdAt',
    'desc',
    pageSize,
    lastVisible
  );
}

// Get a single guide booking by ID
export async function getGuideBooking(id: string): Promise<GuideBooking | null> {
  const docRef = doc(firestore, GUIDE_BOOKINGS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as GuideBooking;
  }
  
  return null;
}

// Create a new guide booking
export async function createGuideBooking(bookingData: Omit<GuideBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const bookingWithTimestamps = {
    ...bookingData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'pending'
  };

  const docRef = await addDoc(collection(firestore, GUIDE_BOOKINGS_COLLECTION), bookingWithTimestamps);
  console.log('✅ Created guide booking with ID:', docRef.id);
  return docRef.id;
}

// Update a guide booking
export async function updateGuideBooking(id: string, updates: Partial<GuideBooking>): Promise<void> {
  const docRef = doc(firestore, GUIDE_BOOKINGS_COLLECTION, id);
  
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, updatesWithTimestamp);
}

// Get guide bookings with filters
export async function getGuideBookings(
  filters: {
    guideId?: string;
    clientId?: string;
    status?: string;
  } = {},
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ bookings: GuideBooking[]; lastVisible: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [];

  if (filters.guideId) {
    constraints.push(where('guideId', '==', filters.guideId));
  }
  
  if (filters.clientId) {
    constraints.push(where('clientId', '==', filters.clientId));
  }
  
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize));
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  const q = query(collection(firestore, GUIDE_BOOKINGS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  const bookings: GuideBooking[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() } as GuideBooking);
    newLastVisible = doc;
  });
  
  return {
    bookings,
    lastVisible: newLastVisible
  };
}
