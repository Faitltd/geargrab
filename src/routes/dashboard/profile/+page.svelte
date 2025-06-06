<script lang="ts">
  // Sample user data
  let user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'Salt Lake City, UT',
    bio: 'Outdoor enthusiast who loves hiking, camping, and mountain biking.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    verified: true,
    memberSince: 'January 2024'
  };

  let editing = false;
</script>

<svelte:head>
  <title>Profile - GearGrab</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Profile Settings</h1>
        <p class="text-gray-300 mt-1">Manage your account information and preferences</p>
      </div>
      <button
        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        on:click={() => editing = !editing}
      >
        {editing ? 'Save Changes' : 'Edit Profile'}
      </button>
    </div>
  </div>

  <!-- Profile Overview -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
    <div class="flex items-center space-x-6">
      <div class="flex-shrink-0">
        <img class="h-24 w-24 rounded-full border-4 border-white/20" src={user.avatar} alt={user.name} />
      </div>
      <div class="flex-1">
        <div class="flex items-center space-x-2">
          <h2 class="text-2xl font-bold text-white">{user.name}</h2>
          {#if user.verified}
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <span class="text-green-400 text-sm font-medium ml-1">Verified</span>
            </div>
          {/if}
        </div>
        <p class="text-gray-300">{user.email}</p>
        <p class="text-gray-400 text-sm">Member since {user.memberSince}</p>
      </div>
    </div>
  </div>

  <!-- Profile Details -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Personal Information</h2>
    </div>
    <div class="p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          {#if editing}
            <input
              type="text"
              bind:value={user.name}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.name}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
          {#if editing}
            <input
              type="email"
              bind:value={user.email}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.email}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Phone</label>
          {#if editing}
            <input
              type="tel"
              bind:value={user.phone}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.phone}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Location</label>
          {#if editing}
            <input
              type="text"
              bind:value={user.location}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <p class="text-white">{user.location}</p>
          {/if}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Bio</label>
        {#if editing}
          <textarea
            bind:value={user.bio}
            rows="4"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          ></textarea>
        {:else}
          <p class="text-white">{user.bio}</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Account Settings -->
  <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
    <div class="px-6 py-4 border-b border-white/20">
      <h2 class="text-lg font-medium text-white">Account Settings</h2>
    </div>
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-white font-medium">Email Notifications</h3>
          <p class="text-gray-300 text-sm">Receive notifications about bookings and messages</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked class="sr-only peer">
          <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-white font-medium">SMS Notifications</h3>
          <p class="text-gray-300 text-sm">Receive text messages for urgent updates</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>
    </div>
  </div>
</div>
