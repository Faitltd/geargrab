<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // Dummy listings data (enhanced version)
  const dummyListings = [
    {
      id: '1',
      title: 'REI Co-op Half Dome 4 Plus Tent - Premium Family Camping',
      description: 'Experience the great outdoors with this spacious and reliable 4-person tent from REI Co-op. The Half Dome 4 Plus is perfect for family camping adventures, featuring a generous interior space, easy setup, and excellent weather protection. This tent has been meticulously maintained and is in like-new condition.\n\nKey Features:\n• Spacious interior with 60 sq ft of floor space\n• Two large doors for easy entry/exit\n• Large vestibule for gear storage (35 sq ft)\n• Color-coded poles for quick setup\n• Excellent ventilation with mesh panels\n• Waterproof rainfly with 1,500mm coating\n• Durable 70D nylon floor\n• Freestanding design - no guylines required\n\nThis tent has been used on only 3 camping trips and has been professionally cleaned and waterproofed. Perfect for families, groups of friends, or anyone who values comfort and reliability in the outdoors.',
      category: 'camping',
      subcategory: 'tents',
      brand: 'REI Co-op',
      model: 'Half Dome 4 Plus',
      condition: 'Like New',
      ageInYears: 1,
      dailyPrice: 45,
      weeklyPrice: 270,
      monthlyPrice: 900,
      securityDeposit: 150,
      location: {
        city: 'Salt Lake City',
        state: 'UT',
        zipCode: '84101'
      },
      deliveryOptions: {
        pickup: true,
        dropoff: true,
        shipping: false,
        pickupLocation: '2100 S State St, Salt Lake City, UT (REI Store)',
        dropoffDistance: 30
      },
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1487730116645-74489c95b41b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1571863533956-01c88e79957e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
      ],
      features: [
        'Waterproof (1,500mm coating)',
        'Easy Setup (10 minutes)',
        'Spacious Interior (60 sq ft)',
        'Two Large Doors',
        'Large Vestibule (35 sq ft)',
        'Color-coded Poles',
        'Mesh Windows & Roof',
        'Freestanding Design',
        'Gear Loft Included',
        'Footprint Included',
        'Recently Waterproofed',
        'Professional Cleaning'
      ],
      specifications: {
        'Capacity': '4 people',
        'Floor Area': '60 sq ft',
        'Vestibule Area': '35 sq ft',
        'Peak Height': '6 ft 2 in',
        'Packed Weight': '9.2 lbs',
        'Packed Size': '25 x 9 inches',
        'Seasons': '3-season',
        'Setup Time': '10 minutes',
        'Doors': '2 large doors',
        'Vestibules': '1 large vestibule',
        'Floor Material': '70D nylon',
        'Rainfly Material': '75D polyester',
        'Pole Material': 'DAC Featherlite NSL aluminum',
        'Waterproof Rating': '1,500mm',
        'Wind Rating': '35+ mph'
      },
      includesInsurance: true,
      insuranceDetails: 'Basic damage coverage included',
      availabilityCalendar: {
        unavailableDates: [
          '2023-07-15',
          '2023-07-16',
          '2023-07-17',
          '2023-07-25',
          '2023-07-26'
        ]
      },
      createdAt: { seconds: 1625097600, nanoseconds: 0 },
      updatedAt: { seconds: 1625097600, nanoseconds: 0 },
      status: 'active',
      averageRating: 4.8,
      reviewCount: 5,
      reviews: [
        {
          id: '101',
          userId: 'user123',
          userName: 'Sarah Johnson',
          userImage: 'https://randomuser.me/api/portraits/women/32.jpg',
          rating: 5,
          date: '2024-01-15',
          comment: 'Outstanding tent for our family camping trip to Zion! The setup was incredibly easy with the color-coded poles - took us less than 10 minutes even in windy conditions. The two doors were perfect for our family of four, and the vestibule gave us plenty of space for our gear. We had a surprise thunderstorm and stayed completely dry. The mesh roof panels provided great ventilation during the day. David was super responsive and even included a footprint and gear loft. Highly recommend!'
        },
        {
          id: '102',
          userId: 'user456',
          userName: 'Michael Chen',
          userImage: 'https://randomuser.me/api/portraits/men/44.jpg',
          rating: 5,
          date: '2024-01-08',
          comment: 'Rented this tent for a weekend at Moab and it exceeded expectations. The quality is top-notch - you can tell it\'s been well-maintained. The interior space is generous, easily fit our sleeping bags and gear. The large vestibule was perfect for cooking and storing our bikes. David met us at the REI store for pickup which was super convenient. The tent was clean and came with everything we needed. Will definitely rent from David again!'
        },
        {
          id: '103',
          userId: 'user789',
          userName: 'Emily Rodriguez',
          userImage: 'https://randomuser.me/api/portraits/women/68.jpg',
          rating: 5,
          date: '2024-01-02',
          comment: 'Perfect tent for our New Year\'s camping trip! We were worried about the cold but this tent handled everything beautifully. The freestanding design made it easy to set up on rocky ground. The two large doors meant no one had to crawl over anyone to get out at night. The gear loft kept our small items organized. David provided excellent instructions and was available for questions. The tent was spotless and smelled fresh. Great value for the price!'
        },
        {
          id: '104',
          userId: 'user890',
          userName: 'Jake Thompson',
          userImage: 'https://randomuser.me/api/portraits/men/25.jpg',
          rating: 4,
          date: '2023-12-20',
          comment: 'Really solid tent! Used it for a 3-day camping trip in the Uintas. Setup was straightforward and the tent felt very stable in moderate winds. The interior space is exactly as advertised - plenty of room for 4 people. Only minor issue was one of the zipper pulls was a bit stiff, but it didn\'t affect functionality. The waterproofing is excellent - we had some light rain and stayed completely dry. David was great to work with and very accommodating with pickup times.'
        },
        {
          id: '105',
          userId: 'user567',
          userName: 'Lisa Park',
          userImage: 'https://randomuser.me/api/portraits/women/41.jpg',
          rating: 5,
          date: '2023-12-10',
          comment: 'This tent is amazing! We\'re new to camping and David was incredibly helpful with setup tips and camping advice. The tent is so much roomier than we expected - we had space for our air mattresses plus room to move around. The mesh windows provided great airflow during the day and the rainfly kept us cozy at night. The included footprint protected the tent floor perfectly. Pickup and return were seamless. We\'re already planning our next trip and will definitely rent this tent again!'
        }
      ],
      owner: {
        uid: 'owner123',
        name: 'David Wilson',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        joinedDate: '2022-03-15',
        responseRate: 98,
        responseTime: 'within an hour',
        listings: 8,
        reviews: 67,
        averageRating: 4.9,
        bio: 'Outdoor enthusiast and gear expert with 15+ years of camping experience. I love sharing quality gear with fellow adventurers! All my equipment is professionally maintained and comes with detailed setup instructions. Happy to provide camping tips and local recommendations for the Salt Lake City area.',
        verified: true,
        languages: ['English'],
        location: 'Salt Lake City, UT'
      }
    },
    {
      id: '2',
      title: 'Mountain Bike - Trek X-Caliber 8',
      description: 'High-quality mountain bike for trail riding. This Trek X-Caliber 8 is perfect for intermediate riders looking to explore mountain trails. Features hydraulic disc brakes for reliable stopping power, front suspension for a smooth ride, and Shimano components for precise shifting. The bike is well-maintained and regularly serviced.',
      category: 'biking',
      subcategory: 'mountain bikes',
      brand: 'Trek',
      model: 'X-Caliber 8',
      condition: 'Good',
      ageInYears: 2,
      dailyPrice: 45,
      weeklyPrice: 270,
      monthlyPrice: 900,
      securityDeposit: 200,
      location: {
        city: 'Boulder',
        state: 'CO',
        zipCode: '80302'
      },
      deliveryOptions: {
        pickup: true,
        dropoff: false,
        shipping: false,
        pickupLocation: 'North Boulder'
      },
      images: [
        'https://images.unsplash.com/photo-1511994298241-608e28f14fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1575585269294-7d28dd912db8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
      ],
      features: [
        'Hydraulic disc brakes',
        'Front suspension',
        'Shimano components',
        'Tubeless-ready wheels',
        'Includes helmet',
        'Includes repair kit'
      ],
      specifications: {
        'Frame Size': 'Medium (17.5")',
        'Wheel Size': '29"',
        'Gears': '18-speed',
        'Weight': '28 lbs',
        'Frame Material': 'Aluminum'
      },
      includesInsurance: true,
      insuranceDetails: 'Covers mechanical failures',
      availabilityCalendar: {
        unavailableDates: [
          '2023-07-10',
          '2023-07-11',
          '2023-07-12',
          '2023-07-20',
          '2023-07-21'
        ]
      },
      createdAt: { seconds: 1625184000, nanoseconds: 0 },
      updatedAt: { seconds: 1625184000, nanoseconds: 0 },
      status: 'active',
      averageRating: 4.6,
      reviewCount: 8,
      reviews: [
        {
          id: '201',
          userId: 'user234',
          userName: 'Alex Thompson',
          userImage: 'https://randomuser.me/api/portraits/men/22.jpg',
          rating: 5,
          date: '2023-06-10',
          comment: 'Excellent mountain bike! Handled the trails at Valmont Bike Park perfectly. Gears shifted smoothly and the brakes were responsive.'
        },
        {
          id: '202',
          userId: 'user567',
          userName: 'Jessica Lee',
          userImage: 'https://randomuser.me/api/portraits/women/45.jpg',
          rating: 4,
          date: '2023-05-28',
          comment: 'Great bike for trail riding. The owner provided a helmet and repair kit which came in handy. Would rent again.'
        }
      ],
      owner: {
        uid: 'owner456',
        name: 'Lisa Martinez',
        image: 'https://randomuser.me/api/portraits/women/22.jpg',
        joinedDate: '2022-01-10',
        responseRate: 95,
        responseTime: 'within a day',
        listings: 3,
        reviews: 27,
        averageRating: 4.7
      }
    },
    {
      id: '3',
      title: 'Kayak - Wilderness Systems Pungo 120',
      description: 'Stable and comfortable kayak for lake adventures. The Wilderness Systems Pungo 120 is a versatile recreational kayak that offers excellent stability and tracking. Perfect for beginners and experienced paddlers alike, this kayak features a comfortable seat, adjustable footrests, and ample storage compartments for day trips. Includes paddle and life vest.',
      category: 'water-sports',
      subcategory: 'kayaks',
      brand: 'Wilderness Systems',
      model: 'Pungo 120',
      condition: 'Good',
      ageInYears: 3,
      dailyPrice: 50,
      weeklyPrice: 300,
      monthlyPrice: 1000,
      securityDeposit: 150,
      location: {
        city: 'Fort Collins',
        state: 'CO',
        zipCode: '80525'
      },
      deliveryOptions: {
        pickup: true,
        dropoff: true,
        shipping: false,
        pickupLocation: 'South Fort Collins',
        dropoffDistance: 20
      },
      images: [
        'https://images.unsplash.com/photo-1604537466158-719b1972feb8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80',
        'https://images.unsplash.com/photo-1542834291-c514e77b215f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80'
      ],
      features: [
        'Comfortable seat',
        'Adjustable footrests',
        'Storage compartments',
        'Cup holder',
        'Includes paddle',
        'Includes life vest'
      ],
      specifications: {
        'Length': '12 feet',
        'Width': '29 inches',
        'Weight': '49 lbs',
        'Capacity': '325 lbs',
        'Material': 'Polyethylene'
      },
      includesInsurance: true,
      insuranceDetails: 'Covers damage and loss',
      availabilityCalendar: {
        unavailableDates: [
          '2023-07-01',
          '2023-07-02',
          '2023-07-03',
          '2023-07-04',
          '2023-07-30',
          '2023-07-31'
        ]
      },
      createdAt: { seconds: 1625270400, nanoseconds: 0 },
      updatedAt: { seconds: 1625270400, nanoseconds: 0 },
      status: 'active',
      averageRating: 4.9,
      reviewCount: 15,
      reviews: [
        {
          id: '301',
          userId: 'user345',
          userName: 'Ryan Miller',
          userImage: 'https://randomuser.me/api/portraits/men/55.jpg',
          rating: 5,
          date: '2023-06-20',
          comment: 'This kayak is amazing! Very stable and tracks well. Spent a full day on Horsetooth Reservoir and it was perfect. The included paddle and life vest were in great condition.'
        },
        {
          id: '302',
          userId: 'user678',
          userName: 'Amanda Wilson',
          userImage: 'https://randomuser.me/api/portraits/women/33.jpg',
          rating: 5,
          date: '2023-06-05',
          comment: 'Excellent kayak for beginners. I had never kayaked before and felt very comfortable and secure. The owner gave great tips for getting started.'
        },
        {
          id: '303',
          userId: 'user901',
          userName: 'Daniel Brown',
          userImage: 'https://randomuser.me/api/portraits/men/36.jpg',
          rating: 4,
          date: '2023-05-15',
          comment: 'Great kayak, very comfortable seat. The owner delivered it right to the lake for us which was super convenient.'
        }
      ],
      owner: {
        uid: 'owner789',
        name: 'James Taylor',
        image: 'https://randomuser.me/api/portraits/men/62.jpg',
        joinedDate: '2021-08-22',
        responseRate: 100,
        responseTime: 'within hours',
        listings: 8,
        reviews: 63,
        averageRating: 4.9
      }
    }
  ];

  // Get the listing ID from the URL
  const listingId = $page.params.listingId;

  // Find the listing with the matching ID
  const listing = dummyListings.find(item => item.id === listingId);

  // UI state
  let activeImageIndex = 0;
  let activeTab = 'description';
  let showAllReviews = false;

  // Booking state
  let startDate = '';
  let endDate = '';
  let rentalPeriod = 'daily'; // daily, weekly, monthly
  let deliveryMethod = 'pickup';
  let insuranceTier = 'standard';

  // Calculate number of days between start and end dates
  $: days = startDate && endDate ?
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Calculate base price based on rental period
  $: basePrice = rentalPeriod === 'daily' ? (listing?.dailyPrice || 0) * days :
                 rentalPeriod === 'weekly' ? (listing?.weeklyPrice || 0) * Math.ceil(days / 7) :
                 (listing?.monthlyPrice || 0) * Math.ceil(days / 30);

  // Calculate service fee (10% of rental fee)
  $: serviceFee = Math.round(basePrice * 0.1);

  // Calculate delivery fee
  $: deliveryFee = deliveryMethod === 'pickup' ? 0 :
                   deliveryMethod === 'dropoff' ? (listing?.deliveryOptions?.dropoffDistance || 0) * 2 :
                   15; // Default shipping fee

  // Calculate insurance fee
  $: insuranceFee = insuranceTier === 'none' ? 0 :
                    insuranceTier === 'basic' ? 5 :
                    insuranceTier === 'standard' ? 10 : 15;

  // Calculate total price
  $: totalPrice = basePrice + serviceFee + deliveryFee + insuranceFee;

  // Check if a date is unavailable
  function isDateUnavailable(date: Date): boolean {
    if (!listing?.availabilityCalendar?.unavailableDates) return false;

    const dateString = date.toISOString().split('T')[0];
    return listing.availabilityCalendar.unavailableDates.includes(dateString);
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date
  function formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  // Get similar listings
  $: similarListings = dummyListings
    .filter(item => item.id !== listing?.id && item.category === listing?.category)
    .slice(0, 3);

  // Handle booking
  function handleBooking() {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    // Navigate to booking confirmation page with booking details
    const bookingParams = new URLSearchParams({
      listingId: listing.id,
      startDate: startDate,
      endDate: endDate,
      deliveryMethod: deliveryMethod,
      insuranceTier: insuranceTier,
      totalPrice: totalPrice.toString()
    });

    goto(`/book/confirm?${bookingParams.toString()}`);
  }

  // Handle message owner
  function handleMessageOwner() {
    alert(`Messaging functionality would be implemented here. You would be able to message ${listing?.owner?.name}.`);
  }

  // Generate star rating display
  function renderStars(rating: number) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return Array(fullStars).fill('★').join('') +
           (halfStar ? '½' : '') +
           Array(emptyStars).fill('☆').join('');
  }
