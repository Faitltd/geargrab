<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    signInWithGoogle,
    signInWithFacebook,
    signInWithGitHub,
    signInWithApple,
    signInWithTwitter,
    signInWithMicrosoft,
    signInWithYahoo
  } from '$firebase/auth';
  import { notificationsStore } from '$stores/notifications';

  let agreeTerms = false;
  let loading = false;
  let errors: Record<string, string> = {};

  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';

  // Handle Google sign-in
  async function handleGoogleSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithGoogle();
      notificationsStore.success('Account created successfully with Google!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      errors.google = error.message || 'An error occurred during Google sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle Facebook sign-in
  async function handleFacebookSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithFacebook();
      notificationsStore.success('Account created successfully with Facebook!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      errors.facebook = error.message || 'An error occurred during Facebook sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle GitHub sign-in
  async function handleGitHubSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithGitHub();
      notificationsStore.success('Account created successfully with GitHub!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('GitHub sign-in error:', error);
      errors.github = error.message || 'An error occurred during GitHub sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle Apple sign-in
  async function handleAppleSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithApple();
      notificationsStore.success('Account created successfully with Apple!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      errors.apple = error.message || 'An error occurred during Apple sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle Twitter sign-in
  async function handleTwitterSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithTwitter();
      notificationsStore.success('Account created successfully with Twitter!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Twitter sign-in error:', error);
      errors.twitter = error.message || 'An error occurred during Twitter sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle Microsoft sign-in
  async function handleMicrosoftSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithMicrosoft();
      notificationsStore.success('Account created successfully with Microsoft!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Microsoft sign-in error:', error);
      errors.microsoft = error.message || 'An error occurred during Microsoft sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle Yahoo sign-in
  async function handleYahooSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithYahoo();
      notificationsStore.success('Account created successfully with Yahoo!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Yahoo sign-in error:', error);
      errors.yahoo = error.message || 'An error occurred during Yahoo sign-in';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up - GearGrab</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h1 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h1>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or
        <a href="/auth/login" class="font-medium text-green-600 hover:text-green-500">
          sign in to your existing account
        </a>
      </p>
    </div>
    
    <!-- Error messages for each provider -->
    {#if errors.google}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Google: {errors.google}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    {#if errors.facebook}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Facebook: {errors.facebook}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    {#if errors.github}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              GitHub: {errors.github}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    {#if errors.apple}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Apple: {errors.apple}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    {#if errors.twitter}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Twitter: {errors.twitter}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    {#if errors.microsoft}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Microsoft: {errors.microsoft}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    {#if errors.yahoo}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Yahoo: {errors.yahoo}
            </h3>
          </div>
        </div>
      </div>
    {/if}

    <!-- Terms Agreement -->
    <div class="mt-8">
      <div class="flex items-center">
        <input
          id="agree-terms"
          name="agree-terms"
          type="checkbox"
          class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          bind:checked={agreeTerms}
        />
        <label for="agree-terms" class="ml-2 block text-sm text-gray-900">
          I agree to the
          <a href="/terms" class="text-green-600 hover:text-green-500">Terms of Service</a>
          and
          <a href="/privacy" class="text-green-600 hover:text-green-500">Privacy Policy</a>
        </label>
      </div>
      {#if errors.agreeTerms}
        <p class="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>
      {/if}
    </div>

    <!-- Social Sign-in Buttons -->
    <div class="mt-6 space-y-4">
      <!-- Google Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleGoogleSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
          </g>
        </svg>
        Continue with Google
      </button>

      <!-- Facebook Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleFacebookSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Continue with Facebook
      </button>

      <!-- GitHub Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleGitHubSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#181717" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Continue with GitHub
      </button>

      <!-- Apple Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleAppleSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#000000" viewBox="0 0 24 24">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
        </svg>
        Continue with Apple
      </button>

      <!-- Twitter Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleTwitterSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#1DA1F2" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        Continue with Twitter
      </button>

      <!-- Microsoft Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleMicrosoftSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#00A4EF" viewBox="0 0 24 24">
          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
        </svg>
        Continue with Microsoft
      </button>

      <!-- Yahoo Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleYahooSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#6001D2" viewBox="0 0 24 24">
          <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm5.5 18.5h-3l-2.5-4-2.5 4h-3l4-6.5-3.5-6h3l2 3.5 2-3.5h3l-3.5 6 4 6.5z"/>
        </svg>
        Continue with Yahoo
      </button>
    </div>
  </div>
</div>
