<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  
  export let isOpen = false;
  export let currentPath = '';
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  const handleClose = () => {
    dispatch('close');
  };
  
  const handleSignIn = () => {
    // Store the current path to redirect back after auth
    if (currentPath && currentPath !== '/') {
      sessionStorage.setItem('redirectAfterAuth', currentPath);
    }
    goto('/auth');
  };
  
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="auth-modal-title"
    aria-describedby="auth-modal-description"
  >
    <!-- Dark translucent backdrop -->
    <div class="absolute inset-0 bg-black bg-opacity-60"></div>
    
    <!-- Modal Panel -->
    <div
      class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto"
      transition:scale={{ duration: 200, easing: quintOut, start: 0.95 }}
    >
      <!-- Close Button -->
      <button
        type="button"
        class="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-1 transition-colors"
        on:click={handleClose}
        aria-label="Close modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Modal Content -->
      <div class="p-8">
        <!-- GearGrab Logo/Icon -->
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-2xl">G</span>
          </div>
        </div>
        
        <!-- Title -->
        <h2 id="auth-modal-title" class="text-2xl font-bold text-center text-neutral-900 mb-4">
          Sign In Required
        </h2>
        
        <!-- Description -->
        <p id="auth-modal-description" class="text-center text-neutral-600 mb-8 leading-relaxed">
          You need to be signed in to access this feature. Join the GearGrab community to buy and sell outdoor gear with confidence.
        </p>
        
        <!-- Benefits List -->
        <div class="mb-8">
          <ul class="space-y-3">
            <li class="flex items-center text-sm text-neutral-700">
              <svg class="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Buy and sell quality outdoor gear
            </li>
            <li class="flex items-center text-sm text-neutral-700">
              <svg class="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Connect with outdoor enthusiasts
            </li>
            <li class="flex items-center text-sm text-neutral-700">
              <svg class="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Secure transactions and messaging
            </li>
            <li class="flex items-center text-sm text-neutral-700">
              <svg class="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Track your gear listings and sales
            </li>
          </ul>
        </div>
        
        <!-- Action Buttons -->
        <div class="space-y-3">
          <button
            type="button"
            on:click={handleSignIn}
            class="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Sign In to Continue
          </button>
          
          <button
            type="button"
            on:click={handleClose}
            class="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
          >
            Browse as Guest
          </button>
        </div>
        
        <!-- Footer Text -->
        <p class="text-xs text-center text-neutral-500 mt-6">
          New to GearGrab? You can create an account on the sign-in page.
        </p>
      </div>
    </div>
  </div>
{/if}
