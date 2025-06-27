<script lang="ts">
  // Version: 5.0 - Updated to use auth subdomain
  import { simpleAuth } from '$lib/auth/simple-auth';
  import { smoothScrollWithNavOffset } from '$lib/utils/smooth-scroll';
  import { signOut } from '$lib/firebase/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { isCurrentUserAdmin } from '$lib/auth/admin';


  let isMenuOpen = false;
  let isDropdownOpen = false;
  let isAdmin = false;

  // Use simple auth system for testing
  $: authState = simpleAuth.authState;

  // Determine if we're on the homepage
  $: isHomepage = $page.url.pathname === '/';

  // Check for auth success on mount
  onMount(async () => {
    // Check if user returned from auth subdomain
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      // Check localStorage for auth data
      const authData = localStorage.getItem('geargrab_auth');
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          console.log('🎉 Auth success detected, updating auth state:', userData);

          // Update simple auth with the user data
          const result = await simpleAuth.handleAuthSubdomainReturn(userData);
          if (result.success) {
            console.log('✅ Auth subdomain return processed successfully');
          } else {
            console.error('❌ Auth subdomain return failed:', result.error);
          }

          // Clean up URL and localStorage
          localStorage.removeItem('geargrab_auth');
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch (error) {
          console.error('Error processing auth data:', error);
        }
      }
    }

    // Check admin status if user is logged in
    await simpleAuth.waitForAuthReady();
    if (simpleAuth.user) {
      try {
        isAdmin = await isCurrentUserAdmin();
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
  });

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function closeDropdown() {
    isDropdownOpen = false;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.dropdown-container')) {
      isDropdownOpen = false;
    }
  }

  function handleSmoothScroll(elementId: string) {
    smoothScrollWithNavOffset(elementId);
    // Close mobile menu if open
    if (isMenuOpen) {
      isMenuOpen = false;
    }
  }

  function handleMobileNavClick() {
    // Close mobile menu when any link is clicked
    isMenuOpen = false;
  }

  // Add smooth scroll for same-page navigation
  function handleNavClick(event: Event, href: string) {
    // Check if it's a same-page anchor link
    if (href.startsWith('#')) {
      event.preventDefault();
      const elementId = href.substring(1);
      handleSmoothScroll(elementId);
    }
  }

  // Handle authentication - NUCLEAR CACHE BUST v4.0.0 - Use new auth page
  function openLoginPopup() {
    console.log('🚀 v4.0.0 - NUCLEAR CACHE BUST - Using new auth page for login...');
    const currentUrl = encodeURIComponent(window.location.href);
    const authUrl = `/auth-v4?redirectTo=${currentUrl}&t=${Date.now()}`;
    console.log('🔗 Auth URL:', authUrl);
    goto(authUrl);
    // Close mobile menu if open
    if (isMenuOpen) {
      isMenuOpen = false;
    }
  }

  function openSignupPopup() {
    console.log('🚀 v4.0.0 - NUCLEAR CACHE BUST - Using new auth page for signup...');
    const currentUrl = encodeURIComponent(window.location.href);
    const authUrl = `/auth-v4?redirectTo=${currentUrl}&mode=signup&t=${Date.now()}`;
    console.log('🔗 Auth URL:', authUrl);
    goto(authUrl);
    // Close mobile menu if open
    if (isMenuOpen) {
      isMenuOpen = false;
    }
  }

  function handleAuthSuccess() {
    // Auth success is handled automatically by the auth system
    // Just close mobile menu if open
    if (isMenuOpen) {
      isMenuOpen = false;
    }
  }

  // Handle sign out
  let isSigningOut = false;

  async function handleSignOut() {
    if (isSigningOut) return; // Prevent multiple clicks

    isSigningOut = true;
    try {
      await signOut();

      // Close mobile menu if open
      if (isMenuOpen) {
        isMenuOpen = false;
      }

      // Navigate to home page
      await goto('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // You could add a notification here if you have a notification system
    } finally {
      isSigningOut = false;
    }
  }
</script>

<svelte:window on:click="{handleClickOutside}" />

<nav class="bg-black/20 backdrop-blur-md fixed top-0 left-0 right-0 w-full z-50 shadow-lg" aria-label="Main">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="flex items-center">
            <div class="bg-white rounded-full p-2 shadow-lg flex items-center justify-center">
              <img
                src="/geargrab-logo.png"
                alt="GearGrab"
                class="h-8 w-auto object-contain"
              />
            </div>
            <span class="ml-3 text-xl font-bold text-white">GearGrab</span>
          </a>
        </div>
        <!-- Desktop Navigation Dropdown -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center relative dropdown-container">
          <button
            on:click="{toggleDropdown}"
            class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
            aria-expanded="{isDropdownOpen}"
            aria-haspopup="true"
          >
            Menu
            <svg class="ml-1 h-4 w-4 transition-transform {isDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if isDropdownOpen}
            <!-- Dropdown Menu -->
            <div class="absolute top-full left-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50">
              <div class="py-2">
                <a href="/" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Home
                </a>
                <a href="/browse" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Browse
                </a>
                <a href="/list-gear" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  List Gear
                </a>
                <a href="/sell-gear" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Sell Gear
                </a>
                <a href="/browse-sales" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Browse Sales
                </a>
                <div class="border-t border-white/20 my-1"></div>
                <a href="/browse-guides" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Browse Guides
                </a>
                <a href="/become-guide" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Become a Guide
                </a>
                <a href="/how-it-works" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  How It Works
                </a>
                <div class="border-t border-white/20 my-1"></div>
                <a href="/blog" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Blog
                </a>
                <a href="/about" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  About
                </a>
                <a href="/contact" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Contact
                </a>
                <div class="border-t border-white/20 my-1"></div>
                <a href="/help" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  Help
                </a>
                <a href="/faq" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                  FAQ
                </a>
                {#if $authState.user && isAdmin}
                  <div class="border-t border-white/20 my-1"></div>
                  <a href="/admin" on:click="{closeDropdown}" class="block px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors font-medium">
                    🔧 Admin Console
                  </a>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        {#if $authState.user}
          <a href="/dashboard" class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Dashboard
          </a>
          {#if isAdmin}
            <a href="/admin" class="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium">
              Admin
            </a>
          {/if}
          <button
            on:click="{handleSignOut}"
            class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            disabled="{isSigningOut}"
            data-cy="logout"
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        {:else}
          <button
            on:click="{openLoginPopup}"
            class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Log In
          </button>
          <button
            on:click="{openSignupPopup}"
            class="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium ml-2 transition-colors"
          >
            Sign Up
          </button>
          <!-- Debug link for development -->
          {#if import.meta.env.DEV}
            <a href="/debug/auth" class="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md text-xs font-medium ml-2">
              🔍 Debug
            </a>
            <button
              on:click={() => simpleAuth.refreshAuth()}
              class="text-orange-400 hover:text-orange-300 px-3 py-2 rounded-md text-xs font-medium ml-2"
            >
              🔄 Refresh Auth
            </button>
          {/if}
        {/if}
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
          aria-expanded="{isMenuOpen}"
          aria-controls="mobile-menu"
          on:click="{toggleMenu}"
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
    <div id="mobile-menu" class="sm:hidden navbar-glass">
      <div class="pt-2 pb-3 space-y-1">
        <a href="/" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Home
        </a>
        <a href="/browse" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Browse
        </a>
        <a href="/list-gear" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          List Gear
        </a>
        <a href="/sell-gear" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Sell Gear
        </a>
        <a href="/browse-sales" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Browse Sales
        </a>
        <a href="/browse-guides" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Browse Guides
        </a>
        <a href="/become-guide" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Become a Guide
        </a>
        <a href="/how-it-works" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          How It Works
        </a>
        <a href="/blog" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Blog
        </a>
        <a href="/about" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          About
        </a>
        <a href="/contact" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Contact
        </a>
        <a href="/help" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Help
        </a>
        <a href="/faq" on:click="{handleMobileNavClick}" class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          FAQ
        </a>
      </div>
      <div class="pt-4 pb-3 border-t border-white/20">
        {#if $authState.user}
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-600">
                <span class="text-xl font-medium leading-none text-white">
                  {$authState.user.displayName?.[0] || $authState.user.email?.[0] || 'U'}
                </span>
              </span>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-white">{$authState.user.displayName || $authState.user.email}</div>
            </div>
          </div>
          <div class="mt-3 space-y-1">
            <a href="/dashboard" on:click="{handleMobileNavClick}" class="block px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10">
              Dashboard
            </a>
            {#if isAdmin}
              <a href="/admin" on:click="{handleMobileNavClick}" class="block px-4 py-2 text-base font-medium text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10">
                🔧 Admin Console
              </a>
            {/if}
            <button
              on:click="{handleSignOut}"
              class="block w-full text-left px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-50"
              disabled="{isSigningOut}"
              data-cy="logout"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        {:else}
          <div class="mt-3 space-y-1">
            <button
              on:click="{openLoginPopup}"
              class="block w-full text-left px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              Log In
            </button>
            <button
              on:click="{openSignupPopup}"
              class="block w-full text-left px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              Sign Up
            </button>
            <!-- Debug link for development -->
            {#if import.meta.env.DEV}
              <a href="/debug/auth" on:click="{handleMobileNavClick}" class="block px-4 py-2 text-base font-medium text-yellow-400 hover:text-yellow-300 hover:bg-white/10">
                🔍 Debug Auth
              </a>
              <button
                on:click={() => { simpleAuth.refreshAuth(); isMenuOpen = false; }}
                class="block w-full text-left px-4 py-2 text-base font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10 transition-colors"
              >
                🔄 Refresh Auth
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>

<!-- Auth now handled by dedicated /auth-new page -->

<style>
  .navbar-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Fallback for browsers that don't support backdrop-filter */
  @supports not (backdrop-filter: blur(12px)) {
    .navbar-glass {
      background: rgba(0, 0, 0, 0.1);
    }
  }
</style>
