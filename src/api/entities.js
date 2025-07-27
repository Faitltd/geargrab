// Simple API entities for GearGrab (replacing Base44 dependencies)

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Generic API helper
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// User entity
export const User = {
  async filter(criteria) {
    return apiCall('/users', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async get(id) {
    return apiCall(`/users/${id}`);
  },

  async update(id, data) {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async create(data) {
    return apiCall('/users', {
      method: 'POST',
      body: data
    });
  }
};

// TransactionRecord entity
export const TransactionRecord = {
  async filter(criteria) {
    return apiCall('/transactions', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async get(id) {
    return apiCall(`/transactions/${id}`);
  },

  async create(data) {
    return apiCall('/transactions', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiCall(`/transactions/${id}`, {
      method: 'PUT',
      body: data
    });
  }
};

// TaxDocument entity
export const TaxDocument = {
  async filter(criteria) {
    return apiCall('/tax-documents', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async get(id) {
    return apiCall(`/tax-documents/${id}`);
  },

  async create(data) {
    return apiCall('/tax-documents', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiCall(`/tax-documents/${id}`, {
      method: 'PUT',
      body: data
    });
  }
};

// RefundAdjustment entity
export const RefundAdjustment = {
  async create(data) {
    return apiCall('/refund-adjustments', {
      method: 'POST',
      body: data
    });
  },

  async filter(criteria) {
    return apiCall('/refund-adjustments', {
      method: 'POST',
      body: { filter: criteria }
    });
  }
};

// AnnualEarnings entity
export const AnnualEarnings = {
  async filter(criteria) {
    return apiCall('/annual-earnings', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async create(data) {
    return apiCall('/annual-earnings', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiCall(`/annual-earnings/${id}`, {
      method: 'PUT',
      body: data
    });
  }
};

// GearItem entity (for compatibility)
export const GearItem = {
  async filter(criteria) {
    return apiCall('/gear-items', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async get(id) {
    return apiCall(`/gear-items/${id}`);
  },

  async create(data) {
    return apiCall('/gear-items', {
      method: 'POST',
      body: data
    });
  }
};

// Rental entity (for compatibility)
export const Rental = {
  async filter(criteria) {
    return apiCall('/rentals', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async get(id) {
    return apiCall(`/rentals/${id}`);
  },

  async create(data) {
    return apiCall('/rentals', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiCall(`/rentals/${id}`, {
      method: 'PUT',
      body: data
    });
  }
};

// Message entity (for compatibility)
export const Message = {
  async filter(criteria) {
    return apiCall('/messages', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async create(data) {
    return apiCall('/messages', {
      method: 'POST',
      body: data
    });
  }
};

// GuaranteeClaim entity (for compatibility)
export const GuaranteeClaim = {
  async filter(criteria) {
    return apiCall('/guarantee-claims', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async create(data) {
    return apiCall('/guarantee-claims', {
      method: 'POST',
      body: data
    });
  }
};

// CartItem entity (for compatibility)
export const CartItem = {
  async filter(criteria) {
    return apiCall('/cart-items', {
      method: 'POST',
      body: { filter: criteria }
    });
  },

  async create(data) {
    return apiCall('/cart-items', {
      method: 'POST',
      body: data
    });
  }
};