<script lang="ts">
  import { user, isAuthenticated, signOut } from '../../stores/auth.js';
  import LoginPopup from '../auth/LoginPopup.svelte';

  let isMenuOpen = false;
  let showLoginPopup = false;
  let loginPopupTitle = "Sign in to continue";
  let loginPopupMessage = "Please sign in to access this feature";

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function handleProtectedAction(event, actionName) {
    event.preventDefault();

    if (!$isAuthenticated) {
      // Show login popup with appropriate message
      if (actionName === 'list-gear') {
        loginPopupTitle = "Sign in to List Gear";
        loginPopupMessage = "Please sign in to start listing your outdoor gear for rent";
      } else if (actionName === 'my-rentals') {
        loginPopupTitle = "Sign in to View Rentals";
        loginPopupMessage = "Please sign in to view and manage your rentals";
      }
      showLoginPopup = true;
    } else {
      // User is authenticated, navigate to the page
      if (actionName === 'list-gear') {
        window.location.href = '/list-gear';
      } else if (actionName === 'my-rentals') {
        window.location.href = '/my-rentals';
      }
    }
  }

  function handleLoginSuccess() {
    showLoginPopup = false;
    // The user will be redirected by the auth system
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }
</script>

<nav class="backdrop-blur-sm bg-white/10 border-b border-white/20" role="navigation" aria-label="Main">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="bg-white/90 backdrop-blur-sm text-green-600 font-bold text-lg px-4 py-2 rounded-xl shadow-lg border border-white/30 h-10 flex items-center">GearGrab</a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-4 items-center">
          <a href="/browse" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10">
            Browse
          </a>
          <button
            on:click={(e) => handleProtectedAction(e, 'list-gear')}
            class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10"
          >
            List Gear
          </button>
          <button
            on:click={(e) => handleProtectedAction(e, 'my-rentals')}
            class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10"
          >
            My Rentals
          </button>
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
        {#if $isAuthenticated}
          <a href="/dashboard" class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center">
            Dashboard
          </a>
          <button
            on:click={handleSignOut}
            class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center"
          >
            Sign Out
          </button>
        {:else}
          <button
            on:click={() => showLoginPopup = true}
            class="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 hover:text-gray-900 px-3 py-2 rounded-xl text-sm font-medium shadow-md border border-white/30 transition-all h-10 flex items-center"
          >
            Log In
          </button>
          <a href="/auth/signup" class="bg-green-600/90 backdrop-blur-sm text-white hover:bg-green-700/90 px-3 py-2 rounded-xl text-sm font-medium shadow-lg border border-green-500/30 transition-all h-10 flex items-center">
            Sign Up
          </a>
        {/if}
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <button
          type="button"
          class="bg-white/80 backdrop-blur-sm inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 shadow-md border border-white/30 transition-all"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          on:click={toggleMenu}
        >
          <span class="sr-only">Open main menu</span>
          <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  {#if isMenuOpen}
    <div id="mobile-menu" class="sm:hidden backdrop-blur-sm bg-white/10 border-t border-white/20">
      <div class="pt-2 pb-3 space-y-2 px-3">
        <a href="/browse" class="bg-white/80 backdrop-blur-sm block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900 shadow-md border border-white/30 transition-all">
          Browse
        </a>
        <button
          on:click={(e) => handleProtectedAction(e, 'list-gear')}
          class="bg-white/80 backdrop-blur-sm block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900 shadow-md border border-white/30 transition-all"
        >
          List Gear
        </button>
        <button
          on:click={(e) => handleProtectedAction(e, 'my-rentals')}
          class="bg-white/80 backdrop-blur-sm block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900 shadow-md border border-white/30 transition-all"
        >
          My Rentals
        </button>
      </div>
      <div class="pt-4 pb-3 border-t border-white/20 px-3">
        {#if $isAuthenticated}
          <div class="flex items-center px-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/30 py-3">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-green-600">
                <span class="text-xl font-medium leading-none text-white">
                  {$user?.displayName?.[0] || $user?.email?.[0] || 'U'}
                </span>
              </span>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800">{$user?.displayName || $user?.email}</div>
            </div>
          </div>
          <div class="mt-3 space-y-2">
            <a href="/dashboard" class="bg-white/80 backdrop-blur-sm block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900 shadow-md border border-white/30 transition-all">
              Dashboard
            </a>
            <button
              on:click={handleSignOut}
              class="bg-white/80 backdrop-blur-sm block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900 shadow-md border border-white/30 transition-all"
            >
              Sign out
            </button>
          </div>
        {:else}
          <div class="mt-3 space-y-2">
            <button
              on:click={() => showLoginPopup = true}
              class="bg-white/80 backdrop-blur-sm block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900 shadow-md border border-white/30 transition-all"
            >
              Log In
            </button>
            <a href="/auth/signup" class="bg-green-600/90 backdrop-blur-sm block px-3 py-2 rounded-xl text-base font-medium text-white hover:bg-green-700/90 shadow-lg border border-green-500/30 transition-all">
              Sign Up
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>

<!-- Login Popup -->
<LoginPopup
  bind:isOpen={showLoginPopup}
  title={loginPopupTitle}
  message={loginPopupMessage}
  on:success={handleLoginSuccess}
  on:close={() => showLoginPopup = false}
/>
