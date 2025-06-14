import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import type { Listing } from '$types/firestore';

// Define cart item interface
export interface CartItem {
  listingId: string;
  listingTitle: string;
  listingImage: string;
  ownerUid: string;
  dailyPrice: number;
  securityDeposit: number;
  startDate: Date;
  endDate: Date;
  deliveryMethod: 'pickup' | 'dropoff' | 'shipping';
  deliveryFee?: number;
  insuranceTier?: 'basic' | 'standard' | 'premium' | 'none';
  insuranceCost?: number;
}

// Create a writable store for the cart
const createCartStore = () => {
  // Initialize from localStorage if available
  const initialCart: CartItem[] = browser 
    ? JSON.parse(localStorage.getItem('gearGrabCart') || '[]').map((item: any) => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate)
      }))
    : [];
  
  const { subscribe, update, set } = writable<CartItem[]>(initialCart);

  // Save to localStorage whenever the cart changes
  let localStorageUnsubscribe: (() => void) | null = null;
  if (browser) {
    localStorageUnsubscribe = subscribe((cart) => {
      localStorage.setItem('gearGrabCart', JSON.stringify(cart));
    });
  }
  
  return {
    subscribe,
    
    // Add an item to the cart
    addItem: (
      listing: Listing,
      startDate: Date,
      endDate: Date,
      deliveryMethod: 'pickup' | 'dropoff' | 'shipping',
      insuranceTier?: 'basic' | 'standard' | 'premium' | 'none'
    ) => {
      update((cart) => {
        // Check if this listing is already in the cart
        const existingIndex = cart.findIndex(item => item.listingId === listing.id);
        
        // Calculate delivery fee if applicable
        let deliveryFee = 0;
        if (deliveryMethod === 'dropoff' && listing.deliveryOptions.dropoffDistance) {
          deliveryFee = 5; // Base fee
        } else if (deliveryMethod === 'shipping' && listing.deliveryOptions.shippingFee) {
          deliveryFee = listing.deliveryOptions.shippingFee;
        }
        
        // Calculate insurance cost if applicable
        let insuranceCost = 0;
        if (insuranceTier === 'basic') {
          insuranceCost = 5;
        } else if (insuranceTier === 'standard') {
          insuranceCost = 10;
        } else if (insuranceTier === 'premium') {
          insuranceCost = 15;
        }
        
        const newItem: CartItem = {
          listingId: listing.id,
          listingTitle: listing.title,
          listingImage: listing.images[0] || '',
          ownerUid: listing.ownerUid,
          dailyPrice: listing.dailyPrice,
          securityDeposit: listing.securityDeposit,
          startDate,
          endDate,
          deliveryMethod,
          deliveryFee,
          insuranceTier,
          insuranceCost
        };
        
        // If the listing is already in the cart, replace it
        if (existingIndex >= 0) {
          const newCart = [...cart];
          newCart[existingIndex] = newItem;
          return newCart;
        }
        
        // Otherwise add it to the cart
        return [...cart, newItem];
      });
    },
    
    // Remove an item from the cart
    removeItem: (listingId: string) => {
      update((cart) => cart.filter(item => item.listingId !== listingId));
    },
    
    // Clear the entire cart
    clear: () => {
      set([]);
    },
    
    // Get the total price of all items in the cart
    getTotal: () => {
      const cart = get({ subscribe });
      
      return cart.reduce((total, item) => {
        // Calculate number of days
        const days = Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate rental cost
        const rentalCost = item.dailyPrice * days;
        
        // Add delivery fee and insurance cost if applicable
        const additionalFees = (item.deliveryFee || 0) + (item.insuranceCost || 0);
        
        return total + rentalCost + additionalFees;
      }, 0);
    },
    
    // Get the total security deposit amount
    getSecurityDepositTotal: () => {
      const cart = get({ subscribe });
      return cart.reduce((total, item) => total + item.securityDeposit, 0);
    },

    // Cleanup method for localStorage subscription
    destroy: () => {
      if (localStorageUnsubscribe) {
        localStorageUnsubscribe();
        localStorageUnsubscribe = null;
      }
    }
  };
};

export const cartStore = createCartStore();
