<script lang="ts">

  
  let email = '';
  let isSubscribed = false;

  const handleNewsletterSubmit = (e: Event) => {
    e.preventDefault();
    if (email.trim()) {
      // Handle newsletter subscription
      console.log('Newsletter subscription:', email);
      isSubscribed = true;
      email = '';
      
      // Reset after 3 seconds
      setTimeout(() => {
        isSubscribed = false;
      }, 3000);
    }
  };

  const footerLinks = {
    company: [
      { name: 'About GearGrab', href: '/about' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Safety & Trust', href: '/safety-trust' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Blog', href: '/blog' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Community Guidelines', href: '/community-guidelines' },
      { name: 'Insurance & Protection', href: '/insurance' },
      { name: 'Dispute Resolution', href: '/disputes' },
      { name: 'Accessibility', href: '/accessibility' }
    ],
    gear: [
      { name: 'Browse All Gear', href: '/gear' },
      { name: 'List Your Gear', href: '/listings/new' },
      { name: 'Gear Categories', href: '/categories' },
      { name: 'Popular Locations', href: '/search' },
      { name: 'Gear Guides', href: '/help' },
      { name: 'Rental Tips', href: '/help' }
    ],
    legal: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Rental Agreement', href: '/rental-agreement' },
      { name: 'Cancellation Policy', href: '/cancellation' },
      { name: 'Prohibited Items', href: '/prohibited-items' }
    ]
  };

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com/geargrab', icon: 'facebook' },
    { name: 'Instagram', href: 'https://instagram.com/geargrab', icon: 'instagram' },
    { name: 'Twitter', href: 'https://twitter.com/geargrab', icon: 'twitter' },
    { name: 'YouTube', href: 'https://youtube.com/geargrab', icon: 'youtube' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/geargrab', icon: 'linkedin' }
  ];
</script>

<footer class="bg-neutral-900 text-white">
  <!-- Newsletter Section -->
  <div class="bg-primary-600">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-white mb-4">
          Stay Connected with the Outdoor Community
        </h3>
        <p class="text-primary-100 mb-8 max-w-2xl mx-auto">
          Get the latest gear recommendations, adventure stories, and exclusive deals delivered to your inbox.
        </p>
        
        <form on:submit={handleNewsletterSubmit} class="max-w-md mx-auto">
          <div class="flex gap-3">
            <input
              type="email"
              bind:value={email}
              placeholder="Enter your email address"
              required
              class="flex-1 px-4 py-3 rounded-lg text-neutral-900 placeholder-neutral-500 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button
              type="submit"
              class="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors duration-200 whitespace-nowrap"
            >
              {isSubscribed ? '✓ Subscribed!' : 'Subscribe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Main Footer Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
      <!-- Brand Section -->
      <div class="lg:col-span-1">
        <div class="flex items-center mb-6">
          <a href="/" class="text-2xl font-bold text-white hover:text-primary-300 transition-colors">GearGrab</a>
        </div>
        <p class="text-neutral-300 mb-6 leading-relaxed">
          The trusted marketplace for outdoor gear rentals. Connect with fellow adventurers and access premium equipment for your next expedition.
        </p>
        
        <!-- App Download Links -->
        <div class="space-y-3">
          <a href="/app/ios" class="flex items-center space-x-3 text-neutral-300 hover:text-white transition-colors">
            <div class="w-8 h-8 bg-neutral-700 rounded flex items-center justify-center">
              📱
            </div>
            <span class="text-sm">Download iOS App</span>
          </a>
          <a href="/app/android" class="flex items-center space-x-3 text-neutral-300 hover:text-white transition-colors">
            <div class="w-8 h-8 bg-neutral-700 rounded flex items-center justify-center">
              🤖
            </div>
            <span class="text-sm">Download Android App</span>
          </a>
        </div>
      </div>

      <!-- Company Links -->
      <div>
        <h4 class="text-lg font-semibold text-white mb-6">Company</h4>
        <ul class="space-y-3">
          {#each footerLinks.company as link}
            <li>
              <a href={link.href} class="text-neutral-300 hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Support Links -->
      <div>
        <h4 class="text-lg font-semibold text-white mb-6">Support</h4>
        <ul class="space-y-3">
          {#each footerLinks.support as link}
            <li>
              <a href={link.href} class="text-neutral-300 hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Gear Links -->
      <div>
        <h4 class="text-lg font-semibold text-white mb-6">Gear</h4>
        <ul class="space-y-3">
          {#each footerLinks.gear as link}
            <li>
              <a href={link.href} class="text-neutral-300 hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Legal Links -->
      <div>
        <h4 class="text-lg font-semibold text-white mb-6">Legal</h4>
        <ul class="space-y-3">
          {#each footerLinks.legal as link}
            <li>
              <a href={link.href} class="text-neutral-300 hover:text-white transition-colors duration-200">
                {link.name}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- Trust & Safety Section -->
    <div class="mt-16 pt-8 border-t border-neutral-700">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="flex flex-col items-center">
          <div class="w-16 h-16 bg-forest-500 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h5 class="text-lg font-semibold text-white mb-2">Verified Community</h5>
          <p class="text-neutral-300 text-sm">All members are ID verified and background checked</p>
        </div>
        
        <div class="flex flex-col items-center">
          <div class="w-16 h-16 bg-mountain-500 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h5 class="text-lg font-semibold text-white mb-2">Secure Payments</h5>
          <p class="text-neutral-300 text-sm">Protected transactions with full insurance coverage</p>
        </div>
        
        <div class="flex flex-col items-center">
          <div class="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h5 class="text-lg font-semibold text-white mb-2">24/7 Support</h5>
          <p class="text-neutral-300 text-sm">Round-the-clock customer service and emergency assistance</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="border-t border-neutral-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row items-center justify-between">
        <!-- Copyright -->
        <div class="text-neutral-400 text-sm mb-4 md:mb-0">
          © 2024 GearGrab, Inc. All rights reserved. Adventure starts here. Gear up responsibly.
        </div>

        <!-- Social Links -->
        <div class="flex items-center space-x-6">
          {#each socialLinks as social}
            <a 
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              class="text-neutral-400 hover:text-white transition-colors duration-200"
              aria-label={social.name}
            >
              {#if social.icon === 'facebook'}
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              {:else if social.icon === 'instagram'}
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                </svg>
              {:else if social.icon === 'twitter'}
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              {:else if social.icon === 'youtube'}
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              {:else if social.icon === 'linkedin'}
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
</footer>
