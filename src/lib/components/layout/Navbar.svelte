<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { smoothScrollWithNavOffset } from '$lib/utils/smoothScroll';
  import { signOut } from '$lib/firebase/auth';
  import { goto } from '$app/navigation';

  let isMenuOpen = false;

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
  let signOutButtonText = 'Sign Out [JS LOADED]';
  let debugInfo = 'Script loaded at: ' + new Date().toLocaleTimeString();

  async function handleSignOut() {
    console.log('handleSignOut called');
    signOutButtonText = 'CLICKED!'; // Visual feedback
    try {
      console.log('Calling signOut...');
      await signOut();
      console.log('signOut completed successfully');
      signOutButtonText = 'SUCCESS!';
      // Close mobile menu if open
      if (isMenuOpen) {
        isMenuOpen = false;
      }
      // Redirect to home page
      setTimeout(() => goto('/'), 1000);
    } catch (error) {
      console.error('Error signing out:', error);
      signOutButtonText = 'ERROR!';
      setTimeout(() => signOutButtonText = 'Sign Out', 2000);
    }
  }
</script>

<nav class="bg-black/20 backdrop-blur-sm fixed w-full z-50" aria-label="Main">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-white font-bold text-xl">GearGrab</a>
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
          <button on:click={handleSignOut} class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            {signOutButtonText}
          </button>
        {:else}
          <a href="/auth/login" class="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Log In
          </a>
          <a href="/auth/signup" class="bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium ml-2">
            Sign Up
          </a>
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
    <div id="mobile-menu" class="sm:hidden bg-black/20 backdrop-blur-sm">
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
            <button on:click={handleSignOut} class="block w-full text-left px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10">
              {signOutButtonText}
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
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>
