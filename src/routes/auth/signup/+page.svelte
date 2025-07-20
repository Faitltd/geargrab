<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import AuthForm from '$lib/components/auth/AuthForm.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { goto } from '$app/navigation';

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
  <title>Sign Up - GearGrab</title>
  <meta name="description" content="Join GearGrab to start buying and selling outdoor gear with fellow enthusiasts." />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50 flex items-center justify-center py-12">
  <div class="w-full max-w-md" data-cy="signup-page">
    <AuthForm on:success={handleAuthSuccess} />

    <!-- Terms and Privacy -->
    <div class="mt-8">
      <div class="bg-gray-100 rounded-lg p-6 text-center">
        <p class="text-sm text-gray-600 mb-4">
          By creating an account, you agree to our
          <a
            href="/terms"
            data-cy="terms-link"
            class="text-primary-600 hover:text-primary-700 transition-colors duration-200"
            target="_blank"
          >
            Terms of Service
          </a>
          and
          <a
            href="/privacy"
            data-cy="privacy-link"
            class="text-primary-600 hover:text-primary-700 transition-colors duration-200"
            target="_blank"
          >
            Privacy Policy
          </a>
        </p>

        <p class="text-sm text-gray-500">
          Already have an account?
          <a
            href="/auth/signin"
            data-cy="signin-link"
            class="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
          >
            Sign in here
          </a>
        </p>
      </div>
    </div>
  </div>
</main>

<Footer />
