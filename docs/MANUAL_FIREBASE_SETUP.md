# 🔥 Manual Firebase Setup Instructions

Since we need to configure Firestore security rules before we can add data, please follow these steps to complete the Firebase setup:

## 🚀 **STEP 1: Configure Firestore Security Rules**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `geargrabco`
3. **Navigate to Firestore Database** → **Rules**
4. **Replace all existing rules** with this:

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

5. **Click "Publish"** to apply the rules

## 🚀 **STEP 2: Configure Firebase Storage Rules**

1. **Navigate to Storage** → **Rules**
2. **Replace all existing rules** with this:

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
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **Click "Publish"**

## 🚀 **STEP 3: Enable Authentication Methods**

1. **Navigate to Authentication** → **Sign-in method**
2. **Enable Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

3. **Enable Google Sign-in** (recommended):
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter your project support email
   - Click "Save"

## 🚀 **STEP 4: Create Sample Data**

Now that the rules are set up, let's add some sample data:

### **Create Users Collection**

1. **Go to Firestore Database** → **Data**
2. **Click "Start collection"**
3. **Collection ID**: `users`
4. **Add these documents**:

**Document 1:**
- **Document ID**: `admin-user-1`
- **Fields**:
  ```
  name: "Admin User" (string)
  email: "admin@geargrab.com" (string)
  role: "admin" (string)
  createdAt: [Click "Add field" → "timestamp" → "Set to current time"]
  profileData: (map)
    ├── verified: true (boolean)
    └── location: "San Francisco, CA" (string)
  ```

**Document 2:**
- **Document ID**: `test-user-1`
- **Fields**:
  ```
  name: "John Doe" (string)
  email: "john@example.com" (string)
  role: "user" (string)
  createdAt: [Click "Add field" → "timestamp" → "Set to current time"]
  profileData: (map)
    ├── verified: true (boolean)
    ├── location: "San Francisco, CA" (string)
    └── bio: "Outdoor enthusiast" (string)
  ```

### **Create Listings Collection**

1. **Click "Start collection"**
2. **Collection ID**: `listings`
3. **Add these documents**:

**Document 1:**
- **Document ID**: `listing-1`
- **Fields**:
  ```
  title: "Professional Camera Kit" (string)
  description: "High-quality DSLR camera with multiple lenses" (string)
  price: 45 (number)
  category: "photography" (string)
  location: "San Francisco, CA" (string)
  ownerId: "test-user-1" (string)
  images: ["https://via.placeholder.com/400x300?text=Camera+Kit"] (array)
  status: "active" (string)
  brand: "Canon" (string)
  condition: "excellent" (string)
  tags: ["camera", "photography", "professional"] (array)
  createdAt: [timestamp - current time]
  updatedAt: [timestamp - current time]
  ```

**Document 2:**
- **Document ID**: `listing-2`
- **Fields**:
  ```
  title: "Camping Tent - 4 Person" (string)
  description: "Spacious 4-person camping tent" (string)
  price: 25 (number)
  category: "camping" (string)
  location: "San Francisco, CA" (string)
  ownerId: "test-user-1" (string)
  images: ["https://via.placeholder.com/400x300?text=Camping+Tent"] (array)
  status: "active" (string)
  brand: "GearGrab" (string)
  condition: "good" (string)
  tags: ["camping", "tent", "outdoor"] (array)
  createdAt: [timestamp - current time]
  updatedAt: [timestamp - current time]
  ```

### **Create Bookings Collection**

1. **Click "Start collection"**
2. **Collection ID**: `bookings`
3. **Add this document**:

**Document 1:**
- **Document ID**: `booking-1`
- **Fields**:
  ```
  listingId: "listing-1" (string)
  renterId: "test-user-1" (string)
  ownerId: "admin-user-1" (string)
  status: "confirmed" (string)
  amount: 90 (number)
  createdAt: [timestamp - current time]
  dates: (map)
    ├── start: [timestamp - future date]
    └── end: [timestamp - future date + 2 days]
  notes: "Test booking" (string)
  ```

## 🚀 **STEP 5: Test the Setup**

Once you've completed the above steps, run this command to test:

```bash
npm run dev
```

Then visit: http://localhost:5174

**Test these features:**
1. ✅ **Homepage loads** without errors
2. ✅ **Browse listings** - should show the sample listings
3. ✅ **User registration** - create a new account
4. ✅ **User login** - sign in with the account
5. ✅ **Admin access** - try logging in as admin@geargrab.com

## 🚀 **STEP 6: Run Tests**

After manual setup, run the tests:

```bash
# Basic functionality
npm run test:smoke

# Full test suite
npm test
```

## ✅ **Verification Checklist**

- [ ] Firestore security rules published
- [ ] Storage security rules published  
- [ ] Email/Password authentication enabled
- [ ] Google authentication enabled (optional)
- [ ] Users collection created with sample data
- [ ] Listings collection created with sample data
- [ ] Bookings collection created with sample data
- [ ] Application starts without errors
- [ ] Can browse listings
- [ ] Can register new users
- [ ] Can login existing users
- [ ] Tests pass

## 🎉 **Next Steps**

Once this manual setup is complete:
1. **All Firebase services will be fully functional**
2. **Real authentication will work**
3. **Real database operations will work**
4. **File uploads will work**
5. **Tests should achieve near 100% pass rate**

**Let me know when you've completed these steps and I'll run the full test suite to verify everything is working!**
