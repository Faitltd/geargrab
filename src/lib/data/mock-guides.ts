/**
 * Mock Guide Data Generator
 * 
 * Generates realistic outdoor guide profiles and bookings for testing GearGrab guide functionality
 */

import type { Guide, GuideBooking } from '$lib/types/firestore';
import type { User } from '$lib/types/firestore';
import {
  MOCK_DATA_CONSTANTS,
  createTimestamp,
  randomDate,
  randomChoice,
  randomChoices,
  generateGuideId,
  generateBookingId,
  generatePrice,
  generateRating,
  generateCoordinates
} from './mock-data-generator';

// Generate guide bio based on specialties
function generateGuideBio(specialties: string[], experience: string): string {
  const bioTemplates = [
    `Professional outdoor guide with ${experience} of experience specializing in {specialties}. Passionate about sharing the mountains and helping others discover their love for the outdoors.`,
    `Certified guide with ${experience} in the field. I specialize in {specialties} and love introducing people to new adventures while keeping safety as the top priority.`,
    `Experienced outdoor professional with ${experience} guiding in Colorado and beyond. My expertise includes {specialties}. Let's explore the wilderness together!`,
    `${experience} guide specializing in {specialties}. I believe the best adventures happen when you're properly prepared and have an experienced guide by your side.`,
    `Professional guide with ${experience} of mountain experience. Specializing in {specialties}, I'm dedicated to providing safe, educational, and unforgettable outdoor experiences.`
  ];
  
  const template = randomChoice(bioTemplates);
  const specialtyText = specialties.length > 2 ? 
    `${specialties.slice(0, -1).join(', ')}, and ${specialties[specialties.length - 1]}` :
    specialties.join(' and ');
  
  return template
    .replace('{specialties}', specialtyText.toLowerCase())
    .replace(/\${experience}/g, experience);
}

// Generate guide rates based on specialties and experience
function generateGuideRates(specialties: string[], experience: string): {
  hourlyRate: number;
  dayRate: number;
} {
  // Base rates by specialty (higher for technical skills)
  const specialtyRates = {
    'Rock Climbing': 80,
    'Alpine Climbing': 100,
    'Ice Climbing': 120,
    'Mountaineering': 110,
    'Backcountry Skiing': 90,
    'Ski Touring': 85,
    'Avalanche Safety': 95,
    'Wilderness First Aid': 75,
    'Photography': 70,
    'Hiking': 50,
    'Backpacking': 60,
    'Mountain Biking': 65,
    'Kayaking': 70,
    'Fishing': 60
  };
  
  // Calculate base rate from specialties
  const avgSpecialtyRate = specialties.reduce((sum, specialty) => {
    return sum + (specialtyRates[specialty as keyof typeof specialtyRates] || 60);
  }, 0) / specialties.length;
  
  // Experience multiplier
  const experienceYears = parseInt(experience.match(/\d+/)?.[0] || '3');
  const experienceMultiplier = Math.min(1 + (experienceYears - 1) * 0.1, 2.0); // Max 2x for experience
  
  const hourlyRate = Math.floor(avgSpecialtyRate * experienceMultiplier);
  const dayRate = Math.floor(hourlyRate * 7); // 7-hour day with slight discount
  
  return { hourlyRate, dayRate };
}

// Generate guide availability
function generateAvailability(): {
  daysOfWeek: string[];
  timeSlots: string[];
  advanceBooking: number;
} {
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const availableDays = randomChoices(allDays, Math.floor(Math.random() * 4) + 4); // 4-7 days available
  
  const timeSlots = [];
  if (Math.random() > 0.2) timeSlots.push('morning');
  if (Math.random() > 0.1) timeSlots.push('afternoon');
  if (Math.random() > 0.4) timeSlots.push('evening');
  if (Math.random() > 0.7) timeSlots.push('full_day');
  
  const advanceBooking = randomChoice([1, 2, 3, 7, 14]); // Days in advance required
  
  return {
    daysOfWeek: availableDays,
    timeSlots: timeSlots.length > 0 ? timeSlots : ['morning', 'afternoon'],
    advanceBooking
  };
}

