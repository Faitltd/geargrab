<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let redirectTo: string = '/auth/login';
  export let message: string = 'You must be signed in to access this feature.';
  export let showLoginPrompt: boolean = true;

  $: isAuthenticated = !!$authStore.user;
  $: isLoading = $authStore.loading;

  function handleLogin() {
    // Include current page URL as redirect parameter
    const currentUrl = $page.url.pathname + $page.url.search;
    const loginUrl = new URL(redirectTo, window.location.origin);
    loginUrl.searchParams.set('redirect', currentUrl);
    goto(loginUrl.toString());
  }
</script>

{#if isLoading}
  <!-- Loading state -->
  <div class="flex items-center justify-center p-8">
    <div class="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
    <span class="ml-3 text-gray-300">Checking authentication...</span>
  </div>
{:else if isAuthenticated}
  <!-- User is authenticated - show content -->
  <slot />
{:else}
  <!-- User is not authenticated - show login prompt -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 text-center">
    <div class="mb-6">
      <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">Sign In Required</h3>
      <p class="text-gray-300 mb-6">{message}</p>
    </div>

    {#if showLoginPrompt}
      <div class="space-y-4">
        <button
          on:click={handleLogin}
          class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Sign In to Continue
        </button>
        
        <p class="text-sm text-gray-400">
          Don't have an account? 
          <a href="/auth/signup" class="text-green-400 hover:text-green-300 underline">
            Sign up here
          </a>
        </p>
      </div>
    {/if}

    <div class="mt-6 pt-6 border-t border-white/10">
      <h4 class="text-sm font-medium text-white mb-2">Why do I need to sign in?</h4>
      <ul class="text-xs text-gray-400 space-y-1">
        <li>• Secure rental agreements and accountability</li>
        <li>• Track your rental history and returns</li>
        <li>• Receive important updates about your rentals</li>
        <li>• Access customer support for your orders</li>
      </ul>
    </div>
  </div>
{/if}
