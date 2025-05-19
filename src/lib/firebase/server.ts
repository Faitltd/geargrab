import admin from 'firebase-admin';

// Initialize the app if it hasn't been initialized already
let app: admin.app.App;

try {
  app = admin.getApp();
} catch {
  // Initialize with service account if provided, otherwise use default credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;
    
  app = admin.initializeApp({
    credential: serviceAccount 
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault()
  });
}

// Export the admin services
export const adminAuth = app.auth();
export const adminFirestore = { 
  collection: () => ({ 
    doc: () => ({ 
      get: async () => ({ 
        exists: false, 
        data: () => ({}) 
      }) 
    }) 
  }) 
};
export const adminStorage = app.storage();
export const adminApp = { name: 'mock-app' };
