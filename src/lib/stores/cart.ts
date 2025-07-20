import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  image: string;
  owner: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  location: string;
  category: string;
  condition: string;
  rentalDates: {
    startDate: string;
    endDate: string;
    days: number;
  };
  quantity: number;
  addedAt: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

// Create the cart store
function createCartStore() {
  const initialState: CartState = {
    items: [],
    isOpen: false
  };

  // Load from localStorage if in browser
  const storedCart = browser ? localStorage.getItem('geargrab-cart') : null;
  const initialCart = storedCart ? JSON.parse(storedCart) : initialState;

  const { subscribe, set, update } = writable<CartState>(initialCart);

  // Save to localStorage whenever cart changes
  if (browser) {
    subscribe((cart) => {
      localStorage.setItem('geargrab-cart', JSON.stringify(cart));
    });
  }

  return {
    subscribe,
    
    // Add item to cart
    addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => {
      update(cart => {
        const existingItemIndex = cart.items.findIndex(
          cartItem => cartItem.productId === item.productId &&
          cartItem.rentalDates.startDate === item.rentalDates.startDate &&
          cartItem.rentalDates.endDate === item.rentalDates.endDate
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item already exists
          cart.items[existingItemIndex].quantity += item.quantity;
        } else {
          // Add new item
          const newItem: CartItem = {
            ...item,
            id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            addedAt: new Date().toISOString()
          };
          cart.items.push(newItem);
        }

        return cart;
      });
    },

    // Remove item from cart
    removeItem: (itemId: string) => {
      update(cart => ({
        ...cart,
        items: cart.items.filter(item => item.id !== itemId)
      }));
    },

    // Update item quantity
    updateQuantity: (itemId: string, quantity: number) => {
      update(cart => {
        const itemIndex = cart.items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
          } else {
            cart.items[itemIndex].quantity = quantity;
          }
        }
        return cart;
      });
    },

    // Clear cart
    clear: () => {
      update(cart => ({
        ...cart,
        items: []
      }));
    },

    // Toggle cart visibility
    toggle: () => {
      update(cart => ({
        ...cart,
        isOpen: !cart.isOpen
      }));
    },

    // Open cart
    open: () => {
      update(cart => ({
        ...cart,
        isOpen: true
      }));
    },

    // Close cart
    close: () => {
      update(cart => ({
        ...cart,
        isOpen: false
      }));
    }
  };
}

export const cart = createCartStore();

// Derived stores for computed values
export const cartItemCount = derived(cart, $cart => 
  $cart.items.reduce((total, item) => total + item.quantity, 0)
);

export const cartTotal = derived(cart, $cart => 
  $cart.items.reduce((total, item) => total + (item.price * item.rentalDates.days * item.quantity), 0)
);

export const cartSubtotal = derived(cart, $cart => 
  $cart.items.reduce((total, item) => total + (item.price * item.rentalDates.days * item.quantity), 0)
);

export const cartTax = derived(cartSubtotal, $subtotal => $subtotal * 0.08); // 8% tax

export const cartServiceFee = derived(cartSubtotal, $subtotal => $subtotal * 0.05); // 5% service fee

export const cartGrandTotal = derived(
  [cartSubtotal, cartTax, cartServiceFee], 
  ([$subtotal, $tax, $serviceFee]) => $subtotal + $tax + $serviceFee
);

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

export const calculateRentalDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // Minimum 1 day
};
