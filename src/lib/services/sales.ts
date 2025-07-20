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

// Sale data interface
export interface SaleData {
  id?: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string;
  ownerId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName?: string;
  amount: number;
  currency: string;
  status: 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  paymentIntentId: string;
  checkoutSessionId: string;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  createdAt: any;
  updatedAt: any;
}

// Sales summary interface
export interface SalesSummary {
  totalRevenue: number;
  totalSales: number;
  averageSalePrice: number;
  thisMonthRevenue: number;
  thisMonthSales: number;
  lastMonthRevenue: number;
  lastMonthSales: number;
  revenueGrowth: number;
  salesGrowth: number;
}

/**
 * Get sales for a specific seller (owner)
 */
export const getSellerSales = async (sellerId: string): Promise<SaleData[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      collection(db, 'sales'),
      where('ownerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sales: SaleData[] = [];

    querySnapshot.forEach((doc) => {
      sales.push({
        id: doc.id,
        ...doc.data()
      } as SaleData);
    });

    // Enrich with listing images and buyer names
    for (const sale of sales) {
      try {
        // Get listing image
        const listingDoc = await getDoc(doc(db, 'listings', sale.listingId));
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          sale.listingImageUrl = listingData.imageUrls?.[0] || '';
        }

        // Get buyer name
        const buyerDoc = await getDoc(doc(db, 'users', sale.buyerId));
        if (buyerDoc.exists()) {
          const buyerData = buyerDoc.data();
          sale.buyerName = buyerData.displayName || buyerData.firstName || 'Anonymous Buyer';
        }
      } catch (error) {
        console.warn(`Failed to enrich sale data for sale ${sale.id}:`, error);
      }
    }

    return sales;
  } catch (error) {
    console.error('Error getting seller sales:', error);
    throw new Error('Failed to get seller sales');
  }
};

/**
 * Get a specific sale by ID
 */
export const getSale = async (saleId: string): Promise<SaleData | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const saleDoc = await getDoc(doc(db, 'sales', saleId));
    
    if (saleDoc.exists()) {
      const sale = {
        id: saleDoc.id,
        ...saleDoc.data()
      } as SaleData;

      // Enrich with listing image and buyer name
      try {
        const listingDoc = await getDoc(doc(db, 'listings', sale.listingId));
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          sale.listingImageUrl = listingData.imageUrls?.[0] || '';
        }

        const buyerDoc = await getDoc(doc(db, 'users', sale.buyerId));
        if (buyerDoc.exists()) {
          const buyerData = buyerDoc.data();
          sale.buyerName = buyerData.displayName || buyerData.firstName || 'Anonymous Buyer';
        }
      } catch (error) {
        console.warn(`Failed to enrich sale data for sale ${sale.id}:`, error);
      }

      return sale;
    }

    return null;
  } catch (error) {
    console.error('Error getting sale:', error);
    throw new Error('Failed to get sale');
  }
};

/**
 * Update sale status
 */
export const updateSaleStatus = async (
  saleId: string,
  status: SaleData['status']
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    await updateDoc(doc(db, 'sales', saleId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating sale status:', error);
    throw new Error('Failed to update sale status');
  }
};

/**
 * Calculate sales summary for a seller
 */
export const getSalesSummary = async (sellerId: string): Promise<SalesSummary> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const sales = await getSellerSales(sellerId);
    
    // Calculate date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filter sales by date
    const thisMonthSales = sales.filter(sale => {
      const saleDate = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      return saleDate >= thisMonthStart;
    });

    const lastMonthSales = sales.filter(sale => {
      const saleDate = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
      return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
    });

    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSales = sales.length;
    const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.amount, 0);
    const thisMonthSalesCount = thisMonthSales.length;

    const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.amount, 0);
    const lastMonthSalesCount = lastMonthSales.length;

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : thisMonthRevenue > 0 ? 100 : 0;

    const salesGrowth = lastMonthSalesCount > 0 
      ? ((thisMonthSalesCount - lastMonthSalesCount) / lastMonthSalesCount) * 100 
      : thisMonthSalesCount > 0 ? 100 : 0;

    return {
      totalRevenue,
      totalSales,
      averageSalePrice,
      thisMonthRevenue,
      thisMonthSales: thisMonthSalesCount,
      lastMonthRevenue,
      lastMonthSales: lastMonthSalesCount,
      revenueGrowth,
      salesGrowth
    };
  } catch (error) {
    console.error('Error calculating sales summary:', error);
    throw new Error('Failed to calculate sales summary');
  }
};

/**
 * Format sale date for display
 */
export const formatSaleDate = (sale: SaleData): string => {
  const date = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * Format shipping address for display
 */
export const formatShippingAddress = (address?: SaleData['shippingAddress']): string => {
  if (!address) return 'No shipping address';

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Get status color for display
 */
export const getSaleStatusColor = (status: SaleData['status']): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-yellow-100 text-yellow-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

/**
 * Get status label for display
 */
export const getSaleStatusLabel = (status: SaleData['status']): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

/**
 * Group sales by time period
 */
export const groupSalesByPeriod = (sales: SaleData[], period: 'day' | 'week' | 'month' = 'month') => {
  const groups: { [key: string]: SaleData[] } = {};

  sales.forEach(sale => {
    const date = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(sale);
  });

  return groups;
};
