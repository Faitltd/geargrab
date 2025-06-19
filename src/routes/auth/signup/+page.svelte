<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    signInWithGoogle,
    signInWithFacebook,
    signInWithInstagram,
    signInWithX
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

  // Handle Instagram sign-in
  async function handleInstagramSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithInstagram();
      notificationsStore.success('Account created successfully with Instagram!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Instagram sign-in error:', error);
      errors.instagram = error.message || 'An error occurred during Instagram sign-in';
    } finally {
      loading = false;
    }
  }

  // Handle X sign-in
  async function handleXSignIn() {
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      return;
    }

    loading = true;
    errors = {};

    try {
      await signInWithX();
      notificationsStore.success('Account created successfully with X!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('X sign-in error:', error);
      errors.x = error.message || 'An error occurred during X sign-in';
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

    {#if errors.instagram}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Instagram: {errors.instagram}
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



    {#if errors.x}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              X: {errors.x}
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

      <!-- Instagram Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleInstagramSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#E1306C" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.31 3.608.059 1.266.071 1.645.071 4.848 0 3.204-.012 3.584-.07 4.85-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.31-1.266.059-1.645.071-4.85.071-3.204 0-3.584-.012-4.85-.07-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.31-3.608C2.175 15.584 2.163 15.204 2.163 12c0-3.204.012-3.584.07-4.85.062-1.366.336-2.633 1.311-3.608C4.519 2.499 5.786 2.225 7.152 2.163 8.418 2.104 8.798 2.092 12 2.092zm0-2.163C8.741 0 8.332.014 7.052.072 5.782.13 4.63.443 3.677 1.396 2.724 2.349 2.411 3.501 2.353 4.771 2.295 6.051 2.281 6.459 2.281 12c0 5.541.014 5.949.072 7.229.058 1.27.371 2.422 1.324 3.375.953.953 2.105 1.266 3.375 1.324 1.28.058 1.689.072 7.229.072s5.949-.014 7.229-.072c1.27-.058 2.422-.371 3.375-1.324.953-.953 1.266-2.105 1.324-3.375.058-1.28.072-1.689.072-7.229s-.014-5.949-.072-7.229c-.058-1.27-.371-2.422-1.324-3.375C20.422.443 19.27.13 18 .072 16.72.014 16.311 0 12 0z"/>
        </svg>
        Continue with Instagram
      </button>

      <!-- X Sign-in -->
      <button
        type="button"
        class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        on:click={handleXSignIn}
        disabled={loading}
      >
        <svg class="h-5 w-5 mr-3" fill="#000000" viewBox="0 0 24 24">
          <path d="M22.46 0h-3.64L9.29 14.73 7.82 12.1V0H3.54v24h3.64l9.63-14.73 1.47 2.63V24h3.63z" />
        </svg>
        Continue with X
      </button>
    </div>
  </div>
</div>
