<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { signInWithGoogle, signInWithFacebook, signInWithTwitter, signInWithGithub } from '$firebase/auth';
  import { notificationsStore } from '$stores/notifications';

  let agreeTerms = false;
  let loading = false;
  let errors: Record<string, string> = {};

  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard';
  
  // Validate form
  function validateForm() {
    errors = {};
    let isValid = true;
    
    if (!displayName) {
      errors.displayName = 'Name is required';
      isValid = false;
    }
    
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(password)) {
      errors.password = 'Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number';
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
      isValid = false;
    }
    
    return isValid;
  }
  
  // Handle form submission
  async function handleSubmit() {
    if (!validateForm()) return;
    
    loading = true;
    errors = {};
    
    try {
      await signUpWithEmail(email, password, displayName);
      notificationsStore.success('Account created successfully!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        errors.email = 'This email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errors.email = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errors.password = 'Password is too weak';
      } else {
        errors.auth = error.message || 'An error occurred during signup';
      }
    } finally {
      loading = false;
    }
  }
  
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
      errors.auth = error.message || 'An error occurred during Google sign-in';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign Up - GearGrab</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-white/20">
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
    
    {#if errors.auth}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              {errors.auth}
            </h3>
          </div>
        </div>
      </div>
    {/if}
    
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="display-name" class="sr-only">Full name</label>
          <input 
            id="display-name" 
            name="name" 
            type="text" 
            autocomplete="name" 
            required 
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
            placeholder="Full name"
            bind:value={displayName}
          />
          {#if errors.displayName}
            <p class="mt-1 text-sm text-red-600">{errors.displayName}</p>
          {/if}
        </div>
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input 
            id="email-address" 
            name="email" 
            type="email" 
            autocomplete="email" 
            required 
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
            placeholder="Email address"
            bind:value={email}
          />
          {#if errors.email}
            <p class="mt-1 text-sm text-red-600">{errors.email}</p>
          {/if}
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            autocomplete="new-password" 
            required 
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
            placeholder="Password"
            bind:value={password}
          />
          {#if errors.password}
            <p class="mt-1 text-sm text-red-600">{errors.password}</p>
          {/if}
        </div>
        <div>
          <label for="confirm-password" class="sr-only">Confirm password</label>
          <input 
            id="confirm-password" 
            name="confirm-password" 
            type="password" 
            autocomplete="new-password" 
            required 
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
            placeholder="Confirm password"
            bind:value={confirmPassword}
          />
          {#if errors.confirmPassword}
            <p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          {/if}
        </div>
      </div>

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

      <div>
        <button 
          type="submit" 
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={loading}
        >
          {#if loading}
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Creating account...
          {:else}
            Sign up
          {/if}
        </button>
      </div>
    </form>
    
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-50 text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      <div class="mt-6">
        <button 
          type="button" 
          class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          on:click={handleGoogleSignIn}
          disabled={loading}
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Google
        </button>
      </div>
    </div>
  </div>
</div>
