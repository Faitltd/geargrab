// Authentication related types

import type { User as FirebaseUser } from 'firebase/auth';
import type { BaseEntity } from './common';

export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export interface UserProfile extends BaseEntity {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  profile?: UserProfileData;
}

export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  preferences?: UserPreferences;
  verification?: UserVerification;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  marketing: {
    newsletter: boolean;
    promotions: boolean;
  };
}

export interface UserVerification {
  isVerified: boolean;
  verifiedAt?: string;
  documents?: {
    idVerified: boolean;
    addressVerified: boolean;
    phoneVerified: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface AuthError {
  code: string;
  message: string;
}
