<script lang="ts">
  import HoverCard from '$lib/components/interactive/HoverCard.svelte';
  import ServiceCard from '$lib/components/interactive/ServiceCard.svelte';
  import GeometricBackground from '$lib/components/layout/GeometricBackground.svelte';
  import ContactSection from '$lib/components/forms/ContactSection.svelte';
  import { smoothScrollWithNavOffset } from '$lib/utils/smoothScroll';

  // Sample gear data for demo
  const sampleGear = [
    {
      imageSrc: '/pexels-josh-hild-1270765-2422265.jpg',
      title: 'Professional Camping Tent',
      subtitle: 'By Outdoor Gear Co | Available Now',
      description: 'High-quality 4-person tent perfect for all weather conditions. Includes rain fly and footprint.'
    },
    {
      imageSrc: '/pexels-eric-dekker-3334048.jpg',
      title: 'Mountain Hiking Backpack',
      subtitle: 'By Adventure Gear | Available Now',
      description: 'Spacious 65L backpack with multiple compartments and hydration system compatibility.'
    },
    {
      imageSrc: '/pexels-harshit-nandu-1286798-2873086.jpg',
      title: 'Portable Camping Stove',
      subtitle: 'By Camp Chef | Available Now',
      description: 'Lightweight and efficient camping stove with wind-resistant design and easy ignition.'
    }
  ];

  const services = [
    {
      icon: 'fas fa-mountain',
      title: 'Outdoor Adventures',
      description: 'Discover amazing outdoor gear for hiking, camping, and mountain adventures.'
    },
    {
      icon: 'fas fa-camera',
      title: 'Photography Gear',
      description: 'Professional cameras and equipment for capturing your outdoor experiences.'
    },
    {
      icon: 'fas fa-bicycle',
      title: 'Cycling Equipment',
      description: 'Bikes, helmets, and accessories for all your cycling adventures.'
    }
  ];

  function handleContactSubmit(event: CustomEvent) {
    console.log('Contact form submitted:', event.detail);
    alert('Thank you for your message! We\'ll get back to you soon.');
  }

  function scrollToSection(sectionId: string) {
    smoothScrollWithNavOffset(sectionId);
  }
</script>