// Generate guide equipment list
function generateEquipment(specialties: string[]): string[] {
  const equipmentBySpecialty = {
    'Rock Climbing': ['Ropes', 'Harnesses', 'Helmets', 'Belay Devices', 'Quickdraws', 'Anchoring Gear'],
    'Alpine Climbing': ['Mountaineering Gear', 'Ice Axes', 'Crampons', 'Ropes', 'Helmets', 'Avalanche Gear'],
    'Ice Climbing': ['Ice Tools', 'Crampons', 'Helmets', 'Ropes', 'Ice Screws', 'Belay Devices'],
    'Mountaineering': ['Mountaineering Boots', 'Ice Axes', 'Crampons', 'Ropes', 'Avalanche Gear'],
    'Backcountry Skiing': ['Avalanche Transceivers', 'Probes', 'Shovels', 'First Aid Kit'],
    'Ski Touring': ['Touring Skis', 'Skins', 'Avalanche Safety Gear', 'Navigation Tools'],
    'Hiking': ['Navigation Tools', 'First Aid Kit', 'Emergency Shelter', 'Water Purification'],
    'Backpacking': ['Backpacks', 'Tents', 'Sleeping Systems', 'Cooking Gear', 'Navigation'],
    'Photography': ['Camera Equipment', 'Tripods', 'Filters', 'Backup Gear'],
    'Kayaking': ['Kayaks', 'Paddles', 'PFDs', 'Safety Equipment', 'Dry Bags'],
    'Mountain Biking': ['Bikes', 'Helmets', 'Repair Tools', 'First Aid Kit'],
    'Wilderness First Aid': ['First Aid Supplies', 'Emergency Equipment', 'Communication Devices']
  };
  
  const equipment = new Set<string>();
  
  for (const specialty of specialties) {
    const specialtyEquipment = equipmentBySpecialty[specialty as keyof typeof equipmentBySpecialty] || [];
    specialtyEquipment.forEach(item => equipment.add(item));
  }
  
  // Add common items
  equipment.add('First Aid Kit');
  equipment.add('Emergency Communication');
  equipment.add('Weather Protection');
  
  return Array.from(equipment);
}

