import { dev } from '$app/environment';

// Mock data store for development
let mockUsers = new Map();
let mockAdminUsers = new Map();

// Initialize with some sample data
mockUsers.set('NivAg90815PbcmUrbtYOtqX30J02', {
  uid: 'NivAg90815PbcmUrbtYOtqX30J02',
  email: 'admin@itsfait.com',
  displayName: 'Admin User',
  isVerified: true,
  status: 'active',
  createdAt: new Date('2024-01-01'),
  profileComplete: true
});

mockAdminUsers.set('NivAg90815PbcmUrbtYOtqX30J02', {
  isAdmin: true,
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  permissions: ['all'],
  userEmail: 'admin@itsfait.com'
});

// Add a few sample users
mockUsers.set('user_sample_1', {
  uid: 'user_sample_1',
  email: 'john.doe@example.com',
  displayName: 'John Doe',
  isVerified: true,
  status: 'active',
  createdAt: new Date('2024-01-15'),
  profileComplete: true
});

mockUsers.set('user_sample_2', {
  uid: 'user_sample_2',
  email: 'jane.smith@example.com',
  displayName: 'Jane Smith',
  isVerified: false,
  status: 'active',
  createdAt: new Date('2024-01-20'),
  profileComplete: false
});

// Create mock objects for development
const mockAuth = {
  verifySessionCookie: async () => ({ uid: 'mock-user-id' }),
  createSessionCookie: async () => 'mock-session-cookie',
  createUser: async (userData) => {
    const uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const userRecord = {
      uid,
      email: userData.email,
      displayName: userData.displayName || '',
      emailVerified: userData.emailVerified || false
    };

    // Store in mock data
    mockUsers.set(uid, {
      ...userRecord,
      createdAt: new Date(),
      isVerified: false,
      status: 'active'
    });

    console.log('Mock: Created user', userRecord);
    return userRecord;
  },
  deleteUser: async (uid) => {
    mockUsers.delete(uid);
    mockAdminUsers.delete(uid);
    console.log('Mock: Deleted user', uid);
  }
};

const mockFirestore = {
  collection: (collectionName) => ({
    doc: (docId) => ({
      get: async () => {
        let data = null;
        let exists = false;

        if (collectionName === 'users' && mockUsers.has(docId)) {
          data = mockUsers.get(docId);
          exists = true;
        } else if (collectionName === 'adminUsers' && mockAdminUsers.has(docId)) {
          data = mockAdminUsers.get(docId);
          exists = true;
        }

        return {
          exists,
          data: () => data,
          id: docId
        };
      },
      set: async (data) => {
        if (collectionName === 'users') {
          mockUsers.set(docId, { ...data, id: docId });
        } else if (collectionName === 'adminUsers') {
          mockAdminUsers.set(docId, { ...data, id: docId });
        }
        console.log(`Mock: Set ${collectionName}/${docId}`, data);
      },
      update: async (data) => {
        if (collectionName === 'users' && mockUsers.has(docId)) {
          const existing = mockUsers.get(docId);
          mockUsers.set(docId, { ...existing, ...data });
        } else if (collectionName === 'adminUsers' && mockAdminUsers.has(docId)) {
          const existing = mockAdminUsers.get(docId);
          mockAdminUsers.set(docId, { ...existing, ...data });
        }
        console.log(`Mock: Updated ${collectionName}/${docId}`, data);
      },
      delete: async () => {
        if (collectionName === 'users') {
          mockUsers.delete(docId);
        } else if (collectionName === 'adminUsers') {
          mockAdminUsers.delete(docId);
        }
        console.log(`Mock: Deleted ${collectionName}/${docId}`);
      }
    }),
    get: async () => {
      let docs = [];

      if (collectionName === 'users') {
        docs = Array.from(mockUsers.entries()).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));
      } else if (collectionName === 'adminUsers') {
        docs = Array.from(mockAdminUsers.entries()).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));
      }

      return { docs, size: docs.length };
    },
    limit: (limitCount) => ({
      get: async () => {
        let docs = [];

        if (collectionName === 'users') {
          docs = Array.from(mockUsers.entries()).slice(0, limitCount).map(([id, data]) => ({
            id,
            data: () => data,
            exists: true
          }));
        } else if (collectionName === 'adminUsers') {
          docs = Array.from(mockAdminUsers.entries()).slice(0, limitCount).map(([id, data]) => ({
            id,
            data: () => data,
            exists: true
          }));
        }

        return { docs, size: docs.length };
      }
    }),
    add: async (data) => {
      const id = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      if (collectionName === 'users') {
        mockUsers.set(id, data);
      } else if (collectionName === 'adminUsers') {
        mockAdminUsers.set(id, data);
      }

      return {
        id,
        get: async () => ({
          id,
          data: () => data,
          exists: true
        })
      };
    },
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
