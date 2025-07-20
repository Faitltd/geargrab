// Sales related types

import type { BaseEntity, Address } from './common';
import type { ListingData } from './listings';

export interface SaleData extends BaseEntity {
  listingId: string;
  listing?: ListingData;
  buyerId: string;
  sellerId: string;
  status: SaleStatus;
  pricing: SalePricing;
  shipping: SaleShipping;
  payment: SalePayment;
  communication: SaleCommunication[];
  timeline: SaleTimeline[];
}

export type SaleStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'paid' 
  | 'shipped' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed' 
  | 'refunded';

export interface SalePricing {
  itemPrice: number;
  shippingFee?: number;
  serviceFee: number;
  tax?: number;
  total: number;
  currency: string;
  offerPrice?: number;
  negotiated: boolean;
}

export interface SaleShipping {
  method: 'pickup' | 'shipping' | 'local_delivery';
  carrier?: string;
  service?: string;
  trackingNumber?: string;
  shippingAddress?: Address;
  pickupLocation?: Address;
  estimatedDelivery?: string;
  actualDelivery?: string;
  insurance?: {
    selected: boolean;
    amount: number;
    cost: number;
  };
}

export interface SalePayment {
  stripePaymentIntentId?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  method: 'card' | 'bank_transfer' | 'cash';
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  fees: {
    platform: number;
    payment: number;
    total: number;
  };
}

export interface SaleCommunication {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'notification';
  read: boolean;
  attachments?: string[];
}

export interface SaleTimeline {
  id: string;
  event: SaleEvent;
  timestamp: string;
  description: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export type SaleEvent = 
  | 'created'
  | 'confirmed'
  | 'payment_received'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  pendingSales: number;
  completedSales: number;
  averageSalePrice: number;
  topCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  recentSales: SaleData[];
}

export interface SaleOffer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  offerPrice: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
}

export interface PurchaseRequest {
  listingId: string;
  offerPrice?: number;
  shippingAddress?: Address;
  paymentMethod: string;
  message?: string;
}