// Generate a single mock guide
export function generateMockGuide(user: User, options: {
  specialties?: string[];
  isVerified?: boolean;
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  createdDaysAgo?: number;
} = {}): Guide {
  const specialties = options.specialties || randomChoices(MOCK_DATA_CONSTANTS.GUIDE_SPECIALTIES, Math.floor(Math.random() * 4) + 2);
  const certifications = randomChoices(MOCK_DATA_CONSTANTS.CERTIFICATIONS, Math.floor(Math.random() * 3) + 2);
  const languages = randomChoices(MOCK_DATA_CONSTANTS.LANGUAGES, Math.floor(Math.random() * 2) + 1);
  
  const experienceYears = Math.floor(Math.random() * 15) + 2; // 2-16 years
  const experience = `${experienceYears}+ years`;
  
  const { hourlyRate, dayRate } = generateGuideRates(specialties, experience);
  const availability = generateAvailability();
  const equipment = generateEquipment(specialties);
  
  const createdAt = options.createdDaysAgo 
    ? new Date(Date.now() - (options.createdDaysAgo * 24 * 60 * 60 * 1000))
    : randomDate(new Date(2023, 0, 1), new Date());
    
  const updatedAt = randomDate(createdAt, new Date());
  
  // Parse location from user
  const locationParts = user.location?.split(', ') || ['Denver', 'CO'];
  const cityName = locationParts[0];
  const state = locationParts[1] || 'CO';
  const cityData = MOCK_DATA_CONSTANTS.CITIES.find(c => c.name === cityName) || MOCK_DATA_CONSTANTS.CITIES[0];
  const zipCode = randomChoice(cityData.zipCodes);
  
  // Generate guide images (professional outdoor photos)
  const imageCount = Math.floor(Math.random() * 3) + 2; // 2-4 images
  const images: string[] = [];
  for (let i = 0; i < imageCount; i++) {
    const imageId = 1500000000 + Math.floor(Math.random() * 100000000);
    images.push(`https://images.unsplash.com/photo-${imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&q=outdoor-guide`);
  }
  
  const status = options.status || (Math.random() > 0.1 ? 'active' : randomChoice(['pending', 'inactive']));
  const isVerified = options.isVerified ?? (status === 'active' && Math.random() > 0.2); // 80% of active guides are verified
  
  const guide: Guide = {
    id: generateGuideId(),
    guideId: user.uid,
    guideUid: user.uid, // Legacy compatibility
    displayName: user.displayName || `${randomChoice(MOCK_DATA_CONSTANTS.FIRST_NAMES)} ${randomChoice(MOCK_DATA_CONSTANTS.LAST_NAMES)}`,
    bio: generateGuideBio(specialties, experience),
    specialties,
    certifications,
    experience,
    hourlyRate,
    dayRate,
    location: {
      city: cityName,
      state,
      zipCode
    },
    coordinates: generateCoordinates(cityData),
    serviceArea: {
      radius: Math.floor(Math.random() * 50) + 25, // 25-75 mile radius
      travelFee: Math.random() > 0.5 ? generatePrice(25, 100) : undefined
    },
    availability,
    images,
    languages,
    equipment,
    createdAt: createTimestamp(createdAt),
    updatedAt: createTimestamp(updatedAt),
    isActive: status === 'active',
    isVerified,
    totalBookings: Math.floor(Math.random() * 50),
    avgRating: Math.random() > 0.3 ? generateRating() + Math.random() : undefined,
    averageRating: Math.random() > 0.3 ? generateRating() + Math.random() : undefined,
    reviewCount: Math.floor(Math.random() * 25),
    responseTime: randomChoice(['within 1 hour', 'within 2 hours', 'within 4 hours', 'within 24 hours']),
    status
  };
  
  return guide;
}

