<script lang="ts">
  import { onMount } from 'svelte';
  import { createAuthGuard } from '$lib/auth/auth-guard-hook';
  import { notifications } from '$lib/stores/notifications';

  export let redirectTo: string | undefined = undefined;
  export let requireAuth: boolean = true;
  export let showLoadingSpinner: boolean = true;
  export let loadingMessage: string = 'Checking authentication...';
  export let unauthorizedMessage: string = 'You must be signed in to access this page.';

  let authGuard: ReturnType<typeof createAuthGuard>;
  let authState = {
    isAuthenticated: false,
    isLoading: true,
    checkComplete: false,
    user: null,
    error: null
  };

  onMount(async () => {
    console.log('🔐 Protected Route: Initializing auth guard...');
    
    authGuard = createAuthGuard({
      redirectTo,
      requireAuth,
      onAuthSuccess: () => {
        console.log('✅ Protected Route: Authentication successful');
        notifications.add({
          type: 'success',
          message: 'Welcome back!',
          timeout: 3000
        });
      },
      onAuthFailure: () => {
        console.log('❌ Protected Route: Authentication failed');
        if (requireAuth) {
          notifications.add({
            type: 'error',
            message: unauthorizedMessage,
            timeout: 5000
          });
        }
      }
    });

    // Initialize auth check
    authState = await authGuard.initialize();
  });

  // Reactive statement to update auth state
  $: if (authGuard) {
    authState = authGuard.getStatus();
  }
</script>

{#if authState.isLoading && showLoadingSpinner}
  <!-- Loading State -->
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center shadow-lg">
      <div class="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <h3 class="text-xl font-semibold text-white mb-2">Loading</h3>
      <p class="text-gray-300">{loadingMessage}</p>
    </div>
  </div>
{:else if authState.isAuthenticated && authState.checkComplete}
  <!-- Authenticated - Show Content -->
  <slot user={authState.user} />
{:else if !requireAuth}
  <!-- Auth not required - Show Content -->
  <slot user={authState.user} />
{:else}
  <!-- Not Authenticated - Show Error -->
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center shadow-lg max-w-md">
      <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">Access Denied</h3>
      <p class="text-gray-300 mb-6">{unauthorizedMessage}</p>
      
      <div class="space-y-4">
        <a
          href="/auth/login"
          class="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Sign In to Continue
        </a>
        
        <p class="text-sm text-gray-400">
          Don't have an account?
          <a href="/auth/signup" class="text-green-400 hover:text-green-300 underline font-medium">
            Sign up here
          </a>
        </p>
      </div>
      
      <div class="mt-6 pt-6 border-t border-white/10">
        <h4 class="text-sm font-medium text-white mb-2">Why do I need to sign in?</h4>
        <ul class="text-xs text-gray-400 space-y-1 text-left">
          <li>• Secure rental agreements and accountability</li>
          <li>• Track your rental history and returns</li>
          <li>• Receive important updates about your rentals</li>
          <li>• Access customer support for your orders</li>
        </ul>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure smooth transitions */
  :global(.auth-transition) {
    transition: opacity 0.3s ease-in-out;
  }
</style>
