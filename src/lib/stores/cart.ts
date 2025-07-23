import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

function createCartStore() {
	const { subscribe, set, update } = writable<any[]>([]);

	// Load from localStorage on initialization
	if (browser) {
		const stored = localStorage.getItem('cart');
		if (stored) {
			try {
				set(JSON.parse(stored));
			} catch (e) {
				console.error('Error loading cart from localStorage:', e);
			}
		}
	}

	return {
		subscribe,
		addItem: (item: any) => {
			update(items => {
				// Check if item already exists
				const existingIndex = items.findIndex(existing => existing.id === item.id);
				if (existingIndex >= 0) {
					// Item already in cart, don't add duplicate
					return items;
				}
				const newItems = [...items, item];
				if (browser) {
					localStorage.setItem('cart', JSON.stringify(newItems));
				}
				return newItems;
			});
		},
		removeItem: (itemId: string) => {
			update(items => {
				const newItems = items.filter(item => item.id !== itemId);
				if (browser) {
					localStorage.setItem('cart', JSON.stringify(newItems));
				}
				return newItems;
			});
		},
		clear: () => {
			set([]);
			if (browser) {
				localStorage.removeItem('cart');
			}
		}
	};
}

export const cartStore = createCartStore();

// Derived store for cart count
export const cartCount = derived(cartStore, $cartStore => $cartStore.length);
