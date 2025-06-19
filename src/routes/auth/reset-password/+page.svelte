<script lang="ts">
  import { goto } from '$app/navigation';
  import { resetPassword } from '$firebase/auth';
  import { notifications } from '$stores/notifications';
  import { isValidEmail } from '$utils/validation';

  let email = '';
  let loading = false;
  let errors: Record<string, string> = {};
  let success = false;

  // Validate form
  function validateForm(): boolean {
    errors = {};

    if (!email) {
      errors.email = 'Email is required';
      return false;
    }

    if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
      return false;
    }

    return true;
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm()) return;

    loading = true;
    errors = {};

    try {
      await resetPassword(email);
      success = true;
      notifications.add({
        type: 'success',
        message: 'Password reset email sent! Check your inbox.',
        timeout: 5000
      });
    } catch (error: any) {
      console.error('Password reset error:', error);

      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        errors.email = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errors.email = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errors.auth = 'Too many requests. Please try again later.';
      } else {
        errors.auth = error.message || 'An error occurred while sending the reset email';
      }
    } finally {
      loading = false;
    }
  }

  // Go back to login
  function goToLogin() {
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Reset Password - GearGrab</title>
  <meta name="description" content="Reset your GearGrab account password. Enter your email to receive a password reset link." />
</svelte:head>

<!-- Full screen background with outdoor theme -->
<div class="min-h-screen relative">
  <!-- Background Image -->
  <div
    class="absolute inset-0 bg-cover bg-center"
    style="background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80');"
  ></div>
  <div class="absolute inset-0 bg-black opacity-60"></div>

  <!-- Content -->
  <div class="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Reset Password Card -->
      <div class="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-8">
        <div>
          <div class="flex justify-center mb-6">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>

          {#if success}
            <h1 class="text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h1>
            <p class="mt-2 text-center text-sm text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p class="mt-2 text-center text-sm text-gray-600">
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </p>
          {:else}
            <h1 class="text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h1>
            <p class="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          {/if}

          <p class="mt-4 text-center text-sm text-gray-600">
            Remember your password?
            <button
              type="button"
              on:click="{goToLogin}"
              class="font-medium text-green-600 hover:text-green-500"
            >
              Back to login
            </button>
          </p>
        </div>

        {#if errors.auth}
          <div class="mt-4 rounded-md bg-red-50 p-4">
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

        {#if success}
          <div class="mt-6">
            <button
              type="button"
              class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              on:click="{goToLogin}"
            >
              Back to Login
            </button>
          </div>

          <div class="mt-4">
            <button
              type="button"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              on:click={() => handleSubmit()}
              disabled="{loading}"
            >
              Resend email
            </button>
          </div>
        {:else}
          <form class="mt-8 space-y-6" on:submit|preventDefault="{handleSubmit}">
            <div>
              <label for="email-address" class="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                bind:value="{email}"
              />
              {#if errors.email}
                <p class="mt-1 text-sm text-red-600">{errors.email}</p>
              {/if}
            </div>

            <div>
              <button
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled="{loading}"
              >
                {#if loading}
                  <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Sending...
                {:else}
                  Send reset link
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
</div>
