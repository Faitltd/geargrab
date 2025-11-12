import type { Timestamp } from 'firebase/firestore';

export interface ListingLocation {
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface Listing {
  id: string;
  ownerUid: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  location?: ListingLocation;
  images?: string[];
  status?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  [key: string]: unknown;
}

export interface Booking {
  id: string;
  listingId: string;
  renterUid: string;
  ownerUid: string;
  status: string;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  totalPrice?: number;
  deliveryMethod?: string;
  upfrontPaymentStatus?: string;
  rentalPaymentStatus?: string;
  securityDepositStatus?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  [key: string]: unknown;
}

export interface Guide {
  id: string;
  userId: string;
  specialties: string[];
  certifications: string[];
  experience: string;
  hourlyRate: number;
  dayRate: number;
  availability: {
    daysOfWeek: string[];
    timeSlots: string[];
    advanceBooking: number;
  };
  equipment?: string[];
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  serviceArea?: string[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  [key: string]: unknown;
}

export interface GuideBooking {
  id: string;
  guideId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  meetingPoint?: string;
  price?: number;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  notes?: string;
  [key: string]: unknown;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  isVerified?: boolean;
  backgroundCheckStatus?: string;
  backgroundCheckId?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  [key: string]: unknown;
}
