# Firestore Data Modeling & Query Optimization

## Database Schema Relationships

The GearGrab application has several complex relationships between data entities. Here's how to properly structure these relationships in Firestore:

```
                  +-------------+
         +--------|   users     |--------+
         |        +-------------+        |
         |               |               |
         v               v               v
   +-------------+ +-------------+ +-------------+
   |   listings  | |  bookings   | |   reviews   |
   +-------------+ +-------------+ +-------------+
         |               |               |
         |               v               |
         |        +-------------+        |
         +------->| ggVerifySessions |<--+
                  +-------------+
                        |
                        v
                  +-------------+
                  |insuranceClaims|
                  +-------------+
```

## Optimization Strategies

### 1. Denormalization for Common Queries

Denormalize data to reduce the number of queries:

```typescript
// Instead of this (requiring multiple queries):
const booking = await getBooking(bookingId);
const listing = await getListing(booking.listingId);
const owner = await getUser(listing.ownerUid);
const renter = await getUser(booking.renterUid);

// Denormalize like this:
interface Booking {
  // ... other fields
  listingSnapshot: {
    listingId: string;
    title: string;
    category: string;
    photos: Array<{url: string, altText: string}>;
    dailyRate: number;
  };
  ownerSnapshot: {
    uid: string;
    displayName: string;
    photoURL: string;
    averageRating: number;
  };
  renterSnapshot: {
    uid: string;
    displayName: string;
    photoURL: string;
    averageRating: number;
  };
}
```

### 2. Strategic Denormalization

Only denormalize data that:
- Changes infrequently
- Is needed for list displays
- Doesn't need to be 100% up-to-date

For example, storing the `averageRating` in the user document rather than calculating it every time:

```typescript
// Trigger this function on each new review
function onReviewCreate(reviewData) {
  const { revieweeUid, rating } = reviewData;
  
  // Get current user data
  const userRef = doc(db, 'users', revieweeUid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  
  // Calculate new average
  const totalReviews = userData.totalReviews + 1;
  const totalRatingPoints = (userData.averageRating * userData.totalReviews) + rating;
  const newAverageRating = totalRatingPoints / totalReviews;
  
  // Update user document
  await updateDoc(userRef, {
    averageRating: newAverageRating,
    totalReviews: totalReviews
  });
}
```

### 3. Collection Group Queries

Use collection group queries for entities that might be queried across parent documents:

```typescript
// For example, to find all GG Verify sessions across all bookings:
const verifySessionsQuery = query(
  collectionGroup(db, 'ggVerifySessions'),
  where('userId', '==', currentUserId),
  orderBy('createdAt', 'desc')
);

const querySnapshot = await getDocs(verifySessionsQuery);
```

### 4. Composite Indexes

Define composite indexes for complex queries to avoid performance issues:

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "averageRating", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "renterUid", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "listingId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 5. Data Pagination

Implement proper pagination for all listing queries to avoid loading too much data:

```typescript
// Initial query with limit
const first = query(
  collection(db, 'listings'),
  where('category', '==', selectedCategory),
  where('isPublished', '==', true),
  orderBy('createdAt', 'desc'),
  limit(20)
);

const documentSnapshots = await getDocs(first);

// Get the last visible document
const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];

// Construct a new query starting at this document
const next = query(
  collection(db, 'listings'),
  where('category', '==', selectedCategory),
  where('isPublished', '==', true),
  orderBy('createdAt', 'desc'),
  startAfter(lastVisible),
  limit(20)
);
```

### 6. Geospatial Queries

For location-based searches, use Firestore's `GeoPoint` type and geohashing for efficient queries:

```typescript
// Helper function to create a geohash range
function getGeohashRange(latitude, longitude, radiusInKm) {
  const lat = 0.0089831; // 1 km of latitude in degrees
  const lon = 0.0089831 / Math.cos(latitude * (Math.PI / 180));
  
  const latDelta = radiusInKm * lat;
  const lonDelta = radiusInKm * lon;
  
  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;
  
  return {
    minLat,
    maxLat,
    minLon,
    maxLon
  };
}

// Query for listings within a radius
async function getListingsNearLocation(latitude, longitude, radiusInKm) {
  const range = getGeohashRange(latitude, longitude, radiusInKm);
  
  const q = query(
    collection(db, 'listings'),
    where('isPublished', '==', true),
    where('location.latitude', '>=', range.minLat),
    where('location.latitude', '<=', range.maxLat)
  );
  
  const querySnapshot = await getDocs(q);
  
  // Further filter by longitude (requires post-processing)
  const results = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.location.longitude >= range.minLon && 
        data.location.longitude <= range.maxLon) {
      results.push({
        id: doc.id,
        ...data
      });
    }
  });
  
  // Calculate actual distances and sort
  results.forEach(item => {
    item.distance = calculateDistance(
      latitude, 
      longitude, 
      item.location.latitude, 
      item.location.longitude
    );
  });
  
  return results.sort((a, b) => a.distance - b.distance);
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
```

### 7. Subcollections vs. Root Collections

