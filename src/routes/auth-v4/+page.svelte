<script lang="ts">
  // NUCLEAR CACHE BUST - BRAND NEW AUTH PAGE v4.0.0 - SOCIAL ONLY
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { notifications } from '$lib/stores/notifications';

  let loading = false;
  let error = '';
  let mode: 'login' | 'signup' = 'login';

  // Get redirect URL and mode from query parameters
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/';
  $: {
    const urlMode = $page.url.searchParams.get('mode');
    if (urlMode === 'signup') {
      mode = 'signup';
    } else {
      mode = 'login';
    }
  }

  // Get auth state
  $: authState = simpleAuth.authState;

  // Check if user is already authenticated
  $: if ($authState.isAuthenticated && $authState.user) {
    goto(redirectTo);
  }

  async function handleSocialAuth(provider: 'google' | 'github' | 'apple') {
    loading = true;
    error = '';

    try {
      console.log(`🚀 Starting ${mode} with ${provider}...`);

      let result;
      switch (provider) {
        case 'google':
          result = await simpleAuth.signInWithGoogle();
          break;
        case 'github':
          result = await simpleAuth.signInWithGitHub();
          break;
        case 'apple':
          result = await simpleAuth.signInWithApple();
          break;
        default:
          throw new Error(`Provider ${provider} not yet configured.`);
      }
      console.log('🔐 Auth result:', result);

      if (result.success) {
        notifications.add({
          type: 'success',
          message: `Successfully ${mode === 'login' ? 'logged in' : 'signed up'}!`,
          timeout: 3000
        });

        // Wait for auth state to be confirmed
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200));

          if ($authState.isAuthenticated && $authState.user) {
            console.log('✅ Auth state confirmed, redirecting to:', redirectTo);
            await goto(redirectTo);
            return;
          }

          attempts++;
        }

        console.log('⚠️ Auth state not confirmed after max attempts, forcing redirect');
        window.location.href = redirectTo;
      } else {
        throw new Error(result.error || `${mode} failed`);
      }
    } catch (err: any) {
      console.error(`❌ ${mode} error:`, err);
      error = err.message || `${mode} failed`;
      notifications.add({
        type: 'error',
        message: error,
        timeout: 5000
      });
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    mode = mode === 'login' ? 'signup' : 'login';
    error = '';
  }
</script>

<svelte:head>
  <title>{mode === 'login' ? 'Log In' : 'Sign Up'} - GearGrab</title>
  <meta name="description" content="{mode === 'login' ? 'Log in to your GearGrab account' : 'Create your GearGrab account'} to rent outdoor gear or list your equipment for others to enjoy." />
  <!-- NUCLEAR CACHE BUST -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <meta name="cache-version" content="social-only-v4-20240622-0045" />
  <meta name="auth-version" content="nuclear-cache-bust-v4" />
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover" />
  </div>
  <div class="absolute inset-0 bg-black opacity-40"></div>
</div>

<!-- Page Content -->
<div class="relative z-30 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-32">
  <div class="max-w-md w-full space-y-8">
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p class="text-gray-300 mb-8">
          {mode === 'login' ? 'Sign in to your GearGrab account' : 'Join GearGrab and start your adventure'}
        </p>
      </div>

      <!-- Error display -->
      {#if error}
        <div class="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-red-400">{error}</p>
        </div>
      {/if}

      <!-- Social Auth Options -->
      <div class="space-y-3">
        <!-- Google Auth -->
        <button
          on:click={() => handleSocialAuth('google')}
          disabled={loading}
          class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? (mode === 'login' ? 'Signing in...' : 'Signing up...') : `Continue with Google`}
        </button>

        <!-- Apple Auth -->
        <button
          on:click={() => handleSocialAuth('apple')}
          disabled={loading}
          class="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {loading ? (mode === 'login' ? 'Signing in...' : 'Signing up...') : `Continue with Apple`}
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
          {loading ? (mode === 'login' ? 'Signing in...' : 'Signing up...') : `Continue with GitHub`}
        </button>

        <!-- Coming Soon Notice -->
        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <p class="text-sm text-blue-400 mb-2">🚀 Facebook coming soon!</p>
          <p class="text-xs text-gray-400">Facebook authentication will be available shortly.</p>
        </div>
      </div>

      <!-- Mode Toggle -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-400">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button 
            on:click={toggleMode}
            class="text-green-400 hover:text-green-300 underline font-medium ml-1"
          >
            {mode === 'login' ? 'Sign up here' : 'Sign in here'}
          </button>
        </p>
      </div>

      <!-- Cache Bust Indicator -->
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-500">
          🚀 Social-Only Auth v4.0.0 | Cache-Bust: 2024-06-22-00:45
        </p>
      </div>
    </div>
  </div>
</div>
