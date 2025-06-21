<script lang="ts">
  import { onMount } from 'svelte';
  import ScrollAnimated from '$lib/components/layout/scroll-animated.svelte';
  import VideoBackground from '$lib/components/layout/video-background.svelte';

  let heroVisible = false;

  onMount(() => {
    // Trigger hero animation after a short delay
    setTimeout(() => {
      heroVisible = true;
    }, 300);
  });

  // Sample blog posts
  const blogPosts = [
    {
      id: 1,
      title: "Essential Camping Gear for Beginners: A Complete Guide",
      excerpt: "Starting your camping journey? Here's everything you need to know about essential gear that will make your first outdoor adventure comfortable and safe.",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: "Sarah Johnson",
      date: "March 15, 2024",
      readTime: "8 min read",
      category: "Camping"
    },
    {
      id: 2,
      title: "How to Choose the Right Hiking Backpack for Your Adventure",
      excerpt: "From day hikes to multi-day treks, learn how to select the perfect backpack that fits your needs, body type, and adventure style.",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: "Mike Chen",
      date: "March 12, 2024",
      readTime: "6 min read",
      category: "Hiking"
    },
    {
      id: 3,
      title: "Winter Sports Gear: Rent vs Buy - What Makes Sense?",
      excerpt: "Skiing and snowboarding gear can be expensive. We break down when it makes sense to rent versus buy your winter sports equipment.",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: "Emma Rodriguez",
      date: "March 10, 2024",
      readTime: "5 min read",
      category: "Winter Sports"
    },
    {
      id: 4,
      title: "Top 10 Climbing Destinations for Beginners",
      excerpt: "Ready to start your climbing journey? Discover the best beginner-friendly climbing spots across the country with tips for getting started safely.",
      image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: "Alex Thompson",
      date: "March 8, 2024",
      readTime: "10 min read",
      category: "Climbing"
    },
    {
      id: 5,
      title: "Kayaking Safety: Essential Tips for Water Adventures",
      excerpt: "Whether you're paddling calm lakes or rushing rivers, these safety tips will help ensure your kayaking adventures are both fun and secure.",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: "Jordan Lee",
      date: "March 5, 2024",
      readTime: "7 min read",
      category: "Water Sports"
    },
    {
      id: 6,
      title: "Sustainable Outdoor Adventures: Leave No Trace Principles",
      excerpt: "Learn how to enjoy the outdoors responsibly with these essential Leave No Trace principles that help preserve nature for future generations.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      author: "Taylor Kim",
      date: "March 3, 2024",
      readTime: "9 min read",
      category: "Sustainability"
    }
  ];

  // Categories for filtering
  const categories = [
    "All",
    "Camping",
    "Hiking",
    "Winter Sports",
    "Climbing",
    "Water Sports",
    "Sustainability"
  ];

  let selectedCategory = "All";

  // Filter posts based on selected category
  $: filteredPosts = selectedCategory === "All"
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);
</script>

<svelte:head>
  <title>Blog - GearGrab</title>
  <meta name="description" content="Discover outdoor adventure tips, gear guides, and expert advice from the GearGrab community. Learn how to make the most of your outdoor experiences." />
</svelte:head>

<!-- Full Page Video Background -->
<VideoBackground
  videoSrc="/1877846-hd_1920_1080_30fps.mp4"
  imageSrc="/pexels-bianca-gasparoto-834990-1752951.jpg"
  overlayOpacity="{0.4}"
/>

<!-- Page Content with Video Background -->
<div class="relative z-10 min-h-screen" style="position: relative; z-index: 10;">
  <!-- Hero Content -->
  <div class="relative h-60 flex flex-col items-center justify-center text-center text-white px-4 pt-20">
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 {heroVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'} transition-all duration-800">Adventure Awaits</h1>
    <p class="text-lg md:text-xl max-w-2xl mx-auto {heroVisible ? 'animate-fade-in-up animate-delay-200' : 'opacity-0 translate-y-8'} transition-all duration-800">Discover expert tips, gear guides, and outdoor inspiration from the GearGrab community.</p>
  </div>

  <!-- Content Section -->
  <div class="relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

      <!-- Blog Content -->
      <div class="mb-20">
        <!-- Category Filter -->
        <ScrollAnimated animation="fade-up" delay="{400}">
          <div class="flex flex-wrap justify-center gap-4 mb-12">
            {#each categories as category}
              <button
                class="px-6 py-2 rounded-lg transition-all {selectedCategory === category
                  ? 'bg-green-600/80 backdrop-blur-sm border border-green-500/30 text-white shadow-lg'
                  : 'bg-gray-800/70 backdrop-blur-sm border border-gray-600/50 text-white hover:border-green-400 hover:text-green-400 shadow-lg'}"
                on:click={() => selectedCategory = category}
              >
                {category}
              </button>
            {/each}
          </div>
        </ScrollAnimated>

        <!-- Blog Posts Grid -->
        <ScrollAnimated animation="fade-up" delay="{600}">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {#each filteredPosts as post, index}
              <ScrollAnimated animation="fade-up" delay={800 + (index * 100)}>
                <article class="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:bg-white/20 transition-all group shadow-lg">
                  <div class="relative overflow-hidden">
                    <img
                      src="{post.image}"
                      alt="{post.title}"
                      class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div class="absolute top-4 left-4">
                      <span class="bg-green-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-green-500/30 shadow-lg">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div class="p-6">
                    <h2 class="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors drop-shadow-lg">
                      {post.title}
                    </h2>
                    <p class="text-gray-200 mb-4 line-clamp-3 drop-shadow-lg">
                      {post.excerpt}
                    </p>

                    <div class="flex items-center justify-between text-sm text-gray-300">
                      <div class="flex items-center space-x-4">
                        <span class="drop-shadow-lg">{post.author}</span>
                        <span>•</span>
                        <span class="drop-shadow-lg">{post.date}</span>
                      </div>
                      <span class="drop-shadow-lg">{post.readTime}</span>
                    </div>

                    <div class="mt-4">
                      <button
                        class="inline-flex items-center text-green-400 hover:text-green-300 font-medium drop-shadow-lg"
                        on:click={() => {
                          // For now, just show an alert - in the future this would navigate to the actual blog post
                          alert(`Blog post "${post.title}" - Coming soon!`);
                        }}
                      >
                        Read More
                        <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              </ScrollAnimated>
            {/each}
          </div>
        </ScrollAnimated>
    </div>

      <!-- Newsletter Signup -->
      <ScrollAnimated animation="scale-in" delay="{1200}">
        <div class="text-center">
          <h2 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">Stay Updated</h2>
          <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-lg">
            Get the latest outdoor tips, gear reviews, and adventure inspiration delivered to your inbox.
          </p>

          <div class="max-w-md mx-auto">
            <div class="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                class="flex-1 px-4 py-3 rounded-lg bg-gray-800/70 backdrop-blur-sm border border-gray-600/50 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-lg" />
              <button class="bg-green-600/80 backdrop-blur-sm hover:bg-green-700/80 text-white font-bold px-6 py-3 rounded-lg transition-colors border border-green-500/30 shadow-lg whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </ScrollAnimated>

    </div>
  </div>
</div>

<style>
  /* Ensure scrolling works properly */
  :global(html) {
    scroll-behavior: smooth;
    overflow-y: auto;
  }

  :global(body) {
    overflow-y: auto;
    height: auto;
  }

  /* Ensure the page content can scroll */
  .relative.z-10 {
    position: relative;
    z-index: 10;
  }
</style>
