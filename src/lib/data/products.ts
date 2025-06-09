// Comprehensive product catalog for GearGrab
//
// 🚀 NEW LISTINGS: Use the validation utilities to ensure proper display!
// Import: import { createListing, addNewListing } from '$lib/utils/listingHelpers';
// Usage: const newListing = createListing({ title: 'My Gear', category: 'biking', dailyPrice: 40 });
//
// The validation system automatically:
// ✅ Ensures proper image URLs with fallbacks
// ✅ Validates required fields
// ✅ Provides category-appropriate default images
// ✅ Handles missing or invalid data gracefully
export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  model?: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  ageInYears?: number;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit: number;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  owner: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
  };
  availability: {
    unavailableDates: string[];
    minimumRental: number;
    maximumRental: number;
  };
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    text: string;
    date: string;
  }>;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const products: Product[] = [
  // Camping Gear
  {
    id: 'camp-001',
    title: 'REI Co-op Half Dome 4 Plus Tent',
    description: 'Spacious 4-person tent perfect for family camping trips. Features two vestibules, color-coded clips for easy setup, and excellent weather protection.',
    category: 'camping',
    subcategory: 'tents',
    brand: 'REI Co-op',
    model: 'Half Dome 4 Plus',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 35,
    weeklyPrice: 210,
    monthlyPrice: 700,
    securityDeposit: 150,
    location: {
      city: 'Denver',
      state: 'CO',
      zipCode: '80202'
    },
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Waterproof', 'Easy Setup', 'Two Vestibules', 'Color-coded Clips'],
    specifications: {
      'Capacity': '4 people',
      'Weight': '8.5 lbs',
      'Floor Area': '55 sq ft',
      'Peak Height': '6 ft',
      'Seasons': '3-season'
    },
    owner: {
      id: 'owner-001',
      name: 'John Smith',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      rating: 4.8,
      reviewCount: 23
    },
    availability: {
      unavailableDates: ['2024-06-15', '2024-06-16', '2024-07-04'],
      minimumRental: 1,
      maximumRental: 14
    },
    reviews: [
      {
        id: 'review-001',
        userId: 'user-001',
        userName: 'Sarah Johnson',
        rating: 5,
        text: 'Amazing tent! Perfect for our family camping trip. Very easy to set up and stayed dry during a rainstorm.',
        date: '2024-05-15'
      }
    ],
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-05-20'
  },

  // Electric Mobility - OneWheel
  {
    id: 'emob-001',
    title: 'OneWheel Pint X Electric Board',
    description: 'Experience the thrill of floating on land with this premium OneWheel Pint X. Perfect for urban commuting and trail adventures.',
    category: 'electric-mobility',
    subcategory: 'onewheel',
    brand: 'OneWheel',
    model: 'Pint X',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 65,
    weeklyPrice: 390,
    monthlyPrice: 1300,
    securityDeposit: 300,
    location: {
      city: 'Boulder',
      state: 'CO',
      zipCode: '80301'
    },
    images: [
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    ],
    features: ['Self-Balancing', 'App Connectivity', 'LED Lights', 'Regenerative Braking'],
    specifications: {
      'Top Speed': '18 mph',
      'Range': '12-18 miles',
      'Weight': '27 lbs',
      'Max Rider Weight': '250 lbs',
      'Tire Size': '10.5 inches'
    },
    owner: {
      id: 'owner-002',
      name: 'Emily Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 31
    },
    availability: {
      unavailableDates: ['2024-06-20', '2024-06-21'],
      minimumRental: 1,
      maximumRental: 7
    },
    reviews: [
      {
        id: 'review-002',
        userId: 'user-002',
        userName: 'Alex Thompson',
        rating: 5,
        text: 'Incredible experience! The OneWheel is so much fun and surprisingly easy to learn.',
        date: '2024-05-10'
      }
    ],
    status: 'active',
    createdAt: '2024-02-01',
    updatedAt: '2024-05-18'
  },

  // Mountain Bike
  {
    id: 'bike-001',
    title: 'Trek X-Caliber 8 Mountain Bike',
    description: 'High-performance mountain bike perfect for trail riding. Features hydraulic disc brakes, front suspension, and Shimano components.',
    category: 'biking',
    subcategory: 'mountain-bikes',
    brand: 'Trek',
    model: 'X-Caliber 8',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 45,
    weeklyPrice: 270,
    monthlyPrice: 900,
    securityDeposit: 200,
    location: {
      city: 'Vail',
      state: 'CO',
      zipCode: '81657'
    },
    images: [
      'https://images.unsplash.com/photo-1544191696-15693072e0b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Hydraulic Disc Brakes', 'Front Suspension', 'Shimano Components', '29-inch Wheels'],
    specifications: {
      'Frame Size': 'Large (19.5")',
      'Wheel Size': '29 inches',
      'Gears': '10-speed',
      'Weight': '29.5 lbs',
      'Suspension': 'Front 100mm'
    },
    owner: {
      id: 'owner-003',
      name: 'David Wilson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      rating: 4.7,
      reviewCount: 18
    },
    availability: {
      unavailableDates: ['2024-07-04', '2024-07-05'],
      minimumRental: 1,
      maximumRental: 14
    },
    reviews: [
      {
        id: 'review-003',
        userId: 'user-003',
        userName: 'Lisa Rodriguez',
        rating: 4,
        text: 'Great bike for mountain trails! Smooth ride and excellent braking power.',
        date: '2024-03-15'
      }
    ],
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-05-22'
  },

  // 4. Inline Skates - Rollerblades
  {
    id: 'skate-001',
    title: 'Rollerblade Zetrablade Elite Inline Skates',
    description: 'High-quality inline skates perfect for recreational skating and fitness. Comfortable fit with excellent ankle support and smooth-rolling wheels.',
    category: 'skating',
    subcategory: 'inline-skates',
    brand: 'Rollerblade',
    model: 'Zetrablade Elite',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 25,
    weeklyPrice: 150,
    monthlyPrice: 500,
    securityDeposit: 100,
    location: { city: 'Fort Collins', state: 'CO', zipCode: '80524' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Adjustable Sizing', 'ABEC 5 Bearings', 'Comfort Padding', 'Durable Frame'],
    specifications: { 'Size Range': 'US 9-10', 'Wheel Size': '80mm', 'Bearings': 'ABEC 5', 'Frame': 'Composite', 'Closure': 'Lace + Strap' },
    owner: { id: 'owner-004', name: 'Maria Garcia', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.6, reviewCount: 15 },
    availability: { unavailableDates: ['2024-06-25'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-004', userId: 'user-004', userName: 'Mike Johnson', rating: 5, text: 'Perfect skates for getting back into skating!', date: '2024-04-20' }],
    status: 'active',
    createdAt: '2024-03-01',
    updatedAt: '2024-05-25'
  },

  // 5. Electric Scooter
  {
    id: 'emob-002',
    title: 'Segway Ninebot Max Electric Scooter',
    description: 'Premium electric scooter with long range and powerful motor. Perfect for urban commuting and exploring the city.',
    category: 'electric-mobility',
    subcategory: 'electric-scooters',
    brand: 'Segway',
    model: 'Ninebot Max',
    condition: 'Good',
    ageInYears: 1,
    dailyPrice: 40,
    weeklyPrice: 240,
    monthlyPrice: 800,
    securityDeposit: 200,
    location: { city: 'Denver', state: 'CO', zipCode: '80203' },
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['40.4 Mile Range', 'Foldable Design', 'App Connectivity', 'Pneumatic Tires'],
    specifications: { 'Top Speed': '18.6 mph', 'Range': '40.4 miles', 'Weight': '41.2 lbs', 'Max Load': '220 lbs', 'Charging Time': '6 hours' },
    owner: { id: 'owner-005', name: 'James Park', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 27 },
    availability: { unavailableDates: ['2024-07-01', '2024-07-02'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-005', userId: 'user-005', userName: 'Anna Kim', rating: 5, text: 'Amazing scooter! Great range and very reliable.', date: '2024-04-15' }],
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-05-30'
  },

  // 6. Road Bike
  {
    id: 'bike-002',
    title: 'Specialized Allez Elite Road Bike',
    description: 'Lightweight road bike perfect for long distance rides and training. Features carbon fork and Shimano 105 components.',
    category: 'biking',
    subcategory: 'road-bikes',
    brand: 'Specialized',
    model: 'Allez Elite',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 50,
    weeklyPrice: 300,
    monthlyPrice: 1000,
    securityDeposit: 250,
    location: { city: 'Boulder', state: 'CO', zipCode: '80302' },
    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Carbon Fork', 'Shimano 105', 'Lightweight Frame', 'Drop Handlebars'],
    specifications: { 'Frame Size': 'Medium (54cm)', 'Weight': '22 lbs', 'Gears': '11-speed', 'Wheel Size': '700c', 'Frame Material': 'Aluminum' },
    owner: { id: 'owner-006', name: 'Rachel Thompson', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 22 },
    availability: { unavailableDates: ['2024-06-30'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-006', userId: 'user-006', userName: 'Tom Wilson', rating: 5, text: 'Excellent road bike! Perfect for long rides.', date: '2024-05-01' }],
    status: 'active',
    createdAt: '2024-03-10',
    updatedAt: '2024-05-28'
  },

  // 7. Hiking Backpack
  {
    id: 'hike-001',
    title: 'Osprey Atmos AG 65L Backpack',
    description: 'Premium hiking backpack with Anti-Gravity suspension system. Perfect for multi-day backpacking adventures.',
    category: 'hiking',
    subcategory: 'backpacks',
    brand: 'Osprey',
    model: 'Atmos AG 65',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 30,
    weeklyPrice: 180,
    monthlyPrice: 600,
    securityDeposit: 120,
    location: { city: 'Aspen', state: 'CO', zipCode: '81611' },
    images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Anti-Gravity Suspension', 'Adjustable Torso', 'Rain Cover', 'Multiple Pockets'],
    specifications: { 'Capacity': '65 liters', 'Weight': '4.5 lbs', 'Torso Length': 'Adjustable', 'Material': 'Nylon', 'Hydration Compatible': 'Yes' },
    owner: { id: 'owner-007', name: 'Chris Martinez', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.7, reviewCount: 19 },
    availability: { unavailableDates: ['2024-08-15', '2024-08-16'], minimumRental: 2, maximumRental: 21 },
    reviews: [{ id: 'review-007', userId: 'user-007', userName: 'Jennifer Lee', rating: 5, text: 'Excellent backpack! Very comfortable even with heavy loads.', date: '2024-04-25' }],
    status: 'active',
    createdAt: '2024-01-25',
    updatedAt: '2024-05-15'
  },

  // 8. Ski Equipment Set
  {
    id: 'ski-001',
    title: 'Rossignol Experience 88 Ski Set',
    description: 'Complete ski set including skis, boots, and poles. Perfect for intermediate to advanced skiers on all mountain terrain.',
    category: 'skiing',
    subcategory: 'alpine-skis',
    brand: 'Rossignol',
    model: 'Experience 88',
    condition: 'Excellent',
    ageInYears: 1,
    dailyPrice: 55,
    weeklyPrice: 330,
    monthlyPrice: 1100,
    securityDeposit: 250,
    location: { city: 'Vail', state: 'CO', zipCode: '81657' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['All-Mountain', 'Intermediate Level', 'Recently Tuned', 'Complete Set'],
    specifications: { 'Ski Length': '170cm', 'Boot Size': '10.5 US', 'Pole Length': '125cm', 'Binding': 'Look SPX 12', 'Waist Width': '88mm' },
    owner: { id: 'owner-008', name: 'Michael Snow', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 25 },
    availability: { unavailableDates: ['2024-12-25', '2024-12-26'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-008', userId: 'user-008', userName: 'Sarah Davis', rating: 5, text: 'Amazing ski set! Perfect condition and great performance.', date: '2024-03-20' }],
    status: 'active',
    createdAt: '2024-01-30',
    updatedAt: '2024-05-12'
  },

  // 9. Climbing Gear Set
  {
    id: 'climb-001',
    title: 'Black Diamond Complete Climbing Kit',
    description: 'Complete climbing gear set including harness, helmet, shoes, and hardware. Perfect for sport climbing and gym use.',
    category: 'climbing',
    subcategory: 'climbing-gear',
    brand: 'Black Diamond',
    model: 'Complete Kit',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 40,
    weeklyPrice: 240,
    monthlyPrice: 800,
    securityDeposit: 180,
    location: { city: 'Boulder', state: 'CO', zipCode: '80304' },
    images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Set', 'Safety Certified', 'Adjustable Harness', 'Climbing Shoes Included'],
    specifications: { 'Harness Size': 'Medium', 'Shoe Size': 'US 10', 'Helmet': 'UIAA Certified', 'Quickdraws': '12 included', 'Rope': '60m Dynamic' },
    owner: { id: 'owner-009', name: 'Alex Climber', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 33 },
    availability: { unavailableDates: ['2024-07-15'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-009', userId: 'user-009', userName: 'Emma Stone', rating: 5, text: 'Perfect climbing kit! Everything you need to get started.', date: '2024-04-10' }],
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-05-08'
  },

  // 10. Water Sports - Kayak
  {
    id: 'water-001',
    title: 'Perception Pescador Pro 12 Kayak',
    description: 'Stable fishing kayak perfect for lakes and calm rivers. Features multiple rod holders and storage compartments.',
    category: 'water-sports',
    subcategory: 'kayaks',
    brand: 'Perception',
    model: 'Pescador Pro 12',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 60,
    weeklyPrice: 360,
    monthlyPrice: 1200,
    securityDeposit: 300,
    location: { city: 'Grand Junction', state: 'CO', zipCode: '81501' },
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Fishing Ready', 'Rod Holders', 'Storage Compartments', 'Stable Design'],
    specifications: { 'Length': '12 feet', 'Width': '33 inches', 'Weight': '68 lbs', 'Capacity': '375 lbs', 'Material': 'Polyethylene' },
    owner: { id: 'owner-010', name: 'River Guide Co', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.7, reviewCount: 41 },
    availability: { unavailableDates: ['2024-07-20', '2024-07-21'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-010', userId: 'user-010', userName: 'Jake Fisher', rating: 4, text: 'Great kayak for fishing! Very stable and comfortable.', date: '2024-05-05' }],
    status: 'active',
    createdAt: '2024-03-15',
    updatedAt: '2024-05-20'
  },

  // 11. Electric Bike
  {
    id: 'bike-003',
    title: 'Rad Power RadCity 5 Plus E-Bike',
    description: 'Premium electric commuter bike with long range battery and powerful motor. Perfect for urban commuting and recreational rides.',
    category: 'biking',
    subcategory: 'electric-bikes',
    brand: 'Rad Power',
    model: 'RadCity 5 Plus',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 70,
    weeklyPrice: 420,
    monthlyPrice: 1400,
    securityDeposit: 350,
    location: { city: 'Denver', state: 'CO', zipCode: '80205' },
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Electric Motor', '45+ Mile Range', 'LCD Display', 'Integrated Lights'],
    specifications: { 'Motor': '750W Geared Hub', 'Battery': '48V 14Ah', 'Range': '45+ miles', 'Top Speed': '20 mph', 'Weight': '65 lbs' },
    owner: { id: 'owner-011', name: 'Urban Cycles', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 29 },
    availability: { unavailableDates: ['2024-06-28', '2024-06-29'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-011', userId: 'user-011', userName: 'Lisa Chen', rating: 5, text: 'Amazing e-bike! Makes commuting so much easier.', date: '2024-04-30' }],
    status: 'active',
    createdAt: '2024-03-25',
    updatedAt: '2024-05-22'
  },

  // 12. Snowboard Set
  {
    id: 'snow-001',
    title: 'Burton Custom Snowboard Complete Set',
    description: 'Complete snowboard setup including board, bindings, and boots. Perfect for intermediate to advanced riders.',
    category: 'skiing',
    subcategory: 'snowboards',
    brand: 'Burton',
    model: 'Custom',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 50,
    weeklyPrice: 300,
    monthlyPrice: 1000,
    securityDeposit: 200,
    location: { city: 'Breckenridge', state: 'CO', zipCode: '80424' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['All-Mountain', 'Complete Set', 'Tuned and Waxed', 'Intermediate/Advanced'],
    specifications: { 'Board Length': '158cm', 'Boot Size': 'US 10', 'Binding': 'Burton Cartel', 'Flex': 'Medium', 'Shape': 'Directional Twin' },
    owner: { id: 'owner-012', name: 'Mountain Sports', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.6, reviewCount: 38 },
    availability: { unavailableDates: ['2024-12-31', '2025-01-01'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-012', userId: 'user-012', userName: 'Mark Snow', rating: 4, text: 'Solid snowboard setup! Great for all mountain riding.', date: '2024-03-10' }],
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-05-18'
  },

  // 13. Camping Sleeping Bag
  {
    id: 'camp-002',
    title: 'Patagonia 850 Down Sleeping Bag',
    description: 'Premium down sleeping bag rated for 20°F. Ultra-lightweight and compressible, perfect for backpacking.',
    category: 'camping',
    subcategory: 'sleeping-bags',
    brand: 'Patagonia',
    model: '850 Down 20°F',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 35,
    weeklyPrice: 210,
    monthlyPrice: 700,
    securityDeposit: 150,
    location: { city: 'Steamboat Springs', state: 'CO', zipCode: '80487' },
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['850 Fill Down', '20°F Rating', 'Ultra-Lightweight', 'Compressible'],
    specifications: { 'Temperature Rating': '20°F', 'Weight': '2 lbs 3 oz', 'Fill': '850-fill down', 'Length': 'Regular (6 ft)', 'Stuff Sack': 'Included' },
    owner: { id: 'owner-013', name: 'Alpine Gear Co', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 45 },
    availability: { unavailableDates: ['2024-08-10', '2024-08-11'], minimumRental: 2, maximumRental: 21 },
    reviews: [{ id: 'review-013', userId: 'user-013', userName: 'Adventure Mike', rating: 5, text: 'Incredible sleeping bag! Kept me warm in freezing temps.', date: '2024-04-05' }],
    status: 'active',
    createdAt: '2024-03-05',
    updatedAt: '2024-05-25'
  },

  // 14. Skateboard
  {
    id: 'skate-002',
    title: 'Santa Cruz Complete Skateboard',
    description: 'Professional complete skateboard setup perfect for street skating and tricks. High-quality components throughout.',
    category: 'skating',
    subcategory: 'skateboards',
    brand: 'Santa Cruz',
    model: 'Classic Dot Complete',
    condition: 'Good',
    ageInYears: 1,
    dailyPrice: 20,
    weeklyPrice: 120,
    monthlyPrice: 400,
    securityDeposit: 80,
    location: { city: 'Colorado Springs', state: 'CO', zipCode: '80903' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Setup', 'Professional Grade', 'Street Ready', 'Quality Bearings'],
    specifications: { 'Deck Size': '8.25 inches', 'Trucks': 'Independent', 'Wheels': '53mm', 'Bearings': 'Bones Reds', 'Grip Tape': 'Mob' },
    owner: { id: 'owner-014', name: 'Skate Shop Pro', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.5, reviewCount: 28 },
    availability: { unavailableDates: ['2024-07-10'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-014', userId: 'user-014', userName: 'Tony Hawk Jr', rating: 4, text: 'Solid skateboard! Perfect for learning tricks.', date: '2024-04-18' }],
    status: 'active',
    createdAt: '2024-03-20',
    updatedAt: '2024-05-15'
  },

  // 15. Paddleboard
  {
    id: 'water-002',
    title: 'BOTE Breeze Aero Inflatable SUP',
    description: 'Premium inflatable stand-up paddleboard perfect for lakes, rivers, and calm ocean waters. Includes pump and paddle.',
    category: 'water-sports',
    subcategory: 'paddleboards',
    brand: 'BOTE',
    model: 'Breeze Aero 10\'6"',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 45,
    weeklyPrice: 270,
    monthlyPrice: 900,
    securityDeposit: 200,
    location: { city: 'Durango', state: 'CO', zipCode: '81301' },
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Inflatable', 'Complete Kit', 'Stable Design', 'Easy Transport'],
    specifications: { 'Length': '10\'6"', 'Width': '33 inches', 'Thickness': '6 inches', 'Weight': '25 lbs', 'Capacity': '275 lbs' },
    owner: { id: 'owner-015', name: 'River Adventures', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 52 },
    availability: { unavailableDates: ['2024-07-25', '2024-07-26'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-015', userId: 'user-015', userName: 'Water Lover', rating: 5, text: 'Amazing SUP! So stable and easy to use.', date: '2024-05-12' }],
    status: 'active',
    createdAt: '2024-04-01',
    updatedAt: '2024-05-28'
  },

  // 16. Camping Stove
  {
    id: 'camp-003',
    title: 'MSR WhisperLite Universal Stove',
    description: 'Versatile camping stove that burns multiple fuel types. Perfect for backpacking and car camping. Lightweight, reliable, and efficient for all your outdoor cooking needs.',
    category: 'camping',
    subcategory: 'stoves',
    brand: 'MSR',
    model: 'WhisperLite Universal',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 15,
    weeklyPrice: 90,
    monthlyPrice: 300,
    securityDeposit: 75,
    location: { city: 'Aspen', state: 'CO', zipCode: '81611' },
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Multi-Fuel', 'Lightweight', 'Windscreen Included', 'Fuel Bottle Included'],
    specifications: { 'Weight': '11.2 oz', 'Fuel Types': 'White gas, kerosene, unleaded auto gas', 'Boil Time': '3.5 minutes', 'Burn Time': '1.5 hours' },
    owner: { id: 'owner-016', name: 'Mountain Chef', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 28 },
    availability: { unavailableDates: ['2024-08-15'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-016', userId: 'user-016', userName: 'Backpack Chef', rating: 5, text: 'Excellent stove! Reliable and efficient.', date: '2024-05-20' }],
    status: 'active',
    createdAt: '2024-03-15',
    updatedAt: '2024-05-30'
  },

  // 17. Fishing Gear Set
  {
    id: 'fish-001',
    title: 'Orvis Clearwater Fly Fishing Complete Kit',
    description: 'Complete fly fishing setup including rod, reel, line, and tackle box. Perfect for beginners and experienced anglers. Includes flies and essential accessories.',
    category: 'fishing',
    subcategory: 'fly-fishing',
    brand: 'Orvis',
    model: 'Clearwater',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 40,
    weeklyPrice: 240,
    monthlyPrice: 800,
    securityDeposit: 200,
    location: { city: 'Steamboat Springs', state: 'CO', zipCode: '80487' },
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Kit', 'Beginner Friendly', 'Includes Flies', 'Tackle Box Included'],
    specifications: { 'Rod Length': '9 feet', 'Weight': '5wt', 'Pieces': '4-piece', 'Reel': 'Clearwater Large Arbor', 'Line': 'WF5F' },
    owner: { id: 'owner-017', name: 'River Guide Pro', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.7, reviewCount: 35 },
    availability: { unavailableDates: ['2024-07-10', '2024-07-11'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-017', userId: 'user-017', userName: 'Fly Fisher', rating: 4, text: 'Great setup for learning fly fishing!', date: '2024-04-25' }],
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-05-15'
  },

  // 18. Photography Gear
  {
    id: 'photo-001',
    title: 'Canon EOS R5 Adventure Photography Kit',
    description: 'Professional camera kit perfect for outdoor photography. Includes weather-sealed body, versatile lens, tripod, and protective gear for adventure photography.',
    category: 'photography',
    subcategory: 'cameras',
    brand: 'Canon',
    model: 'EOS R5',
    condition: 'Excellent',
    ageInYears: 1,
    dailyPrice: 85,
    weeklyPrice: 510,
    monthlyPrice: 1700,
    securityDeposit: 500,
    location: { city: 'Boulder', state: 'CO', zipCode: '80303' },
    images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Weather Sealed', 'Professional Quality', 'Tripod Included', 'Extra Batteries'],
    specifications: { 'Resolution': '45MP', 'Video': '8K RAW', 'ISO Range': '100-51200', 'Lens': 'RF 24-105mm f/4L', 'Storage': 'CFexpress + SD' },
    owner: { id: 'owner-018', name: 'Adventure Photographer', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 42 },
    availability: { unavailableDates: ['2024-06-20', '2024-06-21', '2024-06-22'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-018', userId: 'user-018', userName: 'Nature Photographer', rating: 5, text: 'Incredible camera! Perfect for landscape photography.', date: '2024-05-05' }],
    status: 'active',
    createdAt: '2024-03-01',
    updatedAt: '2024-05-25'
  },

  // 19. Winter Sports - Cross Country Skis
  {
    id: 'ski-002',
    title: 'Salomon Snowscape 7 Cross Country Ski Set',
    description: 'Complete cross-country skiing set perfect for groomed trails and backcountry exploration. Includes skis, boots, poles, and bindings.',
    category: 'skiing',
    subcategory: 'cross-country',
    brand: 'Salomon',
    model: 'Snowscape 7',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 35,
    weeklyPrice: 210,
    monthlyPrice: 700,
    securityDeposit: 150,
    location: { city: 'Vail', state: 'CO', zipCode: '81657' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Set', 'Waxless Base', 'Comfortable Boots', 'Adjustable Poles'],
    specifications: { 'Ski Length': '190cm', 'Boot Size': 'US 10', 'Pole Length': '150cm', 'Binding': 'SNS Pilot', 'Base': 'Waxless' },
    owner: { id: 'owner-019', name: 'Nordic Ski Shop', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.6, reviewCount: 31 },
    availability: { unavailableDates: ['2024-12-25', '2024-12-26'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-019', userId: 'user-019', userName: 'XC Skier', rating: 4, text: 'Great skis for exploring winter trails!', date: '2024-02-15' }],
    status: 'active',
    createdAt: '2024-01-10',
    updatedAt: '2024-05-20'
  },

  // 20. Snowboard
  {
    id: 'snow-001',
    title: 'Burton Custom Flying V Snowboard',
    description: 'All-mountain snowboard perfect for intermediate to advanced riders. Features Flying V profile for versatile performance on groomed runs and powder.',
    category: 'skiing',
    subcategory: 'snowboarding',
    brand: 'Burton',
    model: 'Custom Flying V',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 45,
    weeklyPrice: 270,
    monthlyPrice: 900,
    securityDeposit: 200,
    location: { city: 'Breckenridge', state: 'CO', zipCode: '80424' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['All-Mountain', 'Flying V Profile', 'Directional Shape', 'Medium Flex'],
    specifications: { 'Length': '158cm', 'Width': '25.2cm', 'Flex': '6/10', 'Profile': 'Flying V', 'Stance': '22.5 inches' },
    owner: { id: 'owner-020', name: 'Powder Rider', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 24 },
    availability: { unavailableDates: ['2024-12-31', '2025-01-01'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-020', userId: 'user-020', userName: 'Snowboard Pro', rating: 5, text: 'Awesome board! Great for all conditions.', date: '2024-03-10' }],
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-05-18'
  },

  // 21. Kayak
  {
    id: 'water-002',
    title: 'Perception Pescador Pro 12 Fishing Kayak',
    description: 'Stable fishing kayak with excellent tracking and storage. Perfect for lakes, rivers, and coastal fishing. Includes paddle and safety gear.',
    category: 'water-sports',
    subcategory: 'kayaking',
    brand: 'Perception',
    model: 'Pescador Pro 12',
    condition: 'Excellent',
    ageInYears: 1,
    dailyPrice: 55,
    weeklyPrice: 330,
    monthlyPrice: 1100,
    securityDeposit: 250,
    location: { city: 'Grand Junction', state: 'CO', zipCode: '81501' },
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Fishing Ready', 'Rod Holders', 'Storage Compartments', 'Paddle Included'],
    specifications: { 'Length': '12 feet', 'Width': '33 inches', 'Weight': '68 lbs', 'Capacity': '375 lbs', 'Material': 'Polyethylene' },
    owner: { id: 'owner-021', name: 'River Explorer', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.7, reviewCount: 38 },
    availability: { unavailableDates: ['2024-07-04', '2024-07-05'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-021', userId: 'user-021', userName: 'Kayak Fisher', rating: 5, text: 'Perfect kayak for fishing! Very stable.', date: '2024-04-30' }],
    status: 'active',
    createdAt: '2024-03-20',
    updatedAt: '2024-05-22'
  },

  // 22. Electric Scooter
  {
    id: 'emob-003',
    title: 'Segway Ninebot Max Electric Scooter',
    description: 'High-performance electric scooter with long range and powerful motor. Perfect for urban exploration and commuting. Foldable design for easy transport.',
    category: 'electric-mobility',
    subcategory: 'scooters',
    brand: 'Segway',
    model: 'Ninebot Max',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 35,
    weeklyPrice: 210,
    monthlyPrice: 700,
    securityDeposit: 150,
    location: { city: 'Denver', state: 'CO', zipCode: '80202' },
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['40-mile Range', 'Foldable', 'App Connectivity', 'LED Display'],
    specifications: { 'Max Speed': '18.6 mph', 'Range': '40.4 miles', 'Weight': '41.2 lbs', 'Max Load': '220 lbs', 'Charge Time': '6 hours' },
    owner: { id: 'owner-022', name: 'Urban Rider', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 45 },
    availability: { unavailableDates: ['2024-06-15'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-022', userId: 'user-022', userName: 'City Explorer', rating: 5, text: 'Amazing scooter! Great range and speed.', date: '2024-05-08' }],
    status: 'active',
    createdAt: '2024-02-28',
    updatedAt: '2024-05-28'
  },

  // 23. Rock Climbing Gear Set
  {
    id: 'climb-002',
    title: 'Black Diamond Complete Climbing Package',
    description: 'Complete rock climbing gear set including harness, helmet, shoes, and hardware. Perfect for sport climbing and traditional routes. All gear professionally inspected.',
    category: 'climbing',
    subcategory: 'sport-climbing',
    brand: 'Black Diamond',
    model: 'Complete Package',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 60,
    weeklyPrice: 360,
    monthlyPrice: 1200,
    securityDeposit: 300,
    location: { city: 'Boulder', state: 'CO', zipCode: '80302' },
    images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Set', 'Safety Inspected', 'Multiple Sizes', 'Guidebook Included'],
    specifications: { 'Harness Size': 'Medium', 'Shoe Size': 'US 10', 'Helmet': 'MIPS Technology', 'Quickdraws': '12 included', 'Rope': '70m Dynamic' },
    owner: { id: 'owner-023', name: 'Vertical Adventures', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 67 },
    availability: { unavailableDates: ['2024-06-28', '2024-06-29'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-023', userId: 'user-023', userName: 'Rock Climber', rating: 5, text: 'Excellent gear! Everything you need to start climbing.', date: '2024-04-18' }],
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-05-15'
  },

  // 24. Camping Cookware Set
  {
    id: 'camp-004',
    title: 'GSI Outdoors Pinnacle Camper Cookset',
    description: 'Complete camping cookware set for 4 people. Includes pots, pans, plates, cups, and utensils. Lightweight and durable for car camping and backpacking.',
    category: 'camping',
    subcategory: 'cookware',
    brand: 'GSI Outdoors',
    model: 'Pinnacle Camper',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 20,
    weeklyPrice: 120,
    monthlyPrice: 400,
    securityDeposit: 100,
    location: { city: 'Fort Collins', state: 'CO', zipCode: '80525' },
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Set', 'Lightweight', 'Nesting Design', 'Easy Clean'],
    specifications: { 'Serves': '4 people', 'Weight': '3.5 lbs', 'Material': 'Hard Anodized Aluminum', 'Includes': 'Pots, pans, plates, cups, utensils', 'Storage': 'Mesh bag included' },
    owner: { id: 'owner-024', name: 'Camp Kitchen Pro', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.7, reviewCount: 33 },
    availability: { unavailableDates: ['2024-07-20'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-024', userId: 'user-024', userName: 'Camp Cook', rating: 4, text: 'Great cookset! Everything you need for camp meals.', date: '2024-05-02' }],
    status: 'active',
    createdAt: '2024-03-05',
    updatedAt: '2024-05-20'
  },

  // 25. Fat Tire Bike
  {
    id: 'bike-003',
    title: 'Surly Ice Cream Truck Fat Bike',
    description: 'Fat tire bike perfect for snow, sand, and rough terrain. Extremely versatile and fun to ride. Great for winter cycling and beach adventures.',
    category: 'biking',
    subcategory: 'fat-bikes',
    brand: 'Surly',
    model: 'Ice Cream Truck',
    condition: 'Good',
    ageInYears: 3,
    dailyPrice: 50,
    weeklyPrice: 300,
    monthlyPrice: 1000,
    securityDeposit: 250,
    location: { city: 'Crested Butte', state: 'CO', zipCode: '81224' },
    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Fat Tires', 'All-Terrain', 'Steel Frame', 'Winter Ready'],
    specifications: { 'Tire Size': '4.8 inches', 'Frame': 'Steel', 'Gears': '1x11 speed', 'Weight': '35 lbs', 'Wheel Size': '26 inches' },
    owner: { id: 'owner-025', name: 'Fat Bike Fanatic', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.6, reviewCount: 29 },
    availability: { unavailableDates: ['2024-12-20', '2024-12-21'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-025', userId: 'user-025', userName: 'Winter Cyclist', rating: 5, text: 'Amazing bike for snow riding! So much fun.', date: '2024-02-28' }],
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-05-10'
  },

  // 26. Hiking Backpack
  {
    id: 'hike-002',
    title: 'Osprey Atmos AG 65 Hiking Backpack',
    description: 'Premium hiking backpack with Anti-Gravity suspension system. Perfect for multi-day backpacking trips. Includes rain cover and hydration compatibility.',
    category: 'hiking',
    subcategory: 'backpacks',
    brand: 'Osprey',
    model: 'Atmos AG 65',
    condition: 'Excellent',
    ageInYears: 1,
    dailyPrice: 25,
    weeklyPrice: 150,
    monthlyPrice: 500,
    securityDeposit: 125,
    location: { city: 'Colorado Springs', state: 'CO', zipCode: '80903' },
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Anti-Gravity Suspension', 'Rain Cover', 'Hydration Compatible', 'Multiple Pockets'],
    specifications: { 'Capacity': '65 liters', 'Weight': '4.56 lbs', 'Torso Length': 'Medium', 'Material': 'Nylon', 'Warranty': 'All Mighty Guarantee' },
    owner: { id: 'owner-026', name: 'Trail Master', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 41 },
    availability: { unavailableDates: ['2024-08-10', '2024-08-11'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-026', userId: 'user-026', userName: 'Backpacker', rating: 5, text: 'Most comfortable pack I\'ve ever used!', date: '2024-04-12' }],
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-05-18'
  },

  // 27. Drone for Outdoor Photography
  {
    id: 'photo-002',
    title: 'DJI Air 2S Drone with Accessories',
    description: 'Professional drone perfect for outdoor photography and videography. Includes extra batteries, ND filters, and carrying case. 4K video and 20MP photos.',
    category: 'photography',
    subcategory: 'drones',
    brand: 'DJI',
    model: 'Air 2S',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 75,
    weeklyPrice: 450,
    monthlyPrice: 1500,
    securityDeposit: 400,
    location: { city: 'Durango', state: 'CO', zipCode: '81301' },
    images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['4K Video', '20MP Photos', 'Extra Batteries', 'ND Filters'],
    specifications: { 'Video': '4K/60fps', 'Photo': '20MP', 'Flight Time': '31 minutes', 'Range': '12km', 'Weight': '595g' },
    owner: { id: 'owner-027', name: 'Aerial Photographer', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 56 },
    availability: { unavailableDates: ['2024-07-15', '2024-07-16'], minimumRental: 1, maximumRental: 5 },
    reviews: [{ id: 'review-027', userId: 'user-027', userName: 'Drone Pilot', rating: 5, text: 'Amazing drone! Perfect for landscape photography.', date: '2024-05-01' }],
    status: 'active',
    createdAt: '2024-03-10',
    updatedAt: '2024-05-25'
  },

  // 28. Surfboard
  {
    id: 'water-003',
    title: 'BOTE Breeze Aero Inflatable SUP/Surf Board',
    description: 'Versatile inflatable board perfect for SUP and surfing. Lightweight, durable, and easy to transport. Includes pump, paddle, and carry bag.',
    category: 'water-sports',
    subcategory: 'surfing',
    brand: 'BOTE',
    model: 'Breeze Aero',
    condition: 'Excellent',
    ageInYears: 1,
    dailyPrice: 45,
    weeklyPrice: 270,
    monthlyPrice: 900,
    securityDeposit: 200,
    location: { city: 'Glenwood Springs', state: 'CO', zipCode: '81601' },
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Inflatable', 'SUP & Surf', 'Pump Included', 'Carry Bag'],
    specifications: { 'Length': '10\'6"', 'Width': '32 inches', 'Thickness': '4.5 inches', 'Weight': '22 lbs', 'Capacity': '240 lbs' },
    owner: { id: 'owner-028', name: 'Water Sports Pro', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.7, reviewCount: 34 },
    availability: { unavailableDates: ['2024-06-30'], minimumRental: 1, maximumRental: 10 },
    reviews: [{ id: 'review-028', userId: 'user-028', userName: 'SUP Surfer', rating: 4, text: 'Great board! Easy to inflate and very stable.', date: '2024-04-20' }],
    status: 'active',
    createdAt: '2024-02-25',
    updatedAt: '2024-05-12'
  },

  // 29. Electric Bike
  {
    id: 'emob-004',
    title: 'Rad Power RadRover 6 Plus Electric Fat Bike',
    description: 'Powerful electric fat bike perfect for trails, snow, and urban riding. Long-range battery and robust motor. Includes charger and accessories.',
    category: 'electric-mobility',
    subcategory: 'e-bikes',
    brand: 'Rad Power',
    model: 'RadRover 6 Plus',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 65,
    weeklyPrice: 390,
    monthlyPrice: 1300,
    securityDeposit: 300,
    location: { city: 'Telluride', state: 'CO', zipCode: '81435' },
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Electric Motor', 'Fat Tires', 'Long Range', 'Pedal Assist'],
    specifications: { 'Motor': '750W', 'Battery': '48V 14Ah', 'Range': '45+ miles', 'Top Speed': '20 mph', 'Weight': '73 lbs' },
    owner: { id: 'owner-029', name: 'E-Bike Explorer', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.8, reviewCount: 39 },
    availability: { unavailableDates: ['2024-08-05'], minimumRental: 1, maximumRental: 7 },
    reviews: [{ id: 'review-029', userId: 'user-029', userName: 'E-Bike Rider', rating: 5, text: 'Incredible e-bike! So much power and range.', date: '2024-04-28' }],
    status: 'active',
    createdAt: '2024-01-25',
    updatedAt: '2024-05-14'
  },

  // 30. Camping Hammock Setup
  {
    id: 'camp-005',
    title: 'ENO DoubleNest Hammock Complete Setup',
    description: 'Complete hammock camping setup including hammock, straps, tarp, and underquilt. Perfect for lightweight camping and backpacking adventures.',
    category: 'camping',
    subcategory: 'hammocks',
    brand: 'ENO',
    model: 'DoubleNest Complete',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 30,
    weeklyPrice: 180,
    monthlyPrice: 600,
    securityDeposit: 150,
    location: { city: 'Estes Park', state: 'CO', zipCode: '80517' },
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    features: ['Complete Setup', 'Lightweight', 'Weather Protection', 'Easy Setup'],
    specifications: { 'Capacity': '2 people', 'Weight': '3.5 lbs total', 'Dimensions': '9\'4" x 6\'2"', 'Material': 'Nylon Taffeta', 'Includes': 'Hammock, straps, tarp, underquilt' },
    owner: { id: 'owner-030', name: 'Hammock Camper', avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80', rating: 4.9, reviewCount: 27 },
    availability: { unavailableDates: ['2024-09-01', '2024-09-02'], minimumRental: 1, maximumRental: 14 },
    reviews: [{ id: 'review-030', userId: 'user-030', userName: 'Tree Sleeper', rating: 5, text: 'Best hammock setup ever! So comfortable.', date: '2024-05-15' }],
    status: 'active',
    createdAt: '2024-03-12',
    updatedAt: '2024-05-30'
  },

  // 31. Professional Ski Touring Setup
  {
    id: 'ski-003',
    title: 'Dynafit Radical Pro Ski Touring Complete Kit',
    description: 'Professional ski touring setup including lightweight skis, touring bindings, boots, and avalanche safety gear. Perfect for backcountry skiing and ski mountaineering adventures.',
    category: 'skiing',
    subcategory: 'ski-touring',
    brand: 'Dynafit',
    model: 'Radical Pro Complete',
    condition: 'Excellent',
    ageInYears: 1,
    dailyPrice: 85,
    weeklyPrice: 510,
    monthlyPrice: 1700,
    securityDeposit: 400,
    location: { city: 'Aspen', state: 'CO', zipCode: '81611' },
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Lightweight', 'Touring Bindings', 'Avalanche Safety Gear', 'Professional Grade'],
    specifications: {
      'Ski Length': '172cm',
      'Boot Size': 'US 10.5',
      'Binding': 'Dynafit Radical',
      'Weight': '6.2 lbs (skis + bindings)',
      'Waist Width': '88mm',
      'Safety Gear': 'Beacon, probe, shovel included'
    },
    owner: {
      id: 'owner-031',
      name: 'Alpine Guide Services',
      avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 73
    },
    availability: {
      unavailableDates: ['2024-12-25', '2024-12-26', '2024-12-27'],
      minimumRental: 1,
      maximumRental: 7
    },
    reviews: [
      {
        id: 'review-031',
        userId: 'user-031',
        userName: 'Backcountry Skier',
        rating: 5,
        text: 'Incredible touring setup! Lightweight and reliable for backcountry adventures. The safety gear is top-notch.',
        date: '2024-03-15'
      },
      {
        id: 'review-032',
        userId: 'user-032',
        userName: 'Mountain Guide',
        rating: 5,
        text: 'Professional quality gear. Perfect for ski mountaineering.',
        date: '2024-02-28'
      }
    ],
    status: 'active',
    createdAt: '2024-01-10',
    updatedAt: '2024-05-28'
  },

  // 32. Premium Gravel Bike
  {
    id: 'bike-004',
    title: 'Specialized Diverge Expert Carbon Gravel Bike',
    description: 'High-end carbon gravel bike perfect for mixed terrain adventures. Features electronic shifting, tubeless wheels, and comfortable geometry for long-distance rides on roads, gravel, and light trails.',
    category: 'biking',
    subcategory: 'gravel-bikes',
    brand: 'Specialized',
    model: 'Diverge Expert Carbon',
    condition: 'Like New',
    ageInYears: 1,
    dailyPrice: 75,
    weeklyPrice: 450,
    monthlyPrice: 1500,
    securityDeposit: 400,
    location: { city: 'Boulder', state: 'CO', zipCode: '80301' },
    images: [
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Carbon Frame', 'Electronic Shifting', 'Tubeless Ready', 'Adventure Geometry'],
    specifications: {
      'Frame': 'FACT 9r Carbon',
      'Size': 'Medium (54cm)',
      'Weight': '19.5 lbs',
      'Gears': 'SRAM Force eTap AXS 12-speed',
      'Wheels': '700c Tubeless',
      'Tire Clearance': '47mm',
      'Suspension': 'Future Shock 2.0'
    },
    owner: {
      id: 'owner-032',
      name: 'Gravel Cycling Co',
      avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      rating: 4.8,
      reviewCount: 47
    },
    availability: {
      unavailableDates: ['2024-07-04', '2024-07-05', '2024-07-06'],
      minimumRental: 1,
      maximumRental: 10
    },
    reviews: [
      {
        id: 'review-033',
        userId: 'user-033',
        userName: 'Gravel Enthusiast',
        rating: 5,
        text: 'Amazing bike! The electronic shifting is so smooth and the carbon frame is incredibly comfortable on long rides.',
        date: '2024-04-20'
      },
      {
        id: 'review-034',
        userId: 'user-034',
        userName: 'Adventure Cyclist',
        rating: 5,
        text: 'Perfect for mixed terrain. Handled everything from smooth roads to rough gravel with ease.',
        date: '2024-05-10'
      }
    ],
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-05-30'
  },

  // 33. Complete Whitewater Rafting Package
  {
    id: 'water-004',
    title: 'AIRE Super Puma 14ft Whitewater Raft Complete Package',
    description: 'Professional whitewater rafting package including self-bailing raft, paddles, helmets, life jackets, and safety gear. Perfect for Class III-IV rapids and multi-day river trips.',
    category: 'water-sports',
    subcategory: 'rafting',
    brand: 'AIRE',
    model: 'Super Puma 14ft',
    condition: 'Good',
    ageInYears: 2,
    dailyPrice: 120,
    weeklyPrice: 720,
    monthlyPrice: 2400,
    securityDeposit: 600,
    location: { city: 'Buena Vista', state: 'CO', zipCode: '81211' },
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Self-Bailing', 'Complete Safety Gear', 'Professional Grade', 'Multi-Day Capable'],
    specifications: {
      'Length': '14 feet',
      'Width': '6.5 feet',
      'Capacity': '8 people',
      'Weight': '85 lbs',
      'Material': 'PVC with Polyester',
      'Tubes': '18 inch diameter',
      'Includes': 'Raft, 8 paddles, 8 helmets, 8 life jackets, pump, repair kit'
    },
    owner: {
      id: 'owner-033',
      name: 'Colorado River Expeditions',
      avatar: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 89
    },
    availability: {
      unavailableDates: ['2024-07-15', '2024-07-16', '2024-07-17', '2024-07-18'],
      minimumRental: 1,
      maximumRental: 5
    },
    reviews: [
      {
        id: 'review-035',
        userId: 'user-035',
        userName: 'River Runner',
        rating: 5,
        text: 'Excellent raft! Handled Class IV rapids perfectly. All safety gear included and in great condition.',
        date: '2024-05-20'
      },
      {
        id: 'review-036',
        userId: 'user-036',
        userName: 'Whitewater Guide',
        rating: 4,
        text: 'Professional quality equipment. Perfect for multi-day river trips.',
        date: '2024-04-15'
      },
      {
        id: 'review-037',
        userId: 'user-037',
        userName: 'Adventure Family',
        rating: 5,
        text: 'Had an amazing family rafting trip! The raft was stable and all the safety gear fit perfectly.',
        date: '2024-05-05'
      }
    ],
    status: 'active',
    createdAt: '2024-01-20',
    updatedAt: '2024-05-25'
  }
];

// Featured gear for homepage (subset of products)
export const featuredGear = [
  { id: 'camp-001', title: 'Premium 4-Person Tent', price: '$35/day', location: 'Denver, CO', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: 'emob-001', title: 'OneWheel Pint X Electric Board', price: '$65/day', location: 'Boulder, CO', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: 'bike-004', title: 'Specialized Diverge Expert Carbon Gravel Bike', price: '$75/day', location: 'Boulder, CO', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
  { id: 'water-004', title: 'AIRE Super Puma 14ft Whitewater Raft', price: '$120/day', location: 'Buena Vista, CO', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
];

// Categories for homepage
export const categories = [
  { id: 'camping', name: 'Camping', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'biking', name: 'Biking', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'electric-mobility', name: 'E-Mobility', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'skating', name: 'Skating', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'hiking', name: 'Hiking', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'skiing', name: 'Skiing', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'climbing', name: 'Climbing', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'water-sports', name: 'Water Sports', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'photography', name: 'Photography', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { id: 'fishing', name: 'Fishing', image: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' }
];

// Helper functions for product data
export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(product => product.category === category);
}

export function getProductsByLocation(city: string, state?: string): Product[] {
  return products.filter(product => {
    if (state) {
      return product.location.city.toLowerCase() === city.toLowerCase() &&
             product.location.state.toLowerCase() === state.toLowerCase();
    }
    return product.location.city.toLowerCase() === city.toLowerCase();
  });
}

export function searchProducts(query: string): Product[] {
  const searchTerm = query.toLowerCase();
  return products.filter(product =>
    product.title.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.features.some(feature => feature.toLowerCase().includes(searchTerm))
  );
}
