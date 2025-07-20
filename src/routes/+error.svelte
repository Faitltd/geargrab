<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  $: status = $page.status;
  $: message = $page.error?.message || 'Something went wrong';

  function getErrorTitle(status: number): string {
    switch (status) {
      case 404:
        return 'Page Not Found';
      case 403:
        return 'Access Forbidden';
      case 500:
        return 'Server Error';
      default:
        return 'Oops! Something went wrong';
    }
  }

  function getErrorDescription(status: number): string {
    switch (status) {
      case 404:
        return "The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.";
      case 403:
        return "You don't have permission to access this page. Please check your credentials or contact support.";
      case 500:
        return "We're experiencing technical difficulties. Our team has been notified and is working to fix the issue.";
      default:
        return "We encountered an unexpected error. Please try again or contact support if the problem persists.";
    }
  }

  function handleGoHome() {
    goto('/');
  }

  function handleGoBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      goto('/');
    }
  }
</script>

<svelte:head>
  <title>{getErrorTitle(status)} - GearGrab</title>
  <meta name="description" content="Error page for GearGrab" />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50 flex items-center justify-center py-12">
  <div class="max-w-md mx-auto px-4 text-center">
    <!-- Error Icon -->
    <div class="mb-8">
      {#if status === 404}
        <svg class="w-24 h-24 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      {:else if status === 403}
        <svg class="w-24 h-24 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      {:else if status === 500}
        <svg class="w-24 h-24 text-orange-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      {:else}
        <svg class="w-24 h-24 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {/if}
    </div>

    <!-- Error Content -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        {#if status === 404}
          404
        {:else}
          {status}
        {/if}
      </h1>
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
        {getErrorTitle(status)}
      </h2>
      <p class="text-gray-600 leading-relaxed">
        {getErrorDescription(status)}
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-4">
      <div class="w-full">
        <Button variant="primary" size="lg" fullWidth={true} on:click={handleGoHome}>
          Go to Homepage
        </Button>
      </div>
      
      <div class="w-full">
        <Button variant="secondary" size="lg" fullWidth={true} on:click={handleGoBack}>
          Go Back
        </Button>
      </div>
    </div>

    <!-- Additional Help -->
    <div class="mt-8 pt-8 border-t border-gray-200">
      <p class="text-sm text-gray-500 mb-4">
        Still having trouble? We're here to help!
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/contact" 
          class="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          Contact Support
        </a>
        <a 
          href="/help" 
          class="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          Help Center
        </a>
        <a 
          href="/listings" 
          class="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          Browse Gear
        </a>
      </div>
    </div>
  </div>
</main>

<Footer />
