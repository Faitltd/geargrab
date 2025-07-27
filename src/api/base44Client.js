/**
 * GearGrab API Client
 * Real API client that connects to the GearGrab backend API
 */

// API configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

// Import Firebase auth for token management
let firebaseAuth = null;
if (typeof window !== 'undefined') {
  import('../lib/firebase/client.js').then(({ auth }) => {
    firebaseAuth = auth;
  }).catch(console.error);
}

// Generic API helper function
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token - prefer Firebase token, fallback to localStorage JWT
  let token = null;

  if (typeof window !== 'undefined') {
    // Try to get Firebase ID token first
    if (firebaseAuth?.currentUser) {
      try {
        token = await firebaseAuth.currentUser.getIdToken();
      } catch (error) {
        console.warn('Failed to get Firebase token:', error);
      }
    }

    // Fallback to stored JWT token
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Convert body to JSON if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle authentication errors
    if (response.status === 401) {
      // Clear invalid tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Firebase token will be refreshed automatically
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
}

// Create entity CRUD operations
function createEntityAPI(entityName) {
  const endpoint = `/${entityName.toLowerCase()}s`;

  return {
    async list(orderBy = '-created_at') {
      const params = new URLSearchParams();
      if (orderBy) params.set('order', orderBy);
      return apiCall(`${endpoint}?${params.toString()}`);
    },

    async filter(criteria, orderBy = '-created_at') {
      return apiCall(`${endpoint}/search`, {
        method: 'POST',
        body: { filter: criteria, order: orderBy }
      });
    },

    async get(id) {
      return apiCall(`${endpoint}/${id}`);
    },

    async create(data) {
      return apiCall(endpoint, {
        method: 'POST',
        body: data
      });
    },

    async update(id, data) {
      return apiCall(`${endpoint}/${id}`, {
        method: 'PUT',
        body: data
      });
    },

    async delete(id) {
      return apiCall(`${endpoint}/${id}`, {
        method: 'DELETE'
      });
    }
  };
}

// Export the API client
export const base44 = {
  entities: {
    GearItem: createEntityAPI('gear_item'),
    User: createEntityAPI('user'),
    Rental: createEntityAPI('rental'),
    Message: createEntityAPI('message'),
    GuaranteeClaim: createEntityAPI('guarantee_claim'),
    CartItem: createEntityAPI('cart_item'),
    TransactionRecord: createEntityAPI('transaction_record'),
    TaxDocument: createEntityAPI('tax_document'),
    Review: createEntityAPI('review'),
    Notification: createEntityAPI('notification')
  },

  auth: {
    async me() {
      return apiCall('/auth/me');
    },

    async login(credentials) {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: credentials
      });

      // Store auth token
      if (response.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      return response;
    },

    async loginWithFirebase(idToken) {
      const response = await apiCall('/auth/firebase', {
        method: 'POST',
        body: { idToken }
      });

      // Store JWT token for API calls
      if (response.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
      }

      return response;
    },

    async logout() {
      // Clear auth tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }

      // Sign out from Firebase
      if (firebaseAuth) {
        try {
          const { signOut } = await import('../lib/firebase/auth.js');
          await signOut();
        } catch (error) {
          console.warn('Firebase signout failed:', error);
        }
      }

      return apiCall('/auth/logout', {
        method: 'POST'
      });
    },

    async isAuthenticated() {
      // Check Firebase auth state first
      if (firebaseAuth?.currentUser) {
        return true;
      }

      // Fallback to API check
      try {
        await this.me();
        return true;
      } catch {
        return false;
      }
    },

    async register(userData) {
      return apiCall('/auth/register', {
        method: 'POST',
        body: userData
      });
    }
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const formData = new FormData();
        formData.append('file', file);

        return apiCall('/upload', {
          method: 'POST',
          body: formData,
          headers: {} // Let browser set Content-Type for FormData
        });
      },

      async SendEmail(data) {
        return apiCall('/integrations/send-email', {
          method: 'POST',
          body: data
        });
      },

      async InvokeLLM(data) {
        return apiCall('/integrations/llm', {
          method: 'POST',
          body: data
        });
      },

      async GenerateImage(data) {
        return apiCall('/integrations/generate-image', {
          method: 'POST',
          body: data
        });
      },

      async ExtractDataFromUploadedFile(data) {
        return apiCall('/integrations/extract-data', {
          method: 'POST',
          body: data
        });
      }
    }
  }
};

// Export API utilities for direct use
export { apiCall };
