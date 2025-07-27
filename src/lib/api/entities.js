/**
 * API entities and data models
 */

// Base API configuration
const API_BASE_URL = '/api';

/**
 * Generic API request function
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Gear Items API
 */
export const gearItems = {
  // Get all gear items with optional filters
  async getAll(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/gear-items?${searchParams}`);
  },

  // Get single gear item by ID
  async getById(id) {
    return apiRequest(`/gear-items/${id}`);
  },

  // Create new gear item
  async create(data) {
    return apiRequest('/gear-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update gear item
  async update(id, data) {
    return apiRequest(`/gear-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete gear item
  async delete(id) {
    return apiRequest(`/gear-items/${id}`, {
      method: 'DELETE',
    });
  },

  // Search gear items
  async search(query, filters = {}) {
    const params = { q: query, ...filters };
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/gear-items/search?${searchParams}`);
  },
};

/**
 * Rentals API
 */
export const rentals = {
  // Get user's rentals
  async getAll(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/rentals?${searchParams}`);
  },

  // Get single rental by ID
  async getById(id) {
    return apiRequest(`/rentals/${id}`);
  },

  // Create new rental booking
  async create(data) {
    return apiRequest('/rentals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update rental
  async update(id, data) {
    return apiRequest(`/rentals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Approve rental (owner only)
  async approve(id) {
    return apiRequest(`/rentals/${id}/approve`, {
      method: 'PUT',
    });
  },

  // Reject rental (owner only)
  async reject(id, reason) {
    return apiRequest(`/rentals/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  },
};

/**
 * Users API
 */
export const users = {
  // Get current user profile
  async getProfile() {
    return apiRequest('/users/profile');
  },

  // Update user profile
  async updateProfile(data) {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get user by ID
  async getById(id) {
    return apiRequest(`/users/${id}`);
  },
};

/**
 * Messages API
 */
export const messages = {
  // Get conversations
  async getConversations(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/messages/conversations?${searchParams}`);
  },

  // Get conversation messages
  async getConversationMessages(conversationId, params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/messages/conversations/${conversationId}?${searchParams}`);
  },

  // Create conversation
  async createConversation(data) {
    return apiRequest('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Send message
  async send(data) {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mark message as read
  async markAsRead(messageId) {
    return apiRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  },

  // Get unread count
  async getUnreadCount() {
    return apiRequest('/messages/unread-count');
  },
};

/**
 * Payments API
 */
export const payments = {
  // Create payment intent
  async createIntent(data) {
    return apiRequest('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Confirm payment
  async confirm(paymentIntentId) {
    return apiRequest('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });
  },

  // Get payment history
  async getHistory(params = {}) {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/payments/history?${searchParams}`);
  },

  // Request refund
  async requestRefund(paymentIntentId, reason) {
    return apiRequest('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ 
        payment_intent_id: paymentIntentId,
        reason 
      }),
    });
  },
};

/**
 * Auth API
 */
export const auth = {
  // Verify Firebase token
  async verifyToken(idToken) {
    return apiRequest('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  // Refresh token
  async refreshToken() {
    return apiRequest('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Export all entities
export default {
  gearItems,
  rentals,
  users,
  messages,
  payments,
  auth,
};
