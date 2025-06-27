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
import type { Sale, SalePurchase } from '$lib/types/firestore';

const SALES_COLLECTION = 'sales';
const SALE_PURCHASES_COLLECTION = 'salePurchases';

// Get a single sale by ID
export async function getSale(id: string): Promise<Sale | null> {
  const docRef = doc(firestore, SALES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Sale;
  }
  
  return null;
}

// Get sales with pagination and filters
export async function getSales(
  filters: {
    category?: string;
    location?: {
      city?: string;
      state?: string;
      zipCode?: string;
    };
    priceRange?: {
      min?: number;
      max?: number;
    };
    condition?: string[];
    sellerId?: string;
    status?: 'active' | 'sold' | 'inactive' | 'pending';
  } = {},
  sortBy: 'createdAt' | 'price' | 'averageRating' = 'createdAt',
  sortDirection: 'asc' | 'desc' = 'desc',
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ sales: Sale[]; lastVisible: DocumentSnapshot | null }> {
  // Build query constraints
  const constraints: QueryConstraint[] = [];

  // Default to active sales only
  if (!filters.status) {
    constraints.push(where('status', '==', 'active'));
  } else {
    constraints.push(where('status', '==', filters.status));
  }

  // Filter by category
  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }

  // Filter by seller
  if (filters.sellerId) {
    constraints.push(where('sellerId', '==', filters.sellerId));
  }

  // Filter by location
  if (filters.location?.city) {
    constraints.push(where('location.city', '==', filters.location.city));
  }
  if (filters.location?.state) {
    constraints.push(where('location.state', '==', filters.location.state));
  }

  // Filter by price range (client-side filtering for now)
  // Note: Firestore doesn't support range queries on multiple fields efficiently

  // Filter by condition (client-side filtering for now)
  // Note: Firestore doesn't support array-contains-any with other where clauses

  // Add sorting
  constraints.push(orderBy(sortBy, sortDirection));

  // Add pagination
  constraints.push(limit(pageSize));
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  // Execute query
  const q = query(collection(firestore, SALES_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results
  const sales: Sale[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  querySnapshot.forEach((doc) => {
    const saleData = { id: doc.id, ...doc.data() } as Sale;
    
    // Apply client-side filters
    let includeItem = true;
    
    // Price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min && saleData.price < filters.priceRange.min) {
        includeItem = false;
      }
      if (filters.priceRange.max && saleData.price > filters.priceRange.max) {
        includeItem = false;
      }
    }
    
    // Condition filter
    if (filters.condition && filters.condition.length > 0) {
      if (!filters.condition.includes(saleData.condition)) {
        includeItem = false;
      }
    }
    
    if (includeItem) {
      sales.push(saleData);
      newLastVisible = doc;
    }
  });
  
  return {
    sales,
    lastVisible: newLastVisible
  };
}

// Create a new sale listing
export async function createSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const saleWithTimestamps = {
    ...saleData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active',
    isActive: true,
    isSold: false,
    views: 0,
    favoritesCount: 0,
    averageRating: 0,
    // Add search terms for better text search
    searchTerms: generateSearchTerms(saleData)
  };

  const docRef = await addDoc(collection(firestore, SALES_COLLECTION), saleWithTimestamps);
  console.log('✅ Created sale with ID:', docRef.id);
  return docRef.id;
}

// Generate search terms for better searchability
function generateSearchTerms(saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): string[] {
  const terms: string[] = [];
  
  // Add title words
  terms.push(...saleData.title.toLowerCase().split(' '));
  
  // Add description words (first 50 words)
  const descWords = saleData.description.toLowerCase().split(' ').slice(0, 50);
  terms.push(...descWords);
  
  // Add category
  terms.push(saleData.category.toLowerCase());
  
  // Add condition
  terms.push(saleData.condition.toLowerCase());
  
  // Add brand and model if available
  if (saleData.brand) {
    terms.push(saleData.brand.toLowerCase());
  }
  if (saleData.model) {
    terms.push(saleData.model.toLowerCase());
  }
  
  // Add location
  terms.push(saleData.location.city.toLowerCase());
  terms.push(saleData.location.state.toLowerCase());
  
  // Add features
  terms.push(...saleData.features.map(f => f.toLowerCase()));
  
  // Remove duplicates and empty strings
  return [...new Set(terms.filter(term => term.length > 0))];
}

// Update an existing sale
export async function updateSale(id: string, updates: Partial<Sale>): Promise<void> {
  const docRef = doc(firestore, SALES_COLLECTION, id);
  
  // Add updated timestamp
  const updatesWithTimestamp = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, updatesWithTimestamp);
}

// Delete a sale
export async function deleteSale(id: string): Promise<void> {
  const docRef = doc(firestore, SALES_COLLECTION, id);
  await deleteDoc(docRef);
}

// Mark sale as sold
export async function markSaleAsSold(id: string): Promise<void> {
  await updateSale(id, {
    status: 'sold',
    isSold: true,
    isActive: false
  });
}

// Search sales by text
export async function searchSales(
  searchText: string,
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ sales: Sale[]; lastVisible: DocumentSnapshot | null }> {
  // Note: This is a simple implementation. For production, consider using Algolia or Firebase Extensions for search
  const constraints: QueryConstraint[] = [
    where('status', '==', 'active'),
    orderBy('title'),
    limit(pageSize)
  ];
  
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  
  const q = query(collection(firestore, SALES_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);
  
  // Process results and filter client-side (not ideal for production)
  const sales: Sale[] = [];
  let newLastVisible: DocumentSnapshot | null = null;
  
  const searchTextLower = searchText.toLowerCase();
  
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Omit<Sale, 'id'>;
    
    // Simple text matching on title, description, brand, and model
    if (
      data.title.toLowerCase().includes(searchTextLower) ||
      data.description.toLowerCase().includes(searchTextLower) ||
      data.brand?.toLowerCase().includes(searchTextLower) ||
      data.model?.toLowerCase().includes(searchTextLower)
    ) {
      sales.push({ id: doc.id, ...data } as Sale);
      newLastVisible = doc;
    }
  });
  
  return {
    sales,
    lastVisible: newLastVisible
  };
}

// Get sales by seller
export async function getSalesBySeller(
  sellerId: string,
  pageSize: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{ sales: Sale[]; lastVisible: DocumentSnapshot | null }> {
  return getSales(
    { sellerId },
    'createdAt',
    'desc',
    pageSize,
    lastVisible
  );
}

// Increment sale view count
export async function incrementSaleViews(id: string): Promise<void> {
  const docRef = doc(firestore, SALES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const currentViews = docSnap.data().views || 0;
    await updateDoc(docRef, {
      views: currentViews + 1
    });
  }
}
