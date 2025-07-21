<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.store';

  export let title: string = 'Dashboard';
  export let description: string = '';

  // Navigation items
  const navItems = [
    {
      href: '/dashboard/renter',
      label: 'My Rentals',
      icon: 'M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 9a2 2 0 002 2h8a2 2 0 002-2l-2-9m-6 0h6'
    },
    {
      href: '/dashboard/owner',
      label: 'My Listings',
      icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
    },
    {
      href: '/dashboard/sales',
      label: 'Sales Dashboard',
      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      href: '/dashboard/messages',
      label: 'Messages',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    }
  ];

  $: currentPath = $page.url.pathname;
  $: user = $authStore.user;
</script>

<div class="min-h-screen bg-neutral-50">
  <!-- Mobile Header -->
  <div class="lg:hidden bg-white shadow-sm border-b border-neutral-200">
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-neutral-900">{title}</h1>
          {#if description}
            <p class="text-sm text-neutral-600">{description}</p>
          {/if}
        </div>
        
        <!-- Mobile Menu Button -->
        <button
          class="p-2 rounded-lg hover:bg-neutral-100"
          aria-label="Open mobile menu"
        >
          <svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div class="lg:flex">
    <!-- Sidebar -->
    <div class="hidden lg:flex lg:flex-shrink-0">
      <div class="flex flex-col w-64">
        <div class="flex flex-col flex-grow bg-white border-r border-neutral-200 pt-5 pb-4 overflow-y-auto">
          <!-- User Info -->
          <div class="flex items-center flex-shrink-0 px-4 mb-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-primary-700">
                  {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p class="text-xs text-neutral-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-2 space-y-1">
            {#each navItems as item}
              <a
                href={item.href}
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors {
                  currentPath === item.href || currentPath.startsWith(item.href + '/')
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }"
              >
                <svg
                  class="mr-3 flex-shrink-0 h-5 w-5 {
                    currentPath === item.href || currentPath.startsWith(item.href + '/')
                      ? 'text-primary-500'
                      : 'text-neutral-400 group-hover:text-neutral-500'
                  }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                </svg>
                {item.label}
              </a>
            {/each}
          </nav>

          <!-- Quick Actions -->
          <div class="flex-shrink-0 px-2 py-4 border-t border-neutral-200">
            <a
              href="/listings/new"
              class="group flex items-center px-2 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
            >
              <svg class="mr-3 flex-shrink-0 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Listing
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Desktop Header -->
      <div class="hidden lg:block bg-white shadow-sm border-b border-neutral-200">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-neutral-900">{title}</h1>
              {#if description}
                <p class="text-neutral-600 mt-1">{description}</p>
              {/if}
            </div>
            
            <slot name="header-actions" />
          </div>
        </div>
      </div>

      <!-- Page Content -->
      <main class="flex-1 relative overflow-y-auto focus:outline-none">
        <slot />
      </main>
    </div>
  </div>
</div>
