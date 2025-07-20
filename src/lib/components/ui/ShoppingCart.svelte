<script lang="ts">
  import { cart, cartItemCount, cartTotal, formatPrice } from '$lib/stores/cart';
  import GlassCard from './GlassCard.svelte';
  import ModernButton from './ModernButton.svelte';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    checkout: void;
    close: void;
  }>();
  
  let isAnimating = false;
  
  const handleRemoveItem = (itemId: string) => {
    isAnimating = true;
    setTimeout(() => {
      cart.removeItem(itemId);
      isAnimating = false;
    }, 200);
  };
  
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    cart.updateQuantity(itemId, quantity);
  };
  
  const handleCheckout = () => {
    dispatch('checkout');
    cart.close();
  };
  
  const handleClose = () => {
    dispatch('close');
    cart.close();
  };
  
  $: isEmpty = $cart.items.length === 0;
</script>

<!-- Cart Overlay -->
{#if $cart.isOpen}
  <div 
    class="fixed inset-0 z-50 overflow-hidden"
    class:animate-fade-in={$cart.isOpen}
  >
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
      on:click={handleClose}
    ></div>
    
    <!-- Cart Panel -->
    <div class="absolute right-0 top-0 h-full w-full max-w-md">
      <GlassCard variant="default" padding={false} class="h-full flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-neutral-200">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-semibold text-neutral-900">Shopping Cart</h2>
            {#if $cartItemCount > 0}
              <span class="bg-primary-500 text-white text-sm font-medium px-2 py-1 rounded-full">
                {$cartItemCount}
              </span>
            {/if}
          </div>
          
          <button
            on:click={handleClose}
            class="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            aria-label="Close cart"
          >
            <svg class="h-6 w-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-6">
          {#if isEmpty}
            <!-- Empty State -->
            <div class="text-center py-12">
              <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="h-10 w-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-neutral-900 mb-2">Your cart is empty</h3>
              <p class="text-neutral-600 mb-6">Add some gear to get started!</p>
              <ModernButton variant="primary" on:click={handleClose}>
                Continue Shopping
              </ModernButton>
            </div>
          {:else}
            <!-- Cart Items List -->
            <div class="space-y-4">
              {#each $cart.items as item (item.id)}
                <div 
                  class="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 transition-all duration-300"
                  class:animate-scale-in={!isAnimating}
                  class:animate-fade-out={isAnimating}
                >
                  <div class="flex gap-4">
                    <!-- Product Image -->
                    <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        class="w-full h-full object-cover"
                      />
                    </div>
                    
                    <!-- Product Details -->
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-neutral-900 truncate mb-1">
                        {item.title}
                      </h4>
                      <p class="text-sm text-neutral-600 mb-2">
                        {item.location} • {item.condition}
                      </p>
                      
                      <!-- Rental Dates -->
                      <div class="text-xs text-neutral-500 mb-2">
                        {new Date(item.rentalDates.startDate).toLocaleDateString()} - 
                        {new Date(item.rentalDates.endDate).toLocaleDateString()}
                        ({item.rentalDates.days} days)
                      </div>
                      
                      <!-- Price & Quantity -->
                      <div class="flex items-center justify-between">
                        <div class="text-sm font-medium text-neutral-900">
                          {formatPrice(item.price * item.rentalDates.days * item.quantity)}
                        </div>
                        
                        <!-- Quantity Controls -->
                        <div class="flex items-center gap-2">
                          <button
                            on:click={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            class="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors duration-200"
                            disabled={item.quantity <= 1}
                          >
                            <svg class="h-4 w-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <span class="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          
                          <button
                            on:click={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            class="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors duration-200"
                          >
                            <svg class="h-4 w-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Remove Button -->
                    <button
                      on:click={() => handleRemoveItem(item.id)}
                      class="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200 flex-shrink-0"
                      aria-label="Remove item"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Footer with Total & Checkout -->
        {#if !isEmpty}
          <div class="border-t border-neutral-200 p-6 space-y-4">
            <!-- Total -->
            <div class="flex items-center justify-between text-lg font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatPrice($cartTotal)}</span>
            </div>
            
            <!-- Checkout Button -->
            <ModernButton 
              variant="primary" 
              size="lg" 
              fullWidth={true}
              on:click={handleCheckout}
            >
              Proceed to Checkout
            </ModernButton>
            
            <!-- Continue Shopping -->
            <ModernButton 
              variant="ghost" 
              size="md" 
              fullWidth={true}
              on:click={handleClose}
            >
              Continue Shopping
            </ModernButton>
          </div>
        {/if}
      </GlassCard>
    </div>
  </div>
{/if}

<style>
  .animate-fade-out {
    animation: fadeOut 0.2s ease-out forwards;
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
</style>