</script>

<svelte:head>
  <title>🚨 TESTING DEPLOYMENT 🚨 {listing ? `${listing.title} - GearGrab` : 'Listing Not Found - GearGrab'}</title>
  {#if listing}
    <meta name="description" content={listing.description.substring(0, 160)} />
  {/if}
</svelte:head>

{#if !listing}
  <!-- Not Found with Outdoor Theme -->
  <div class="relative min-h-screen pt-16">
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80');"
    ></div>
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative min-h-screen flex items-center justify-center px-4">
      <div class="text-center text-white">
        <h1 class="text-3xl font-bold mb-4">Listing Not Found</h1>
        <p class="text-lg mb-6">The listing you're looking for doesn't exist or has been removed.</p>
        <a href="/browse" class="btn bg-white text-green-600 hover:bg-gray-100 px-8 py-3">Browse Other Listings</a>
      </div>
    </div>
  </div>
{:else}
  <!-- TESTING: Bright Background to Confirm Deployment -->
  <div class="fixed inset-0 w-full h-full overflow-hidden z-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600">
    <!-- Background Image (fallback) -->
    <div
      class="absolute inset-0 bg-cover bg-center opacity-20"
      style="background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80');"
    ></div>

    <!-- Video Background -->
    <video
      class="absolute inset-0 w-full h-full object-cover opacity-30"
      autoplay
      muted
      loop
      playsinline
    >
      <!-- Outdoor gear/equipment video for listing page -->
      <source src="/857134-hd_1280_720_24fps.mp4" type="video/mp4" />
      <!-- Fallback videos -->
      <source src="https://player.vimeo.com/external/291648067.hd.mp4?s=94998971682c6a3267e4cbd19d16a7b6c720f345&profile_id=175" type="video/mp4" />
    </video>

    <!-- Light Overlay for Text Readability -->
    <div class="absolute inset-0 bg-black opacity-20"></div>
  </div>

  <!-- Listing Page Content -->
  <div class="relative z-20 min-h-screen pt-32 pb-16 flex items-center justify-center">
    <div class="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center justify-center">
        <!-- Left Column: Images and Details -->
        <div class="lg:col-span-2 space-y-6 w-full">
          <!-- Image Gallery - Floating Blur Box -->
          <div class="bg-white/25 backdrop-blur-xl rounded-xl border-2 border-white/50 p-8 shadow-2xl">
            <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden mb-4">
              <img
                src={listing.images[activeImageIndex]}
                alt={listing.title}
                class="object-cover w-full h-full"
              />
            </div>

            {#if listing.images.length > 1}
              <div class="flex space-x-2 overflow-x-auto pb-2">
                {#each listing.images as image, i}
                  <button
                    class="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden {i === activeImageIndex ? 'ring-2 ring-green-400' : 'ring-1 ring-white/30'}"
                    on:click={() => activeImageIndex = i}
                  >
                    <img src={image} alt={`${listing.title} - Image ${i+1}`} class="w-full h-full object-cover" />
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Listing Title & Info - Floating Blur Box -->
          <div class="bg-white/25 backdrop-blur-xl rounded-xl border-2 border-white/50 p-8 shadow-2xl">
            <h1 class="text-3xl font-bold mb-4 text-white drop-shadow-lg">🚨 DEPLOYMENT TEST 🚨 {listing.title}</h1>

            <div class="flex flex-wrap items-center mb-4">
              <div class="flex items-center mr-4">
                <div class="text-yellow-400 mr-1">
                  {#each Array(5) as _, i}
                    <span class="text-lg">{i < Math.floor(listing.averageRating) ? '★' : i < Math.ceil(listing.averageRating) ? '★' : '☆'}</span>
                  {/each}
                </div>
                <span class="font-medium text-white">{listing.averageRating}</span>
                {#if listing.reviewCount}
                  <span class="text-white/70 ml-1">({listing.reviewCount} reviews)</span>
                {/if}
              </div>
              <div class="text-white/70 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{listing.location.city}, {listing.location.state}</span>
              </div>
            </div>
          </div>

          <!-- Tabs - Floating Blur Box -->
          <div class="bg-white/25 backdrop-blur-xl rounded-xl border-2 border-white/50 p-8 shadow-2xl">
            <div class="border-b border-white/20">
              <nav class="flex -mb-px space-x-8">
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'description'}
                >
                  Description
                </button>
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'features' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'features'}
                >
                  Features & Specs
                </button>
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'reviews'}
                >
                  Reviews ({listing.reviewCount})
                </button>
                <button
                  class={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'owner' ? 'border-green-400 text-green-400' : 'border-transparent text-white/70 hover:text-white hover:border-white/30'}`}
                  on:click={() => activeTab = 'owner'}
                >
                  Owner
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="py-6">
              {#if activeTab === 'description'}
                <div class="prose max-w-none text-white">
                  <p class="text-white/90 leading-relaxed">{listing.description}</p>

                  <div class="mt-6">
                    <h3 class="text-lg font-medium mb-4 text-white">Delivery Options</h3>
                    <ul class="space-y-3">
                      {#if listing.deliveryOptions.pickup}
                        <li class="flex items-start">
                          <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <div>
                            <span class="font-medium text-white">Pickup</span>
                            {#if listing.deliveryOptions.pickupLocation}
                              <p class="text-white/70 text-sm mt-1">Location: {listing.deliveryOptions.pickupLocation}</p>
                            {/if}
                          </div>
                        </li>
                      {/if}

                      {#if listing.deliveryOptions.dropoff}
                        <li class="flex items-start">
                          <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <div>
                            <span class="font-medium text-white">Dropoff</span>
                            {#if listing.deliveryOptions.dropoffDistance}
                              <p class="text-white/70 text-sm mt-1">Within {listing.deliveryOptions.dropoffDistance} miles</p>
                            {/if}
                          </div>
                        </li>
                      {/if}

                      {#if listing.deliveryOptions.shipping}
                        <li class="flex items-start">
                          <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <div>
                            <span class="font-medium text-white">Shipping</span>
                            <p class="text-white/70 text-sm mt-1">Fee: {formatCurrency(15)}</p>
                          </div>
                        </li>
                      {/if}
                    </ul>
                  </div>

                  {#if listing.includesInsurance}
                    <div class="mt-6">
                      <h3 class="text-lg font-medium mb-4 text-white">Insurance</h3>
                      <div class="flex items-start">
                        <svg class="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        <div>
                          <span class="font-medium text-white">Insurance Included</span>
                          {#if listing.insuranceDetails}
                            <p class="text-white/70 text-sm mt-1">{listing.insuranceDetails}</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {:else if activeTab === 'features'}
                <div>
                  <!-- Features -->
                  <div class="mb-8">
                    <h3 class="text-lg font-medium mb-4 text-white">Features</h3>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {#each listing.features as feature}
                        <li class="flex items-center">
                          <svg class="h-5 w-5 text-green-400 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-white/90">{feature}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>

                  <!-- Specifications -->
                  {#if listing.specifications}
                    <div class="mb-8">
                      <h3 class="text-lg font-medium mb-4 text-white">Specifications</h3>
                      <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                          {#each Object.entries(listing.specifications) as [key, value]}
                            <div class="sm:col-span-1">
                              <dt class="text-sm font-medium text-white/70">{key}</dt>
                              <dd class="mt-1 text-sm text-white">{value}</dd>
                            </div>
                          {/each}
                        </dl>
                      </div>
                    </div>
                  {/if}

                  <!-- Additional Info -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div>
                      <h3 class="text-sm text-white/70">Brand</h3>
                      <p class="font-medium text-white">{listing.brand || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 class="text-sm text-white/70">Model</h3>
                      <p class="font-medium text-white">{listing.model || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 class="text-sm text-white/70">Condition</h3>
                      <p class="font-medium text-white">{listing.condition}</p>
                    </div>
                    <div>
                      <h3 class="text-sm text-white/70">Age</h3>
                      <p class="font-medium text-white">{listing.ageInYears} {listing.ageInYears === 1 ? 'year' : 'years'}</p>
                    </div>
                  </div>
                </div>
              {:else if activeTab === 'reviews'}
                <div>
                  {#if listing.reviews && listing.reviews.length > 0}
                    <div class="mb-6">
                      <h3 class="text-lg font-medium mb-4 text-white">Customer Reviews</h3>

                      <div class="space-y-6">
                        {#each (showAllReviews ? listing.reviews : listing.reviews.slice(0, 3)) as review}
                          <div class="border-b border-white/20 pb-6 last:border-b-0 last:pb-0">
                            <div class="flex items-start">
                              <img src={review.userImage} alt={review.userName} class="h-10 w-10 rounded-full mr-4" />
                              <div>
                                <div class="flex items-center">
                                  <h4 class="font-medium text-white">{review.userName}</h4>
                                  <span class="mx-2 text-white/50">•</span>
                                  <span class="text-white/70 text-sm">{review.date}</span>
                                </div>
                                <div class="text-yellow-400 mt-1">
                                  {#each Array(5) as _, i}
                                    <span>{i < review.rating ? '★' : '☆'}</span>
                                  {/each}
                                </div>
                                <p class="mt-2 text-white/90">{review.comment}</p>
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>

                      {#if listing.reviews.length > 3 && !showAllReviews}
                        <button
                          class="mt-4 text-green-400 font-medium hover:text-green-300"
                          on:click={() => showAllReviews = true}
                        >
                          Show all {listing.reviews.length} reviews
                        </button>
                      {/if}
                    </div>
                  {:else}
                    <p class="text-white/70">No reviews yet.</p>
                  {/if}
                </div>
              {:else if activeTab === 'owner'}
                <div>
                  {#if listing.owner}
                    <div class="flex items-start">
                      <img src={listing.owner.image} alt={listing.owner.name} class="h-16 w-16 rounded-full mr-4" />
                      <div>
                        <h3 class="text-lg font-medium text-white">{listing.owner.name}</h3>
                        <p class="text-white/70 text-sm">Member since {listing.owner.joinedDate}</p>

                        <div class="mt-2 flex items-center">
                          <div class="text-yellow-400 mr-1">
                            {#each Array(5) as _, i}
                              <span>{i < Math.floor(listing.owner.averageRating) ? '★' : i < Math.ceil(listing.owner.averageRating) ? '★' : '☆'}</span>
                            {/each}
                          </div>
                          <span class="font-medium text-white">{listing.owner.averageRating}</span>
                          <span class="text-white/70 ml-1">({listing.owner.reviews} reviews)</span>
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p class="text-sm text-white/70">Response rate</p>
                            <p class="font-medium text-white">{listing.owner.responseRate}%</p>
                          </div>
                          <div>
                            <p class="text-sm text-white/70">Response time</p>
                            <p class="font-medium text-white">{listing.owner.responseTime}</p>
                          </div>
                          <div>
                            <p class="text-sm text-white/70">Listings</p>
                            <p class="font-medium text-white">{listing.owner.listings}</p>
                          </div>
                        </div>

                        <button
                          class="mt-4 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md border border-white/20 transition-colors"
                          on:click={handleMessageOwner}
                        >
                          Message {listing.owner.name}
                        </button>
                      </div>
                    </div>
                  {:else}
                    <p class="text-white/70">Owner information not available.</p>
                  {/if}
                </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Booking Form -->
        <div class="lg:col-span-1">
          <div class="bg-white/25 backdrop-blur-xl rounded-xl border-2 border-white/50 shadow-2xl sticky top-32 w-full">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <div class="text-2xl font-bold text-green-400">{formatCurrency(listing.dailyPrice)}<span class="text-white/70 text-base font-normal">/day</span></div>
                  {#if listing.weeklyPrice}
                    <div class="text-sm text-white/70">
                      {formatCurrency(listing.weeklyPrice)}/week · {formatCurrency(listing.monthlyPrice)}/month
                    </div>
                  {/if}
                </div>
                {#if listing.securityDeposit > 0}
                  <div class="text-sm text-white/70 text-right">
                    {formatCurrency(listing.securityDeposit)} <br>security deposit
                  </div>
                {/if}
              </div>

              <!-- Booking Form -->
              <form class="space-y-4">
                <!-- Rental Period -->
                <fieldset>
                  <legend class="block text-sm font-medium text-white mb-2">Rental Period</legend>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'daily' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                      on:click={() => rentalPeriod = 'daily'}
                      aria-pressed={rentalPeriod === 'daily'}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'weekly' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                      on:click={() => rentalPeriod = 'weekly'}
                      aria-pressed={rentalPeriod === 'weekly'}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      class={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${rentalPeriod === 'monthly' ? 'bg-green-400 text-white border border-green-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                      on:click={() => rentalPeriod = 'monthly'}
                      aria-pressed={rentalPeriod === 'monthly'}
                    >
                      Monthly
                    </button>
                  </div>
                </fieldset>

                <!-- Dates -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="start-date" class="block text-sm font-medium text-white mb-2">Start Date</label>
                    <input
                      type="date"
                      id="start-date"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      bind:value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label for="end-date" class="block text-sm font-medium text-white mb-2">End Date</label>
                    <input
                      type="date"
                      id="end-date"
                      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      bind:value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <!-- Delivery Method -->
                <fieldset>
                  <legend class="block text-sm font-medium text-white mb-2">Delivery Method</legend>
                  <div class="space-y-3">
                    {#if listing.deliveryOptions.pickup}
                      <div class="flex items-center">
                        <input
                          type="radio"
                          id="pickup"
                          name="delivery"
                          value="pickup"
                          class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                          bind:group={deliveryMethod}
                        />
                        <label for="pickup" class="ml-3 block text-sm text-white">Pickup ({listing.deliveryOptions.pickupLocation})</label>
                      </div>
                    {/if}

                    {#if listing.deliveryOptions.dropoff}
                      <div class="flex items-center">
                        <input
                          type="radio"
                          id="dropoff"
                          name="delivery"
                          value="dropoff"
                          class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                          bind:group={deliveryMethod}
                        />
                        <label for="dropoff" class="ml-3 block text-sm text-white">Dropoff (within {listing.deliveryOptions.dropoffDistance} miles)</label>
                      </div>
                    {/if}

                    {#if listing.deliveryOptions.shipping}
                      <div class="flex items-center">
                        <input
                          type="radio"
                          id="shipping"
                          name="delivery"
                          value="shipping"
                          class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                          bind:group={deliveryMethod}
                        />
                        <label for="shipping" class="ml-3 block text-sm text-white">Shipping</label>
                      </div>
                    {/if}
                  </div>
                </fieldset>

                <!-- Insurance -->
                <fieldset>
                  <legend class="block text-sm font-medium text-white mb-2">Insurance</legend>
                  <div class="space-y-3">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-none"
                        name="insurance"
                        value="none"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group={insuranceTier}
                      />
                      <label for="insurance-none" class="ml-3 block text-sm text-white">No additional insurance</label>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-basic"
                        name="insurance"
                        value="basic"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group={insuranceTier}
                      />
                      <label for="insurance-basic" class="ml-3 block text-sm text-white">Basic ($5/day)</label>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-standard"
                        name="insurance"
                        value="standard"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group={insuranceTier}
                      />
                      <label for="insurance-standard" class="ml-3 block text-sm text-white">Standard ($10/day)</label>
                    </div>

                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="insurance-premium"
                        name="insurance"
                        value="premium"
                        class="h-4 w-4 text-green-400 bg-white/10 border-white/20 focus:ring-green-400"
                        bind:group={insuranceTier}
                      />
                      <label for="insurance-premium" class="ml-3 block text-sm text-white">Premium ($15/day)</label>
                    </div>
                  </div>
                </fieldset>

                {#if days > 0}
                  <div class="border-t border-white/20 pt-4 mt-4">
                    <div class="space-y-2 text-white">
                      {#if rentalPeriod === 'daily'}
                        <div class="flex justify-between">
                          <span>{formatCurrency(listing.dailyPrice)} × {days} days</span>
                          <span>{formatCurrency(listing.dailyPrice * days)}</span>
                        </div>
                      {:else if rentalPeriod === 'weekly'}
                        <div class="flex justify-between">
                          <span>{formatCurrency(listing.weeklyPrice)} × {Math.ceil(days / 7)} weeks</span>
                          <span>{formatCurrency(listing.weeklyPrice * Math.ceil(days / 7))}</span>
                        </div>
                      {:else}
                        <div class="flex justify-between">
                          <span>{formatCurrency(listing.monthlyPrice)} × {Math.ceil(days / 30)} months</span>
                          <span>{formatCurrency(listing.monthlyPrice * Math.ceil(days / 30))}</span>
                        </div>
                      {/if}

                      <div class="flex justify-between">
                        <span>Service fee</span>
                        <span>{formatCurrency(serviceFee)}</span>
                      </div>

                      {#if deliveryFee > 0}
                        <div class="flex justify-between">
                          <span>{deliveryMethod === 'dropoff' ? 'Dropoff fee' : 'Shipping fee'}</span>
                          <span>{formatCurrency(deliveryFee)}</span>
                        </div>
                      {/if}

                      {#if insuranceFee > 0}
                        <div class="flex justify-between">
                          <span>Insurance ({insuranceTier})</span>
                          <span>{formatCurrency(insuranceFee)}</span>
                        </div>
                      {/if}

                      <div class="flex justify-between font-bold pt-2 border-t border-white/20 text-green-400">
                        <span>Total</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                {/if}

                <button
                  type="button"
                  class="w-full bg-green-400 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  on:click={handleBooking}
                  disabled={!startDate || !endDate}
                >
                  Book Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Similar Products -->
      {#if similarListings && similarListings.length > 0}
        <div class="mt-16 text-center">
          <h2 class="text-2xl font-bold mb-6 text-white drop-shadow-lg">Similar Products</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
            {#each similarListings as item}
              <a href="/listing/{item.id}" class="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg overflow-hidden hover:bg-white/20 transition-all">
                <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img src={item.images[0]} alt={item.title} class="object-cover w-full h-48" />
                </div>
                <div class="p-4">
                  <h3 class="font-medium text-lg mb-1 text-white">{item.title}</h3>
                  <p class="text-white/70 text-sm mb-2">{item.location.city}, {item.location.state}</p>
                  <div class="flex justify-between items-center">
                    <p class="font-bold text-green-400">{formatCurrency(item.dailyPrice)}/day</p>
                    <div class="flex items-center">
                      <span class="text-yellow-400 mr-1">★</span>
                      <span class="text-white">{item.averageRating || 'New'}</span>
                      {#if item.reviewCount}
                        <span class="text-white/70 ml-1">({item.reviewCount})</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}
  </div>
{/if}
