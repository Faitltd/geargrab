<script lang="ts">
  // Version: 2.0 - Fixed sign out button text
  import { authStore } from '$lib/stores/auth';
  import { smoothScrollWithNavOffset } from '$lib/utils/smoothScroll';
  import { signOut } from '$lib/firebase/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let isMenuOpen = false;
  
  // Determine if we're on the homepage
  $: isHomepage = $page.url.pathname === '/';

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
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
          </a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a href="/" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Home
          </a>
          <a href="/browse" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Browse
          </a>
          <a href="/list-gear" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            List Gear
          </a>
          <a href="/how-it-works" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            How It Works
          </a>
          <a href="/blog" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Blog
          </a>
          <a href="/about" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            About
          </a>
          <a href="/contact" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Contact
          </a>
          <a href="/help" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            Help
          </a>
          <a href="/faq" class="border-transparent text-white/90 hover:text-white hover:border-white/30 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
            FAQ
          </a>
        </div>
      </div>
      <div class="hidden sm:ml-6 sm:flex sm:items-center">
        {#if $authStore.user}
          <a href="/dashboard" class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Dashboard
          </a>
          <button 
            on:click={handleSignOut} 
            class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        {:else}
          <a href="/auth/login" class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Log In
          </a>
          <a href="/auth/signup" class="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium ml-2">
            Sign Up
          </a>
          <!-- Debug link for development -->
          {#if import.meta.env.DEV}
            <a href="/debug/auth" class="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md text-xs font-medium ml-2">
              🔍 Debug
            </a>
          {/if}
        {/if}
      </div>
      <div class="-mr-2 flex items-center sm:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
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
    <div id="mobile-menu" class="sm:hidden navbar-glass">
      <div class="pt-2 pb-3 space-y-1">
        <a href="/" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Home
        </a>
        <a href="/browse" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Browse
        </a>
        <a href="/list-gear" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          List Gear
        </a>
        <a href="/how-it-works" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          How It Works
        </a>
        <a href="/blog" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Blog
        </a>
        <a href="/about" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          About
        </a>
        <a href="/contact" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Contact
        </a>
        <a href="/help" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          Help
        </a>
        <a href="/faq" on:click={handleMobileNavClick} class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-white/30 hover:text-white">
          FAQ
        </a>
      </div>
      <div class="pt-4 pb-3 border-t border-white/20">
        {#if $authStore.user}
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-600">
                <span class="text-xl font-medium leading-none text-white">
                  {$authStore.user.displayName?.[0] || $authStore.user.email?.[0] || 'U'}
                </span>
              </span>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-white">{$authStore.user.displayName || $authStore.user.email}</div>
            </div>
          </div>
          <div class="mt-3 space-y-1">
            <a href="/dashboard" on:click={handleMobileNavClick} class="block px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10">
              Dashboard
            </a>
            <button 
              on:click={handleSignOut} 
              class="block w-full text-left px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-50"
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        {:else}
          <div class="mt-3 space-y-1">
            <a href="/auth/login" on:click={handleMobileNavClick} class="block px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10">
              Log In
            </a>
            <a href="/auth/signup" on:click={handleMobileNavClick} class="block px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10">
              Sign Up
            </a>
            <!-- Debug link for development -->
            {#if import.meta.env.DEV}
              <a href="/debug/auth" on:click={handleMobileNavClick} class="block px-4 py-2 text-base font-medium text-yellow-400 hover:text-yellow-300 hover:bg-white/10">
                🔍 Debug Auth
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>

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
