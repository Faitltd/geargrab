# Firestore Database Schema

## 📋 **Required Collections**

### 1. `/users/{userId}`
**Purpose:** Store user profile and account information

**Required Fields:**
```typescript
{
  name: string;           // User's full name
  email: string;          // User's email address
  createdAt: Timestamp;   // Account creation date
  role: string;           // "user", "admin", "moderator"
  profileData?: {         // Optional profile details
    phone?: string;
    location?: string;
    bio?: string;
    avatar?: string;
    verified?: boolean;
  }
}
```

**Example Document:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:00:00Z",
  "role": "user",
  "profileData": {
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "bio": "Outdoor enthusiast",
    "verified": true
  }
}
```

### 2. `/listings/{listingId}`
**Purpose:** Store gear listings for rent

**Required Fields:**
```typescript
{
  title: string;          // Listing title
  description: string;    // Detailed description
  price: number;          // Daily rental price
  category: string;       // "camping", "sports", "photography", etc.
  location: string;       // Location string or coordinates
  ownerId: string;        // Reference to user document
  images: string[];       // Array of image URLs
  status: string;         // "active", "booked", "archived", "inactive"
  createdAt: Timestamp;   // Creation date
  updatedAt: Timestamp;   // Last update date
  
  // Optional fields
  brand?: string;         // Equipment brand
  condition?: string;     // "excellent", "good", "fair", "poor"
  tags?: string[];        // Search tags
  availability?: {        // Availability calendar
    start: Timestamp;
    end: Timestamp;
    blockedDates?: Timestamp[];
  }
}
```

**Example Document:**
```json
{
  "title": "Professional Camera Kit",
  "description": "High-quality DSLR camera with multiple lenses",
  "price": 45,
  "category": "photography",
  "location": "San Francisco, CA",
  "ownerId": "user123",
  "images": ["https://storage.googleapis.com/bucket/image1.jpg"],
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z",
  "brand": "Canon",
  "condition": "excellent"
}
```

### 3. `/bookings/{bookingId}`
**Purpose:** Store rental bookings and transactions

**Required Fields:**
```typescript
{
  listingId: string;      // Reference to listing document
  renterId: string;       // Reference to renter user document
  ownerId: string;        // Reference to owner user document
  dates: {                // Booking date range
    start: Timestamp;
    end: Timestamp;
  };
  status: string;         // "pending", "confirmed", "active", "completed", "cancelled"
  amount: number;         // Total booking amount
  createdAt: Timestamp;   // Booking creation date
  
  // Optional fields
  paymentId?: string;     // Stripe payment ID
  notes?: string;         // Special instructions
  insurance?: boolean;    // Insurance coverage
  deposit?: number;       // Security deposit amount
}
```

**Example Document:**
```json
{
  "listingId": "listing456",
  "renterId": "user789",
  "ownerId": "user123",
  "dates": {
    "start": "2024-02-01T00:00:00Z",
    "end": "2024-02-03T00:00:00Z"
  },
  "status": "confirmed",
  "amount": 90,
  "createdAt": "2024-01-25T14:30:00Z",
  "paymentId": "pi_1234567890",
  "notes": "Need pickup at 9 AM"
}
```

### 4. `/disputes/{disputeId}` (Optional)
**Purpose:** Handle booking disputes and issues

**Required Fields:**
```typescript
{
  bookingId: string;      // Reference to booking
  reporterId: string;     // User who reported the issue
  reason: string;         // Dispute reason
  status: string;         // "open", "investigating", "resolved", "closed"
  messages: Array<{       // Dispute conversation
    userId: string;
    message: string;
    timestamp: Timestamp;
  }>;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}
```

### 5. `/admin/{docId}` (Optional)
**Purpose:** Store admin-only data and system logs

**Required Fields:**
```typescript
{
  type: string;           // "audit_log", "system_setting", "report"
  data: any;              // Flexible data structure
  createdAt: Timestamp;
  createdBy?: string;     // Admin user ID
}
```

## 🔐 **Security Rules**

Copy and paste these rules into your Firestore Rules Editor:

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

## 📝 **Setup Instructions**

### Step 1: Create Collections
1. Go to Firebase Console → Firestore Database
2. Create the following collections by adding your first document:
   - `users`
   - `listings` 
   - `bookings`
   - `disputes` (optional)
   - `admin` (optional)

### Step 2: Add Sample Data
Use the example documents above to create your first test documents in each collection.

### Step 3: Apply Security Rules
1. Go to Firestore → Rules
2. Replace all existing rules with the rules provided above
3. Click "Publish"

### Step 4: Set up Indexes
Firestore will automatically suggest indexes as you use the app. Common indexes needed:
- `listings` collection: `category`, `status`, `createdAt`
- `bookings` collection: `renterId`, `ownerId`, `status`
- `users` collection: `role`, `createdAt`

## 🚀 **Next Steps**
Once the schema is set up, we can:
1. Convert the application to use Firestore
2. Implement real-time listeners
3. Add proper data validation
4. Set up Firebase Storage for images
5. Integrate Firebase Authentication
