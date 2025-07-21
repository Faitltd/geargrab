<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import CategoryNav from '$lib/components/CategoryNav.svelte';
  import ProductGrid from '$lib/components/ProductGrid.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { onMount } from 'svelte';

  let scrollY = 0;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  // Sample featured products data
  const featuredProducts = [
    {
      id: '1',
      title: 'Premium 4-Season Tent',
      description: 'Lightweight yet durable tent perfect for all weather conditions. Sleeps 2 comfortably.',
      price: 45,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Seattle, WA',
      rating: 4.8,
      reviewCount: 24,
      owner: {
        name: 'Sarah M.',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'Camping',
      condition: 'Excellent',
      availability: 'available',
      featured: true
    },
    {
      id: '2',
      title: 'Professional Climbing Harness',
      description: 'High-quality climbing harness with adjustable leg loops and gear loops.',
      price: 25,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Boulder, CO',
      rating: 4.9,
      reviewCount: 18,
      owner: {
        name: 'Mike R.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'Climbing',
      condition: 'Like New',
      availability: 'available'
    },
    {
      id: '3',
      title: 'Mountain Bike - Full Suspension',
      description: 'High-performance mountain bike perfect for trail riding and downhill adventures.',
      price: 75,
      priceUnit: 'day',
      images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
      location: 'Moab, UT',
      rating: 4.7,
      reviewCount: 31,
      owner: {
        name: 'Alex K.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        verified: true
      },
      category: 'Cycling',
      condition: 'Good',
      availability: 'limited'
    }
  ];
</script>

<svelte:head>
  <title>GearGrab - Rent Premium Outdoor Gear from Trusted Locals</title>
  <meta name="description" content="Discover thousands of verified outdoor gear rentals. From camping and hiking to climbing and cycling - find the perfect equipment for your next adventure." />
  <meta name="keywords" content="outdoor gear rental, camping equipment, hiking gear, climbing gear, outdoor adventure, gear sharing" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="GearGrab - Rent Premium Outdoor Gear from Trusted Locals" />
  <meta property="og:description" content="Discover thousands of verified outdoor gear rentals for your next adventure." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://geargrab.com" />
  <meta property="og:image" content="https://geargrab.com/og-image.jpg" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="GearGrab - Rent Premium Outdoor Gear" />
  <meta name="twitter:description" content="Discover thousands of verified outdoor gear rentals for your next adventure." />
  <meta name="twitter:image" content="https://geargrab.com/twitter-image.jpg" />
</svelte:head>

<svelte:window bind:scrollY />

<!-- Header with Glass Effect -->
<div class="glass-nav fixed top-0 w-full z-50" class:shadow-lg={scrollY > 10}>
  <Header />
</div>

<!-- Main Content -->
<main class="pt-20">
  <!-- Simple Hero Section -->
  <section class="relative py-20 hero-gradient overflow-hidden">
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow-lg">
        Rent Premium Outdoor Gear
      </h1>
      <p class="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
        From trusted locals in your area
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a
          href="/auth/signin"
          class="bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:bg-primary-50 transition-colors duration-200 shadow-lg"
          data-cy="hero-get-started-button"
        >
          Get Started
        </a>
        <a
          href="/gear"
          class="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transition-colors duration-200"
          data-cy="hero-browse-gear-button"
        >
          Browse Gear
        </a>
      </div>
    </div>
  </section>
  
  <!-- Category Navigation -->
  <CategoryNav />
  
  <!-- Featured Gear -->
  <ProductGrid 
    title="Featured Gear Near You" 
    subtitle="Discover premium outdoor equipment from verified local owners. All gear is inspected and comes with our comprehensive protection guarantee."
    columns={4}
  />
  
  <!-- How It Works Section -->
  <section class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
          How GearGrab Works
        </h2>
        <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
          Getting the gear you need for your next adventure is simple, safe, and affordable.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Step 1 -->
        <div class="text-center">
          <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
          </div>
          <h3 class="text-xl font-bold text-neutral-900 mb-4">Find Your Gear</h3>
          <p class="text-neutral-600 leading-relaxed">
            Browse thousands of verified gear listings in your area. Filter by category, price, location, and availability to find exactly what you need.
          </p>
        </div>
        
        <!-- Step 2 -->
        <div class="text-center">
          <div class="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div class="w-12 h-12 bg-forest-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
          </div>
          <h3 class="text-xl font-bold text-neutral-900 mb-4">Book Securely</h3>
          <p class="text-neutral-600 leading-relaxed">
            Message the owner, check availability, and book instantly or request approval. All payments are processed securely with full protection coverage.
          </p>
        </div>
        
        <!-- Step 3 -->
        <div class="text-center">
          <div class="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div class="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
          </div>
          <h3 class="text-xl font-bold text-neutral-900 mb-4">Adventure Awaits</h3>
          <p class="text-neutral-600 leading-relaxed">
            Pick up your gear, enjoy your adventure, and return it clean and undamaged. Rate your experience and help build our trusted community.
          </p>
        </div>
      </div>
      
      <div class="text-center mt-12">
        <a
          href="/help"
          class="inline-flex items-center px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors duration-200"
        >
          Learn More About Our Process
          <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </div>
  </section>
  
  <!-- Trust & Safety Section -->
  <section class="py-16 bg-neutral-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
          Built on Trust & Safety
        </h2>
        <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
          Every rental is protected by our comprehensive safety measures and community standards.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-forest-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">Verified Members</h3>
          <p class="text-neutral-600 text-sm">ID verification and background checks for all community members</p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-mountain-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">Secure Payments</h3>
          <p class="text-neutral-600 text-sm">Protected transactions with escrow and full insurance coverage</p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">24/7 Support</h3>
          <p class="text-neutral-600 text-sm">Round-the-clock customer service and emergency assistance</p>
        </div>
        
        <div class="text-center">
          <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-neutral-900 mb-2">Community Driven</h3>
          <p class="text-neutral-600 text-sm">Built by outdoor enthusiasts, for outdoor enthusiasts</p>
        </div>
      </div>
    </div>
  </section>
</main>

<!-- Footer -->
<Footer />