// Generate guide booking
export function generateMockGuideBooking(guide: Guide, client: User, options: {
  createdDaysAgo?: number;
  forceStatus?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
} = {}): GuideBooking {
  // Generate service date (future or past based on status)
  const now = new Date();
  const isHistorical = Math.random() < 0.6; // 60% historical bookings
  
  let serviceDate: Date;
  if (isHistorical) {
    serviceDate = new Date(now.getTime() - (Math.random() * 180 * 24 * 60 * 60 * 1000)); // Up to 180 days ago
  } else {
    serviceDate = new Date(now.getTime() + (Math.random() * 90 * 24 * 60 * 60 * 1000)); // Up to 90 days future
  }
  
  const duration = randomChoice([4, 6, 8, 10]); // Hours
  const startTime = randomChoice(['06:00', '07:00', '08:00', '09:00', '10:00']);
  const endHour = parseInt(startTime.split(':')[0]) + duration;
  const endTime = `${endHour.toString().padStart(2, '0')}:00`;
  
  const serviceType = randomChoice(['instruction', 'guided_tour', 'consultation', 'equipment_demo', 'custom']);
  const specialty = randomChoice(guide.specialties);
  
  // Calculate pricing
  const totalCost = duration * guide.hourlyRate;
  const serviceFee = Math.floor(totalCost * 0.1); // 10% service fee
  const totalPrice = totalCost + serviceFee;
  
  // Determine status
  let status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  let paymentStatus: 'pending' | 'paid' | 'refunded';
  
  if (options.forceStatus) {
    status = options.forceStatus;
    paymentStatus = status === 'pending' ? 'pending' : 'paid';
  } else {
    if (serviceDate < now) {
      status = Math.random() < 0.95 ? 'completed' : 'cancelled';
      paymentStatus = status === 'cancelled' && Math.random() < 0.8 ? 'refunded' : 'paid';
    } else {
      const daysTillService = (serviceDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      if (daysTillService > 7) {
        status = Math.random() < 0.8 ? 'confirmed' : 'pending';
        paymentStatus = status === 'pending' ? 'pending' : 'paid';
      } else {
        status = 'confirmed';
        paymentStatus = 'paid';
      }
    }
  }
  
  const createdAt = options.createdDaysAgo 
    ? new Date(Date.now() - (options.createdDaysAgo * 24 * 60 * 60 * 1000))
    : new Date(serviceDate.getTime() - (Math.random() * 14 * 24 * 60 * 60 * 1000)); // Created 0-14 days before service
  
  const updatedAt = randomDate(createdAt, new Date());
  
  // Generate location details
  const locationType = randomChoice(['guide_location', 'client_location', 'meet_point']);
  const locationDetails = {
    type: locationType,
    address: locationType === 'guide_location' ? 
      `${guide.location.city}, ${guide.location.state}` :
      `${Math.floor(Math.random() * 9999) + 1} ${randomChoice(['Trail', 'Mountain', 'Park', 'Base'])} ${randomChoice(['Road', 'Drive', 'Way', 'Trail'])}, ${guide.location.city}, ${guide.location.state}`,
    coordinates: guide.coordinates,
    details: locationType === 'meet_point' ? 'Meet at trailhead parking area' : 'Exact location will be shared upon booking confirmation'
  };
  
  const guideBooking: GuideBooking = {
    id: generateBookingId(),
    guideId: guide.id,
    guideName: guide.displayName,
    guideImage: guide.images[0] || '',
    guideUid: guide.guideUid,
    clientId: client.uid,
    clientUid: client.uid,
    serviceDate: createTimestamp(serviceDate),
    startTime,
    endTime,
    duration,
    serviceType,
    specialty,
    location: locationDetails,
    totalCost,
    serviceFee,
    totalPrice,
    status,
    paymentStatus,
    paymentIntentId: paymentStatus !== 'pending' ? `pi_${Math.random().toString(36).substr(2, 24)}` : undefined,
    specialRequests: Math.random() > 0.7 ? randomChoice([
      'First time doing this activity, please be patient',
      'Looking to improve specific techniques',
      'Interested in photography opportunities',
      'Have some experience but want to learn advanced skills',
      'Planning for a bigger expedition later'
    ]) : undefined,
    createdAt: createTimestamp(createdAt),
    updatedAt: createTimestamp(updatedAt),
    confirmedAt: status !== 'pending' ? createTimestamp(new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)) : undefined,
    completedAt: status === 'completed' ? createTimestamp(new Date(serviceDate.getTime() + duration * 60 * 60 * 1000)) : undefined,
    clientReviewed: status === 'completed' ? Math.random() > 0.2 : false, // 80% of completed bookings have reviews
    guideReviewed: status === 'completed' ? Math.random() > 0.3 : false // 70% of completed bookings have guide reviews
  };
  
  return guideBooking;
}

// Generate multiple guides
export function generateMockGuides(users: User[], count: number): Guide[] {
  const guides: Guide[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    guides.push(generateMockGuide(user, {
      createdDaysAgo: Math.floor(Math.random() * 365)
    }));
  }
  
  return guides;
}

// Generate guide bookings
export function generateMockGuideBookings(guides: Guide[], clients: User[], totalBookings: number): GuideBooking[] {
  const bookings: GuideBooking[] = [];
  
  for (let i = 0; i < totalBookings; i++) {
    const guide = randomChoice(guides.filter(g => g.isActive));
    const client = randomChoice(clients.filter(c => c.uid !== guide.guideUid));
    
    if (guide && client) {
      bookings.push(generateMockGuideBooking(guide, client, {
        createdDaysAgo: Math.floor(Math.random() * 365)
      }));
    }
  }
  
  return bookings;
}
