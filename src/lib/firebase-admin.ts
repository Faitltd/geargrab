// Mock Firebase Admin for demo deployment
// In production, this would use real Firebase Admin SDK

// Mock implementation for demo purposes
export async function verifyIdToken(idToken: string) {
  // For demo purposes, return a mock decoded token
  // In production, this would verify the actual Firebase ID token
  return {
    uid: 'demo-user-123',
    email: 'demo@geargrab.co',
    name: 'Demo User',
    email_verified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
}

export async function createCustomToken(uid: string) {
  // Mock custom token for demo
  return `demo-custom-token-${uid}`;
}

// Mock admin instances
export const adminAuth = {
  verifyIdToken,
  createCustomToken
};

export const adminDb = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => {},
      update: async () => {},
      delete: async () => {}
    })
  })
};

export const adminStorage = {
  bucket: () => ({
    file: () => ({
      exists: async () => [false],
      save: async () => {},
      delete: async () => {}
    })
  })
};

// Additional mock functions for compatibility
export const getUserByUid = async (uid: string) => {
  return {
    uid,
    email: 'demo@geargrab.co',
    displayName: 'Demo User',
    emailVerified: true
  };
};
