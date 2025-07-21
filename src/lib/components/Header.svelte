<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, cartItemCount } from '$lib/stores/cart';
  import { authStore } from '$lib/stores/auth.store';
  import ShoppingCart from './ui/ShoppingCart.svelte';

  let isMenuOpen = false;
  let isSearchOpen = false;
  let searchQuery = '';
  let isScrolled = false;
  let showProfileMenu = false;

  $: user = $authStore.data;

  onMount(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 10;
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
  };

  const toggleSearch = () => {
    isSearchOpen = !isSearchOpen;
  };

  const toggleCart = () => {
    cart.toggle();
  };

  const handleSearch = (e: Event) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to gear page with search query
      window.location.href = `/gear?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const categories = [
    { name: 'Camping & Hiking', href: '/gear?category=camping' },
    { name: 'Climbing', href: '/gear?category=climbing' },
    { name: 'Cycling', href: '/gear?category=cycling' },
    { name: 'Water Sports', href: '/gear?category=water-sports' },
    { name: 'Winter Sports', href: '/gear?category=winter-sports' },
    { name: 'Travel', href: '/gear?category=travel' },
    { name: 'All Gear', href: '/listings/browse' }
  ];
</script>

<!-- Main Header -->
<header class="sticky top-0 z-50 bg-white transition-all duration-200 {isScrolled ? 'shadow-lg' : ''}">
  <!-- Top Bar -->
  <div class="bg-primary-500 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-10 text-sm">
        <div class="flex items-center space-x-6">
          <a href="/stores" class="hover:text-primary-100 transition-colors">Find a Store</a>
          <a href="/help" class="hover:text-primary-100 transition-colors">Help</a>
        </div>
        <div class="flex items-center space-x-6">
          <a href="/membership" class="hover:text-primary-100 transition-colors">Join GearGrab</a>
          <a href="/auth/signin" class="hover:text-primary-100 transition-colors">Sign In</a>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Navigation -->
  <div class="bg-white border-b border-neutral-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <a href="/" class="flex items-center">
            <div class="text-2xl font-bold text-primary-500">GearGrab</div>
          </a>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-8">
          {#each categories as category}
            <a 
              href={category.href}
              class="text-neutral-700 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              {category.name}
            </a>
          {/each}
        </nav>

        <!-- Search Bar -->
        <div class="hidden md:flex items-center flex-1 max-w-lg mx-8">
          <form on:submit={handleSearch} class="w-full">
            <div class="relative">
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search for gear..."
                class="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- Mobile Search Toggle -->
          <button
            on:click={toggleSearch}
            class="md:hidden p-2 text-neutral-600 hover:text-primary-500 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <!-- Account / Profile -->
          {#if user}
            <div class="relative">
              <button
                on:click={() => showProfileMenu = !showProfileMenu}
                class="hidden sm:flex items-center space-x-2 text-neutral-700 hover:text-primary-500 transition-colors"
              >
                {#if user.photoURL}
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    class="w-8 h-8 rounded-full object-cover"
                  />
                {:else}
                  <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                {/if}
                <span class="text-sm font-medium">{user.displayName || 'Profile'}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Profile Dropdown -->
              {#if showProfileMenu}
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <a href={`/profile/${user.uid}`} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    View Profile
                  </a>
                  <a href="/profile/edit" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Edit Profile
                  </a>
                  <a href="/dashboard" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Dashboard
                  </a>
                  <a href="/profile/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Settings
                  </a>
                  <hr class="my-2" />
                  <button
                    on:click={() => {
                      showProfileMenu = false;
                      // Add sign out functionality here
                    }}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              {/if}
            </div>
          {:else}
            <a href="/auth/signin" class="hidden sm:flex items-center space-x-1 text-neutral-700 hover:text-primary-500 transition-colors">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm font-medium">Sign In</span>
            </a>
          {/if}

          <!-- Cart -->
          <button
            on:click={toggleCart}
            class="flex items-center space-x-1 text-neutral-700 hover:text-primary-500 transition-colors"
          >
            <div class="relative">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <!-- Cart Badge -->
              {#if $cartItemCount > 0}
                <span class="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-scale-in">
                  {$cartItemCount}
                </span>
              {/if}
            </div>
            <span class="hidden sm:block text-sm font-medium">Cart</span>
          </button>

          <!-- Mobile Menu Toggle -->
          <button
            on:click={toggleMenu}
            class="lg:hidden p-2 text-neutral-600 hover:text-primary-500 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {#if isMenuOpen}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              {:else}
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              {/if}
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Search Bar -->
  {#if isSearchOpen}
    <div class="md:hidden bg-white border-b border-neutral-200 px-4 py-3">
      <form on:submit={handleSearch}>
        <div class="relative">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search for gear..."
            class="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"

          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </form>
    </div>
  {/if}

  <!-- Mobile Menu -->
  {#if isMenuOpen}
    <div class="lg:hidden bg-white border-b border-neutral-200 animate-slide-down">
      <div class="px-4 py-3 space-y-3">
        {#each categories as category}
          <a
            href={category.href}
            class="flex items-center justify-between text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200 border-b border-neutral-100 last:border-b-0"
            on:click={() => isMenuOpen = false}
          >
            <span>{category.name}</span>
            <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        {/each}
        <div class="border-t border-neutral-200 pt-3 mt-3">
          {#if user}
            <a href={`/profile/${user.uid}`} class="flex items-center space-x-3 text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200">
              {#if user.photoURL}
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  class="w-5 h-5 rounded-full object-cover"
                />
              {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              {/if}
              <span>Profile</span>
            </a>
            <a href="/dashboard" class="flex items-center space-x-3 text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Dashboard</span>
            </a>
            <a href="/profile/settings" class="flex items-center space-x-3 text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </a>
          {:else}
            <a href="/auth/signin" class="flex items-center space-x-3 text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Sign In</span>
            </a>
          {/if}
          <a href="/help" class="flex items-center space-x-3 text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help</span>
          </a>
          <a href="/stores" class="flex items-center space-x-3 text-neutral-700 hover:text-primary-500 font-medium py-3 transition-colors duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Find a Store</span>
          </a>
        </div>
      </div>
    </div>
  {/if}
</header>

<!-- Shopping Cart Component -->
<ShoppingCart
  on:checkout={() => window.location.href = '/checkout'}
  on:close={() => cart.close()}
/>

<style>
  /* Ensure smooth transitions */
  header {
    transition: box-shadow 0.2s ease-in-out;
  }
</style>