Use subcollections for one-to-many relationships with clear ownership:

```
users/{userId}/notifications/{notificationId} // Good use of subcollection
```

Use root collections for entities that need to be queried across different parents:

```
bookings/{bookingId} // Better as root collection for cross-user queries
```

### 8. Transaction Batching

Group related updates into batches to ensure data consistency:

```typescript
async function completeBookingProcess(bookingId) {
  // Get references
  const bookingRef = doc(db, 'bookings', bookingId);
  const bookingDoc = await getDoc(bookingRef);
  const booking = bookingDoc.data();
  
  const listingRef = doc(db, 'listings', booking.listingId);
  const ownerRef = doc(db, 'users', booking.ownerUid);
  
  // Start a batch
  const batch = writeBatch(db);
  
  // Update booking status
  batch.update(bookingRef, {
    status: 'completed',
    completedAt: serverTimestamp()
  });
  
  // Update listing metrics
  batch.update(listingRef, {
    totalBookings: increment(1)
  });
  
  // Update owner metrics
  batch.update(ownerRef, {
    'ownerDashboardMetrics.totalEarnings': increment(booking.totalRentalFee),
    'notificationPreferences.emailNotifications': true // Example additional update
  });
  
  // Commit the batch
  await batch.commit();
}
```

### 9. Availability Calendar Optimization

For the availability calendar, which can be complex to query and manage, consider these approaches:

**Option 1: Sparse Array in Firestore** (simpler, but limited to less than 1 year)
```typescript
interface Listing {
  // ...other fields
  availabilityByDate: {
    [date: string]: 'available' | 'booked' | 'unavailable'
  }
}
```

**Option 2: Dedicated Subcollection** (more scalable)
```typescript
// listings/{listingId}/availability/{YYYY-MM-DD}
interface AvailabilityDate {
  date: string; // 'YYYY-MM-DD'
  status: 'available' | 'booked' | 'unavailable';
  bookingId?: string; // Optional reference to booking
  updatedAt: Timestamp;
}
```

### 10. Real-time Updates Configuration

Carefully select which components need real-time updates:

```typescript
// Real-time notifications listener
function initNotificationsListener(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Update notification store/state
    notificationStore.set(notifications);
    
    // If there are new notifications, show toast
    if (querySnapshot.docChanges().some(change => change.type === 'added')) {
      toast.info('You have new notifications');
    }
  });
}
```

### 11. Handling Security Deposit Logic

Security deposits require careful transaction handling:

```typescript
async function processSecurityDeposit(bookingId, action) {
  // Security-critical operations should use transactions
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await transaction.get(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }
    
    const booking = bookingDoc.data();
    
    // Verify conditions before proceeding
    if (booking.status !== 'completed') {
      throw new Error('Booking must be in completed status');
    }
    
    if (action === 'release' && !booking.returnConfirmedByOwner) {
      throw new Error('Return must be confirmed by owner');
    }
    
    // Update booking document
    transaction.update(bookingRef, {
      securityDepositReleased: action === 'release',
      securityDepositReleaseDate: serverTimestamp()
    });
    
    // If we're withholding part of the deposit for damages,
    // we'd create the appropriate claim records here
    if (action === 'partial' && booking.partialRefundAmount) {
      const claimRef = doc(collection(db, 'insuranceClaims'));
      transaction.set(claimRef, {
        bookingId,
        listingId: booking.listingId,
        reportedByUid: booking.ownerUid,
        incidentTimestamp: booking.returnConfirmedByOwner,
        reportTimestamp: serverTimestamp(),
        description: booking.damageDescription || 'Damage reported',
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  });
}
```

## Data Consistency Checks

Implement a scheduled function to perform data consistency checks and fix any issues:

```typescript
// This function could run daily via a Cloud Function
async function performDataConsistencyChecks() {
  const db = getFirestore();
  const batch = writeBatch(db);
  let batchCount = 0;
  
  // Check for orphaned bookings
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('status', 'in', ['pendingApproval', 'approved']),
    where('createdAt', '<', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
  );
  
  const oldBookings = await getDocs(bookingsQuery);
  
  oldBookings.forEach(doc => {
    // Update status for abandoned bookings
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelReason: 'System: Abandoned booking',
      updatedAt: serverTimestamp()
    });
    
    batchCount++;
    
    // Firestore batches limited to 500 operations
    if (batchCount >= 450) {
      batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  });
  
  // Check for unfinished GG Verify sessions
  const verifyQuery = query(
    collection(db, 'ggVerifySessions'),
    where('status', '==', 'in-progress'),
    where('createdAt', '<', Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
  );
  
  const oldSessions = await getDocs(verifyQuery);
  
  oldSessions.forEach(doc => {
    batch.update(doc.ref, {
      status: 'pending-review',
      updatedAt: serverTimestamp()
    });
    
    batchCount++;
    
    if (batchCount >= 450) {
      batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  });
  
  // Commit any remaining operations
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log('Data consistency check completed');
}
```

By implementing these Firestore optimization strategies, GearGrab will have a solid foundation for scaling and maintaining good performance as the application grows.