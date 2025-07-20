<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import AuthForm from '$lib/components/auth/AuthForm.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  $: user = $authStore.data;

  // Redirect if already authenticated
  $: if (user) {
    goto('/dashboard');
  }

  function handleAuthSuccess(event: CustomEvent) {
    const { user } = event.detail;
    if (user) {
      goto('/dashboard');
    }
  }
</script>

<svelte:head>
  <title>Sign In - GearGrab</title>
  <meta name="description" content="Sign in to your GearGrab account to access your gear listings and bookings." />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50 flex items-center justify-center py-12">
  <div class="w-full max-w-md" data-cy="signin-page">
    <AuthForm on:success={handleAuthSuccess} />

    <!-- Additional signin-specific content -->
    <div class="mt-8 text-center">
      <p class="text-gray-600 mb-4">
        Don't have an account?
        <a
          href="/auth/signup"
          data-cy="signup-link"
          class="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
        >
          Sign up here
        </a>
      </p>

      <p class="text-sm text-gray-500">
        Need help?
        <a
          href="/contact"
          data-cy="contact-link"
          class="text-primary-600 hover:text-primary-700 transition-colors duration-200"
        >
          Contact support
        </a>
      </p>
    </div>
  </div>
</main>

<Footer />
