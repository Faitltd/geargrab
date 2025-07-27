const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:3001/api";
let firebaseAuth = null;
if (typeof window !== "undefined") {
  import('./client-BgatN19Z.js').then(({ auth }) => {
    firebaseAuth = auth;
  }).catch(console.error);
}
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let token = null;
  if (typeof window !== "undefined") {
    if (firebaseAuth?.currentUser) {
      try {
        token = await firebaseAuth.currentUser.getIdToken();
      } catch (error) {
        console.warn("Failed to get Firebase token:", error);
      }
    }
    if (!token) {
      token = localStorage.getItem("auth_token");
    }
  }
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...token && { "Authorization": `Bearer ${token}` },
      ...options.headers
    },
    ...options
  };
  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }
  try {
    const response = await fetch(url, config);
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      throw new Error("Authentication required");
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
function createEntityAPI(entityName) {
  const endpoint = `/${entityName.toLowerCase()}s`;
  return {
    async list(orderBy = "-created_at") {
      const params = new URLSearchParams();
      if (orderBy) params.set("order", orderBy);
      return apiCall(`${endpoint}?${params.toString()}`);
    },
    async filter(criteria, orderBy = "-created_at") {
      return apiCall(`${endpoint}/search`, {
        method: "POST",
        body: { filter: criteria, order: orderBy }
      });
    },
    async get(id) {
      return apiCall(`${endpoint}/${id}`);
    },
    async create(data) {
      return apiCall(endpoint, {
        method: "POST",
        body: data
      });
    },
    async update(id, data) {
      return apiCall(`${endpoint}/${id}`, {
        method: "PUT",
        body: data
      });
    },
    async delete(id) {
      return apiCall(`${endpoint}/${id}`, {
        method: "DELETE"
      });
    }
  };
}
({
  entities: {
    GearItem: createEntityAPI("gear_item"),
    User: createEntityAPI("user"),
    Rental: createEntityAPI("rental"),
    Message: createEntityAPI("message"),
    GuaranteeClaim: createEntityAPI("guarantee_claim"),
    CartItem: createEntityAPI("cart_item"),
    TransactionRecord: createEntityAPI("transaction_record"),
    TaxDocument: createEntityAPI("tax_document"),
    Review: createEntityAPI("review"),
    Notification: createEntityAPI("notification")
  }
});
//# sourceMappingURL=base44Client-DiUgpmgT.js.map
