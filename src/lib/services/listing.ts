import { firestore } from '$lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { products } from '$lib/data/products';

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  condition: string;
  ageInYears?: number;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  images: string[];
  location: {
    city: string;
    state: string;
    zipCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  owner: {
    uid: string;
    id?: string;
    name: string;
    email?: string;
    profileImage?: string;
    joinedDate?: string;
    verificationStatus?: string;
    responseTime?: string;
    responseRate?: number;
  };
  views: number;
  bookings: number;
  earnings: number;
  averageRating: number;
  totalReviews: number;
  reviewCount?: number;
  reviews: any[];
  features: string[];
  specifications: Record<string, any>;
  availabilityCalendar: {
    unavailableDates: string[];
    minimumRental: number;
    maximumRental: number;
  };
  includesInsurance: boolean;
  insuranceDetails: string;
  deliveryOptions: {
    pickup: boolean;
    dropoff: boolean;
    shipping: boolean;
    pickupLocation?: string;
    dropoffDistance?: number;
  };
}

class ListingService {
  async loadListing(listingId: string): Promise<Listing | null> {
    try {
      console.log('🔍 Loading listing with ID:', listingId);
      console.log('🔍 Firestore available:', !!firestore);

      // Try to load from Firestore first
      if (firestore) {
        try {
          console.log('🔍 Attempting Firestore query for listing:', listingId);
          const listingRef = doc(firestore, 'listings', listingId);
          const listingSnap = await getDoc(listingRef);

          console.log('🔍 Firestore document exists:', listingSnap.exists());

          if (listingSnap.exists()) {
            const listingData = listingSnap.data();
            console.log('🔍 Raw Firestore data:', listingData);

            const listing: Listing = {
              id: listingSnap.id,
              ...listingData,
              // Ensure we have all required fields with defaults
              views: listingData.views || 0,
              bookings: listingData.bookings || 0,
              earnings: listingData.earnings || 0,
              averageRating: listingData.averageRating || 4.5,
              totalReviews: listingData.totalReviews || 0,
              reviews: listingData.reviews || [],
              features: listingData.features || [],
              specifications: listingData.specifications || {},
              availabilityCalendar: listingData.availabilityCalendar || {
                unavailableDates: [],
                minimumRental: 1,
                maximumRental: 30
              },
              includesInsurance: listingData.includesInsurance !== false,
              insuranceDetails: listingData.insuranceDetails || 'Basic damage coverage included',
              deliveryOptions: listingData.deliveryOptions || {
                pickup: true,
                dropoff: true,
                shipping: false,
                pickupLocation: `${listingData.location?.city}, ${listingData.location?.state}`,
                dropoffDistance: 25
              }
            } as Listing;
            
            console.log('✅ Successfully loaded from Firestore:', listing.title);
            return listing;
          } else {
            console.log('❌ Document does not exist in Firestore for ID:', listingId);
          }
        } catch (firestoreError) {
          console.error('❌ Firestore load failed:', firestoreError);
        }
      } else {
        console.log('❌ Firestore not available');
      }

      // Fallback: try to find the listing in the products array
      const productListing = products.find(product => product.id === listingId);

      if (productListing) {
        // Transform product data to match expected listing structure
        const listing: Listing = {
          id: productListing.id,
          title: productListing.title,
          description: productListing.description,
          category: productListing.category,
          subcategory: productListing.subcategory,
          brand: productListing.brand,
          model: productListing.model,
          condition: productListing.condition,
          ageInYears: productListing.ageInYears,
          dailyPrice: productListing.dailyPrice,
          weeklyPrice: productListing.weeklyPrice,
          monthlyPrice: productListing.monthlyPrice,
          images: productListing.images,
          location: productListing.location,
          owner: productListing.owner,
          views: productListing.views || 0,
          bookings: productListing.bookings || 0,
          earnings: productListing.earnings || 0,
          averageRating: productListing.averageRating || 4.5,
          totalReviews: productListing.totalReviews || 0,
          reviewCount: productListing.reviewCount || 0,
          reviews: productListing.reviews || [],
          features: productListing.features || [],
          specifications: productListing.specifications || {},
          availabilityCalendar: productListing.availabilityCalendar || {
            unavailableDates: [],
            minimumRental: 1,
            maximumRental: 30
          },
          includesInsurance: productListing.includesInsurance !== false,
          insuranceDetails: productListing.insuranceDetails || 'Basic damage coverage included',
          deliveryOptions: productListing.deliveryOptions || {
            pickup: true,
            dropoff: true,
            shipping: false,
            pickupLocation: `${productListing.location?.city}, ${productListing.location?.state}`,
            dropoffDistance: 25
          }
        };

        console.log('✅ Successfully loaded from products array:', listing.title);
        return listing;
      }

      console.log('❌ Listing not found in either Firestore or products array');
      return null;
    } catch (error) {
      console.error('❌ Error loading listing:', error);
      return null;
    }
  }

  // Utility functions
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  isDateUnavailable(listing: Listing, date: Date): boolean {
    if (!listing?.availabilityCalendar?.unavailableDates) return false;
    const dateString = date.toISOString().split('T')[0];
    return listing.availabilityCalendar.unavailableDates.includes(dateString);
  }

  calculateTotalPrice(dailyPrice: number, startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff * dailyPrice;
  }
}

export const listingService = new ListingService();
