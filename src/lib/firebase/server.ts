import { dev } from '$app/environment';

// Create mock objects for development
const mockAuth = {
  verifySessionCookie: async () => ({ uid: 'mock-user-id' }),
  createSessionCookie: async () => 'mock-session-cookie'
};

const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: true,
        data: () => ({})
      }),
      set: async () => {},
      update: async () => {}
    }),
    where: () => ({
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            docs: [],
            forEach: () => {}
          })
        })
      })
    })
  })
};

const mockStorage = {
  bucket: () => ({
    file: () => ({
      getSignedUrl: async () => ['mock-url'],
      save: async () => {},
      delete: async () => {}
    })
  })
};

// Export mock objects for development
export const adminAuth = mockAuth;
export const adminFirestore = mockFirestore;
export const adminStorage = mockStorage;
export const adminApp = { name: 'mock-app' };