<svelte:head>
  <title>Components Demo - GearGrab</title>
  <meta name="description" content="Demo page showcasing enhanced components adapted from EZGear" />
  <!-- Font Awesome for icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Navigation Demo -->
  <div class="bg-white shadow-sm border-b sticky top-16 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-center space-x-8 py-4">
        <button 
          on:click={() => scrollToSection('hover-cards')}
          class="text-gray-600 hover:text-green-600 font-medium transition-colors"
        >
          Hover Cards
        </button>
        <button 
          on:click={() => scrollToSection('service-cards')}
          class="text-gray-600 hover:text-green-600 font-medium transition-colors"
        >
          Service Cards
        </button>
        <button 
          on:click={() => scrollToSection('geometric-bg')}
          class="text-gray-600 hover:text-green-600 font-medium transition-colors"
        >
          Geometric Backgrounds
        </button>
        <button 
          on:click={() => scrollToSection('contact-section')}
          class="text-gray-600 hover:text-green-600 font-medium transition-colors"
        >
          Contact Section
        </button>
      </div>
    </div>
  </div>

  <!-- Hero Section -->
  <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">Enhanced Components Demo</h1>
      <p class="text-xl md:text-2xl opacity-90">
        Showcasing components adapted from EZGear with GearGrab styling
      </p>
    </div>
  </div>

  <!-- Hover Cards Section -->
  <section id="hover-cards" class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Enhanced Hover Cards</h2>
        <p class="text-lg text-gray-600">Interactive cards with smooth hover animations</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each sampleGear as gear}
          <HoverCard
            imageSrc={gear.imageSrc}
            imageAlt={gear.title}
            title={gear.title}
            subtitle={gear.subtitle}
            description={gear.description}
            href="/browse"
          />
        {/each}
      </div>
    </div>
  </section>

  <!-- Service Cards Section -->
  <section id="service-cards" class="py-16 bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-white mb-4">Service Cards</h2>
        <p class="text-lg text-gray-300">Glassmorphism-style service cards with icons</p>
      </div>
      
      <div class="flex flex-wrap justify-center gap-6">
        {#each services as service}
          <ServiceCard
            icon={service.icon}
            title={service.title}
            description={service.description}
            on:click={() => console.log(`Clicked: ${service.title}`)}
          />
        {/each}
      </div>
    </div>
  </section>

  <!-- Geometric Backgrounds Section -->
  <section id="geometric-bg" class="py-16">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-4">Geometric Backgrounds</h2>
      <p class="text-lg text-gray-600">Various geometric background patterns</p>
    </div>

    <div class="space-y-8">
      <!-- Skewed Background -->
      <GeometricBackground variant="skewed" color="#10b981" opacity={0.1} height="300px">
        <div class="text-center text-gray-900">
          <h3 class="text-2xl font-bold mb-2">Skewed Background</h3>
          <p class="text-lg">Perfect for hero sections and dynamic layouts</p>
        </div>
      </GeometricBackground>

      <!-- Mountain Background -->
      <GeometricBackground variant="mountain" color="#059669" opacity={0.15} height="300px">
        <div class="text-center text-gray-900">
          <h3 class="text-2xl font-bold mb-2">Mountain Background</h3>
          <p class="text-lg">Great for outdoor and adventure themes</p>
        </div>
      </GeometricBackground>

      <!-- Wave Background -->
      <GeometricBackground variant="wave" color="#0d9488" opacity={0.2} height="300px">
        <div class="text-center text-gray-900">
          <h3 class="text-2xl font-bold mb-2">Wave Background</h3>
          <p class="text-lg">Smooth flowing design for modern layouts</p>
        </div>
      </GeometricBackground>

      <!-- Egg Background -->
      <GeometricBackground variant="egg" color="#FBDF7E" opacity={0.3} height="300px">
        <div class="text-center text-gray-900">
          <h3 class="text-2xl font-bold mb-2">Egg Background</h3>
          <p class="text-lg">Unique organic shape for creative designs</p>
        </div>
      </GeometricBackground>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="contact-section">
    <ContactSection
      title="Contact Information"
      subtitle="Get in Touch"
      description="Experience our enhanced contact form with improved styling and functionality."
      contactInfo={{
        address: {
          line1: '1234 Mountain View Drive',
          line2: 'Boulder, CO 80302'
        },
        phone: {
          primary: '(555) 123-4567',
          secondary: '(555) 987-6543'
        },
        email: {
          primary: 'hello@geargrab.com',
          secondary: 'support@geargrab.com'
        }
      }}
      on:submit={handleContactSubmit}
    />
  </section>

  <!-- Implementation Notes -->
  <section class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Implementation Notes</h2>
        <p class="text-lg text-gray-600">Key features adapted from EZGear</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <div class="text-green-600 mb-4">
            <i class="fas fa-mouse-pointer text-2xl"></i>
          </div>
          <h3 class="font-semibold mb-2">Smooth Hover Effects</h3>
          <p class="text-sm text-gray-600">Enhanced hover animations with elevation changes and image scaling</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm">
          <div class="text-green-600 mb-4">
            <i class="fas fa-scroll text-2xl"></i>
          </div>
          <h3 class="font-semibold mb-2">Smooth Scrolling</h3>
          <p class="text-sm text-gray-600">Implemented smooth scroll navigation with navbar offset</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm">
          <div class="text-green-600 mb-4">
            <i class="fas fa-shapes text-2xl"></i>
          </div>
          <h3 class="font-semibold mb-2">Geometric Backgrounds</h3>
          <p class="text-sm text-gray-600">Various background shapes adapted for outdoor themes</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm">
          <div class="text-green-600 mb-4">
            <i class="fas fa-envelope text-2xl"></i>
          </div>
          <h3 class="font-semibold mb-2">Enhanced Forms</h3>
          <p class="text-sm text-gray-600">Improved contact forms with better styling and validation</p>
        </div>
      </div>
    </div>
  </section>
</div>
