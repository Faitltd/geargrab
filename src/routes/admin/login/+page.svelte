<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';
  import { onMount } from 'svelte';

  let loading = false;
  let error = '';
  let debugInfo = null;

  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/admin';

  // Get auth state
  $: authState = simpleAuth.authState;

  // Check if user is already authenticated
  $: if ($authState.isAuthenticated && $authState.user) {
    goto(redirectTo);
  }

  onMount(async () => {
    // Check current auth status
    try {
      const response = await fetch('/api/debug/auth-status');
      debugInfo = await response.json();
    } catch (err) {
      console.error('Failed to get auth status:', err);
    }
  });

  async function handleSocialAuth(provider: 'google' | 'github' | 'facebook') {
    loading = true;
    error = '';

    try {
      console.log(`🚀 Starting admin login with ${provider}...`);

      let result;
      switch (provider) {
        case 'google':
          result = await simpleAuth.signInWithGoogle();
          break;
        case 'github':
          result = await simpleAuth.signInWithGitHub();
          break;
        case 'facebook':
          result = await simpleAuth.signInWithFacebook();
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      if (result?.user) {
        notifications.add({
          type: 'success',
          message: `Successfully signed in with ${provider}!`,
          timeout: 3000
        });

        // Wait a moment for auth state to update
        setTimeout(() => {
          goto(redirectTo);
        }, 1000);
      }
    } catch (err: any) {
      console.error(`${provider} auth error:`, err);
      error = err.message || `Failed to sign in with ${provider}`;
      
      notifications.add({
        type: 'error',
        message: error,
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function switchToMainAuth() {
    goto(`/auth-v4?mode=login&redirectTo=${encodeURIComponent(redirectTo)}`);
  }
</script>

<svelte:head>
  <title>Admin Login - GearGrab</title>
  <meta name="description" content="Admin login for GearGrab platform" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
        <span class="text-2xl">🔐</span>
      </div>
      <h1 class="text-3xl font-bold text-white mb-2">Admin Login</h1>
      <p class="text-gray-400">Sign in to access the GearGrab admin panel</p>
    </div>

    <!-- Auth Status Debug Info -->
    {#if debugInfo}
      <div class="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 class="text-sm font-medium text-white mb-2">🔍 Authentication Status</h3>
        <div class="text-xs text-gray-300 space-y-1">
          <div>Session Cookie: {debugInfo.authStatus?.hasSessionCookie ? '✅ Present' : '❌ Missing'}</div>
          <div>User ID: {debugInfo.authStatus?.localsUserId || '❌ None'}</div>
          <div>Firebase Admin: {debugInfo.authStatus?.firebaseAdminAvailable ? '✅ Available' : '❌ Unavailable'}</div>
          <div>Admin Status: {debugInfo.adminStatus?.exists ? '✅ Admin User' : '❌ Not Admin'}</div>
        </div>
      </div>
    {/if}

    <!-- Error Message -->
    {#if error}
      <div class="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
        <p class="text-red-300 text-sm">{error}</p>
      </div>
    {/if}

    <!-- Social Login Options -->
    <div class="space-y-4 mb-6">
      <!-- Google Auth -->
      <button
        on:click={() => handleSocialAuth('google')}
        disabled={loading}
        class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-gray-200"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>

      <!-- GitHub Auth -->
      <button
        on:click={() => handleSocialAuth('github')}
        disabled={loading}
        class="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with GitHub'}
      </button>

      <!-- Facebook Auth -->
      <button
        on:click={() => handleSocialAuth('facebook')}
        disabled={loading}
        class="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Facebook'}
      </button>
    </div>

    <!-- Alternative Login -->
    <div class="text-center">
      <button
        on:click={switchToMainAuth}
        class="text-green-400 hover:text-green-300 text-sm underline"
      >
        Use main authentication page
      </button>
    </div>

    <!-- Admin Info -->
    <div class="mt-8 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
      <h4 class="text-sm font-medium text-blue-300 mb-2">👤 Admin Access Required</h4>
      <p class="text-xs text-blue-200">
        Only authorized admin users can access this panel. Your account must be configured with admin privileges.
      </p>
    </div>
  </div>
</div>
