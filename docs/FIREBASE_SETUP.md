# 🔥 Firebase Setup Guide for GearGrab

This guide will help you set up Firebase for production use with GearGrab.

## 📋 **Prerequisites**

1. **Firebase Account**: Create a free account at [firebase.google.com](https://firebase.google.com)
2. **Node.js**: Ensure you have Node.js installed
3. **Firebase CLI** (optional): `npm install -g firebase-tools`

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `geargrab-production` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Click "Create project"

### **Step 2: Enable Required Services**

#### **Authentication**
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional but recommended)
4. Configure authorized domains if needed

#### **Firestore Database**
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll set up rules later)
4. Select your preferred location (closest to your users)

#### **Storage**
1. Go to **Storage**
2. Click "Get started"
3. Choose **Production mode**
4. Select same location as Firestore

### **Step 3: Get Firebase Configuration**

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" > Web app icon
4. Enter app name: "GearGrab Web"
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.storage.googleapis.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### **Step 4: Configure Environment Variables**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```bash
   PUBLIC_FIREBASE_API_KEY=AIza...
   PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.storage.googleapis.com
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### **Step 5: Set Up Firestore Database**

#### **Option A: Automated Setup (Recommended)**
Run our setup script to create collections and sample data:

```bash
npm run setup:firestore
```

This will create:
- ✅ Users collection with sample users
- ✅ Listings collection with sample listings  
- ✅ Bookings collection with sample bookings
- ✅ Admin collection for system logs

#### **Option B: Manual Setup**
1. Go to Firestore Database in Firebase Console
2. Create collections manually using the schema in `docs/firestore-schema.md`
3. Add sample documents for testing

### **Step 6: Configure Security Rules**

1. Go to **Firestore Database** > **Rules**
2. Replace the existing rules with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow users to read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow other users to read basic profile info
    }

    // Listings are public-readable, but only owners can write
    match /listings/{listingId} {
      allow read: if true; // Public read access for browsing
      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }

    // Only renter or owner can view their bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.ownerId || request.auth.uid == resource.data.renterId);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.renterId;
    }

    // Disputes can be read/written by involved parties
    match /disputes/{disputeId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.reporterId || 
         request.auth.uid in resource.data.involvedUsers);
    }

    // Admin collection - only admins can access
    match /admin/{docId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Deny everything else by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"** to apply the rules

### **Step 7: Set Up Storage Rules**

1. Go to **Storage** > **Rules**
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images
    match /listings/{listingId}/{allPaths=**} {
      allow read: if true; // Public read access for listing images
      allow write: if request.auth != null;
    }
    
    // Allow users to upload profile pictures
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

### **Step 8: Test Your Setup**

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:5173`

3. Test the following:
   - ✅ User registration/login
   - ✅ Browse listings (should show sample data)
   - ✅ Create new listing (if authenticated)
   - ✅ Admin panel access (use admin user from sample data)

### **Step 9: Run Tests**

Run the test suite to verify everything works:

```bash
npm run test
```

Expected results:
- ✅ Basic smoke tests should pass
- ✅ Mock authentication tests should pass
- ✅ API tests should pass with real Firebase data

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Firebase config not found"**
   - Check that all environment variables are set in `.env`
   - Restart the dev server after changing `.env`

2. **"Permission denied" errors**
   - Verify Firestore security rules are published
   - Check that user is authenticated
   - Ensure user has correct role for admin features

3. **"Network request failed"**
   - Check Firebase project is active
   - Verify API keys are correct
   - Check internet connection

### **Verification Checklist**

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database created in production mode
- [ ] Storage enabled
- [ ] Environment variables configured
- [ ] Sample data created (via script or manually)
- [ ] Security rules published for Firestore
- [ ] Storage rules published
- [ ] Application starts without errors
- [ ] Can register/login users
- [ ] Can view listings
- [ ] Admin panel accessible

## 🎉 **Next Steps**

Once Firebase is set up, you can:

1. **Deploy to production** using Firebase Hosting
2. **Set up monitoring** with Firebase Analytics
3. **Configure email templates** in Authentication settings
4. **Set up backup schedules** for Firestore
5. **Configure performance monitoring**

## 📞 **Support**

If you encounter issues:
1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the console logs for specific error messages
3. Verify your Firebase project settings match this guide
