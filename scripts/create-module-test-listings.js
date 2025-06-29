#!/usr/bin/env node

/**
 * Create Module Test Listings Script
 * Creates one comprehensive test listing for each major module/category
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

async function createModuleTestListings() {
  try {
    console.log('🏕️ Creating comprehensive test listings for each module...');
    
    const db = admin.firestore();

    // Get a test user to be the owner
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (usersSnapshot.empty) {
      throw new Error('No users found to create listings for');
    }

    const testUser = { id: usersSnapshot.docs[0].id, ...usersSnapshot.docs[0].data() };
    console.log(`Using test user: ${testUser.email || testUser.displayName || testUser.id}`);

    // Define comprehensive test listings for each module
    const moduleListings = [
      {
        // CAMPING MODULE
        title: "REI Co-op Kingdom 8 Family Tent - Premium Camping",
        description: "Spacious 8-person family tent perfect for car camping and extended outdoor adventures. Features two rooms, vestibule, and excellent weather protection. Includes footprint, stakes, and guy lines. Recently serviced and waterproofed.",
        category: "camping",
        subcategory: "tents",
        brand: "REI Co-op",
        model: "Kingdom 8",
        condition: "Excellent",
        dailyPrice: 45,
        weeklyPrice: 270,
        monthlyPrice: 900,
        securityDeposit: 150,
        features: [
          "Sleeps 8 people",
          "Two rooms",
          "Vestibule",
          "Waterproof",
          "Easy setup",
          "Includes footprint",
          "Color-coded poles",
          "Multiple doors"
        ],
        specifications: {
          capacity: "8 people",
          weight: "22 lbs",
          dimensions: "14 x 10 ft",
          height: "6 ft 8 in",
          material: "75D polyester",
          waterproof: "3000mm"
        },
        includedItems: [
          "Tent body",
          "Rainfly",
          "Footprint",
          "Stakes (16)",
          "Guy lines",
          "Stuff sack",
          "Setup instructions"
        ]
      },
      {
        // HIKING MODULE
        title: "Osprey Atmos AG 65L Backpack - Anti-Gravity Suspension",
        description: "Professional-grade hiking backpack with revolutionary Anti-Gravity suspension system. Perfect for multi-day backpacking trips. Includes rain cover, hydration reservoir, and all original accessories. Professionally cleaned and inspected.",
        category: "hiking",
        subcategory: "backpacks",
        brand: "Osprey",
        model: "Atmos AG 65",
        condition: "Like New",
        dailyPrice: 25,
        weeklyPrice: 150,
        monthlyPrice: 500,
        securityDeposit: 100,
        features: [
          "Anti-Gravity suspension",
          "65L capacity",
          "Adjustable torso",
          "Rain cover included",
          "Hydration compatible",
          "Multiple pockets",
          "Trekking pole attachment",
          "Sleeping bag compartment"
        ],
        specifications: {
          capacity: "65 liters",
          weight: "4 lbs 6 oz",
          torsoRange: "16-21 inches",
          material: "210D nylon",
          frameType: "Internal",
          hipBeltSize: "S/M/L/XL"
        },
        includedItems: [
          "Backpack",
          "Rain cover",
          "Hydration reservoir",
          "Sleeping bag divider",
          "Hip belt pockets",
          "Care instructions"
        ]
      },
      {
        // CYCLING MODULE
        title: "Trek Fuel EX 8 Full Suspension Mountain Bike - Trail Ready",
        description: "High-performance full suspension mountain bike perfect for trail riding and cross-country adventures. Recently tuned with new brake pads and chain. Includes helmet, repair kit, and bike lock. Suitable for intermediate to advanced riders.",
        category: "cycling",
        subcategory: "mountain_bikes",
        brand: "Trek",
        model: "Fuel EX 8",
        condition: "Very Good",
        dailyPrice: 75,
        weeklyPrice: 450,
        monthlyPrice: 1500,
        securityDeposit: 300,
        features: [
          "Full suspension",
          "29-inch wheels",
          "12-speed drivetrain",
          "Hydraulic disc brakes",
          "Tubeless ready",
          "Recently serviced",
          "Helmet included",
          "Repair kit included"
        ],
        specifications: {
          frameSize: "Large (19.5\")",
          wheelSize: "29 inches",
          suspension: "120mm front/rear",
          drivetrain: "SRAM NX 12-speed",
          brakes: "Shimano hydraulic disc",
          weight: "32 lbs"
        },
        includedItems: [
          "Mountain bike",
          "Helmet (adjustable)",
          "Bike lock",
          "Repair kit",
          "Pump",
          "Water bottle cage",
          "Quick start guide"
        ]
      },
      {
        // PHOTOGRAPHY MODULE
        title: "Canon EOS R5 Mirrorless Camera Kit - Professional Photography",
        description: "Professional-grade mirrorless camera with 45MP sensor and 8K video capability. Complete kit with multiple lenses, tripod, and accessories. Perfect for landscape, portrait, and wildlife photography. Includes extra batteries and memory cards.",
        category: "photography",
        subcategory: "cameras",
        brand: "Canon",
        model: "EOS R5",
        condition: "Excellent",
        dailyPrice: 120,
        weeklyPrice: 720,
        monthlyPrice: 2400,
        securityDeposit: 500,
        features: [
          "45MP full-frame sensor",
          "8K video recording",
          "In-body stabilization",
          "Dual memory card slots",
          "Weather sealed",
          "Multiple lenses included",
          "Professional tripod",
          "Extra batteries"
        ],
        specifications: {
          sensor: "45MP full-frame CMOS",
          videoResolution: "8K/4K",
          isoRange: "100-51200",
          autofocus: "1053 points",
          stabilization: "8 stops IBIS",
          batteryLife: "320 shots"
        },
        includedItems: [
          "Canon EOS R5 body",
          "RF 24-70mm f/2.8L lens",
          "RF 70-200mm f/4L lens",
          "Carbon fiber tripod",
          "Extra batteries (3)",
          "Memory cards (128GB x2)",
          "Camera bag",
          "Lens filters",
          "Remote shutter"
        ]
      },
      {
        // WATER SPORTS MODULE
        title: "BOTE Breeze Aero Inflatable SUP - Stand Up Paddleboard",
        description: "Premium inflatable stand-up paddleboard perfect for lakes, rivers, and calm ocean waters. Includes high-pressure pump, paddle, leash, and waterproof bag. Lightweight and portable design makes it easy to transport to any water destination.",
        category: "water_sports",
        subcategory: "paddleboards",
        brand: "BOTE",
        model: "Breeze Aero 11'6\"",
        condition: "Like New",
        dailyPrice: 55,
        weeklyPrice: 330,
        monthlyPrice: 1100,
        securityDeposit: 200,
        features: [
          "Inflatable design",
          "11'6\" length",
          "Stable platform",
          "Quick inflation",
          "Includes paddle",
          "Safety leash",
          "Waterproof bag",
          "Repair kit"
        ],
        specifications: {
          length: "11'6\"",
          width: "32 inches",
          thickness: "6 inches",
          weight: "26 lbs",
          capacity: "275 lbs",
          material: "Military-grade PVC"
        },
        includedItems: [
          "Inflatable SUP board",
          "Adjustable paddle",
          "High-pressure pump",
          "Safety leash",
          "Waterproof bag",
          "Repair kit",
          "Pressure gauge",
          "Setup instructions"
        ]
      },
      {
        // WINTER SPORTS MODULE
        title: "Rossignol Experience 88 Ti Skis - All-Mountain Performance",
        description: "High-performance all-mountain skis perfect for intermediate to advanced skiers. Includes bindings, poles, and boot recommendations. Recently waxed and edges tuned. Ideal for groomed runs and light powder conditions.",
        category: "winter_sports",
        subcategory: "skis",
        brand: "Rossignol",
        model: "Experience 88 Ti",
        condition: "Very Good",
        dailyPrice: 65,
        weeklyPrice: 390,
        monthlyPrice: 1300,
        securityDeposit: 250,
        features: [
          "All-mountain design",
          "Titanium construction",
          "88mm waist width",
          "Bindings included",
          "Poles included",
          "Recently tuned",
          "Versatile performance",
          "Boot size guide"
        ],
        specifications: {
          length: "172cm",
          waistWidth: "88mm",
          construction: "Titanium/wood core",
          bindingType: "Look SPX 12",
          skillLevel: "Intermediate-Advanced",
          terrain: "All-mountain"
        },
        includedItems: [
          "Rossignol skis (172cm)",
          "Look SPX 12 bindings",
          "Ski poles",
          "Ski bag",
          "Boot size guide",
          "Wax kit",
          "Safety tips"
        ]
      }
    ];

    const batch = db.batch();
    let createdListings = 0;

    // Create each test listing
    for (const listingData of moduleListings) {
      // Add common fields
      const completeListingData = {
        ...listingData,
        ownerUid: testUser.id,
        ownerEmail: testUser.email || 'test@geargrab.co',
        ownerName: testUser.displayName || 'Test Owner',
        isActive: true,
        isAvailable: true,
        isVerified: true,
        isFeatured: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        
        // Location data (Colorado locations)
        location: {
          lat: 39.7392 + (Math.random() - 0.5) * 0.2,
          lng: -104.9903 + (Math.random() - 0.5) * 0.2,
          city: "Denver",
          state: "CO",
          zipCode: "80202",
          address: "Denver, CO",
          country: "US"
        },

        // Availability
        availableDates: [],
        unavailableDates: [],
        minimumRental: 1,
        maximumRental: 30,
        advanceBooking: 90,

        // Images (placeholder)
        images: [
          `/images/gear/${listingData.category}/${listingData.subcategory}/main.jpg`,
          `/images/gear/${listingData.category}/${listingData.subcategory}/detail1.jpg`,
          `/images/gear/${listingData.category}/${listingData.subcategory}/detail2.jpg`
        ],

        // Ratings and reviews
        averageRating: 4.8,
        totalReviews: Math.floor(Math.random() * 20) + 5,
        totalBookings: Math.floor(Math.random() * 50) + 10,

        // Policies
        cancellationPolicy: "flexible",
        deliveryOptions: ["pickup", "delivery"],
        deliveryRadius: 25,
        deliveryFee: 15,

        // Insurance and guarantee
        guaranteeCoverage: {
          standard: true,
          premium: true,
          maxValue: listingData.securityDeposit * 10
        },

        // SEO and search
        tags: [
          listingData.category,
          listingData.subcategory,
          listingData.brand.toLowerCase(),
          "outdoor",
          "rental",
          "colorado",
          "denver"
        ],
        searchKeywords: `${listingData.title} ${listingData.brand} ${listingData.category} ${listingData.subcategory} rental denver colorado outdoor gear`,

        // Analytics
        views: Math.floor(Math.random() * 500) + 100,
        favorites: Math.floor(Math.random() * 50) + 10,
        inquiries: Math.floor(Math.random() * 30) + 5
      };

      const listingRef = db.collection('listings').doc();
      batch.set(listingRef, completeListingData);

      createdListings++;
      console.log(`   ✓ Created ${listingData.category} listing: ${listingData.title}`);
    }

    // Commit all listings
    await batch.commit();
    console.log(`✅ Created ${createdListings} comprehensive module test listings`);

    // Verify the listings
    console.log('\n🔍 Verifying created listings...');
    
    const newListingsSnapshot = await db.collection('listings')
      .where('isFeatured', '==', true)
      .get();

    const categoryCount = {};
    newListingsSnapshot.forEach(doc => {
      const listing = doc.data();
      const category = listing.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    console.log('📊 Module Coverage:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} listings`);
    });

    console.log('\n🎉 All module test listings created successfully!');
    console.log('✅ Each major category now has comprehensive test data');

  } catch (error) {
    console.error('❌ Error creating module test listings:', error);
    throw error;
  }
}

// Run the script
createModuleTestListings()
  .then(() => {
    console.log('\n🚀 Module test listings creation completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
