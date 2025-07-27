<script>
  import { goto } from '$app/navigation';
  import SocialLogin from '../../../lib/components/auth/SocialLogin.svelte';

  let error = null;

  // Handle successful social signup
  function handleSocialSuccess(event) {
    const { provider, user } = event.detail;
    console.log(`Successfully signed up with ${provider}:`, user);
    goto('/dashboard');
  }

  // Handle social signup error
  function handleSocialError(event) {
    const { provider, error: socialError } = event.detail;
    console.error(`${provider} sign-up error:`, socialError);
    error = socialError;
  }
</script>

<svelte:head>
  <title>Sign Up - GearGrab</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
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

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p class="text-red-800 text-sm">{error}</p>
      </div>
    {/if}

    <!-- Social Login Component -->
    <div class="mt-6">
      <SocialLogin
        showTitle={false}
        layout="list"
        buttonSize="default"
        on:success={handleSocialSuccess}
        on:error={handleSocialError}
      />
    </div>
  </div>
</div>
