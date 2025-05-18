// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utility functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isInvolvedInBooking(bookingData) {
      return isAuthenticated() && (request.auth.uid == bookingData.renterUid || request.auth.uid == bookingData.ownerUid);
    }
    
    function isAdmin() {
      return isAuthenticated() && get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Users Collection
    match /users/{userId} {
      // Anyone can read basic public profile data
      allow read: if true;
      
      // Only the user can update their own profile, or an admin
      allow update: if isOwner(userId) || isAdmin();
      
      // Only the user or admin can read sensitive fields
      match /privateData/{document=**} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
      
      // Only the system can create users (triggered by authentication)
      allow create: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Listings Collection
    match /listings/{listingId} {
      // Everyone can read published listings
      allow read: if resource.data.isPublished == true || 
                   (isAuthenticated() && resource.data.ownerUid == request.auth.uid);
      
      // Only the owner can create, update, or delete their listings
      allow create: if isAuthenticated() && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.ownerUid == request.auth.uid;
      
      // Admin can perform any operation
      allow read, write: if isAdmin();
    }
    
    // Bookings Collection
    match /bookings/{bookingId} {
      // Only parties involved in the booking can read it
      allow read: if isAuthenticated() && 
                   (resource.data.renterUid == request.auth.uid || 
                    resource.data.ownerUid == request.auth.uid);
      
      // Only the renter can create a booking
      allow create: if isAuthenticated() && request.resource.data.renterUid == request.auth.uid;
      
      // Update rules based on booking status and user role
      allow update: if isAuthenticated() && (
        // Owner can update specific fields during approval/handover stages
        (resource.data.ownerUid == request.auth.uid && 
         (request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'ownerApproval', 'handoverConfirmedByOwner', 'returnConfirmedByOwner', 'securityDepositReleased']))) || 
        
        // Renter can update specific fields during handover/return stages
        (resource.data.renterUid == request.auth.uid && 
         (request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['handoverConfirmedByRenter', 'returnConfirmedByRenter'])))
      );
      
      // Admin can perform any operation
      allow read, write: if isAdmin();
    }
    
    // GG Verify Sessions
    match /ggVerifySessions/{sessionId} {
      // Parties involved in the booking can read verification sessions
      allow read: if isAuthenticated() && exists(/databases/$(database)/documents/bookings/$(resource.data.bookingId)) &&
                   isInvolvedInBooking(get(/databases/$(database)/documents/bookings/$(resource.data.bookingId)).data);
      
      // Only the user performing verification can create/update a session
      allow create, update: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      
      // Admin can perform any operation
      allow read, write: if isAdmin();
    }
    
    // Reviews Collection
    match /reviews/{reviewId} {
      // Everyone can read public reviews
      allow read: if resource.data.isPublic == true;
      
      // Only reviewer can create or update their own review before it's public
      allow create: if isAuthenticated() && request.resource.data.reviewerUid == request.auth.uid;
      allow update: if isAuthenticated() && 
                     resource.data.reviewerUid == request.auth.uid && 
                     resource.data.isPublic == false;
      
      // Admin can perform any operation
      allow read, write: if isAdmin();
    }
    
    // Insurance Claims
    match /insuranceClaims/{claimId} {
      // Only parties involved in the booking can read claims
      allow read: if isAuthenticated() && exists(/databases/$(database)/documents/bookings/$(resource.data.bookingId)) &&
                   isInvolvedInBooking(get(/databases/$(database)/documents/bookings/$(resource.data.bookingId)).data);
      
      // Only parties involved can create claims
      allow create: if isAuthenticated() && 
                     exists(/databases/$(database)/documents/bookings/$(request.resource.data.bookingId)) &&
                     isInvolvedInBooking(get(/databases/$(database)/documents/bookings/$(request.resource.data.bookingId)).data);
      
      // Only admins can update claim status
      allow update: if isAdmin();
    }
    
    // Site Configuration - Read-only for everyone, write only for admins
    match /siteConfiguration/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Notifications - Users can only read their own notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid && 
                     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
      
      // Admin can perform any operation
      allow read, write: if isAdmin();
    }
  }
}

// Storage Security Rules
service firebase.storage {
  match /b/{bucket}/o {
    // Utility functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && firestore.get(/databases/(default)/documents/adminUsers/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // User profile images - public read, user-only write
    match /users/{userId}/profile/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Listing images - public read, owner-only write
    match /listings/{listingId}/photos/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() && 
                    firestore.get(/databases/(default)/documents/listings/$(listingId)).data.ownerUid == request.auth.uid;
    }
    
    // GG Verify media - only accessible to involved parties
    match /ggVerify/{sessionId}/{fileName} {
      allow read: if isAuthenticated() && 
                   firestore.get(/databases/(default)/documents/ggVerifySessions/$(sessionId)).data.userId == request.auth.uid ||
                   (exists(/databases/(default)/documents/bookings/$(firestore.get(/databases/(default)/documents/ggVerifySessions/$(sessionId)).data.bookingId)) &&
                    (firestore.get(/databases/(default)/documents/bookings/$(firestore.get(/databases/(default)/documents/ggVerifySessions/$(sessionId)).data.bookingId)).data.renterUid == request.auth.uid ||
                     firestore.get(/databases/(default)/documents/bookings/$(firestore.get(/databases/(default)/documents/ggVerifySessions/$(sessionId)).data.bookingId)).data.ownerUid == request.auth.uid));
      
      allow write: if isAuthenticated() && 
                    firestore.get(/databases/(default)/documents/ggVerifySessions/$(sessionId)).data.userId == request.auth.uid;
    }
    
    // ID verification documents - only admin access
    match /verification/{userId}/{fileName} {
      allow read: if isAdmin();
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Insurance claim documents
    match /claims/{claimId}/{fileName} {
      allow read: if isAuthenticated() && 
                   firestore.get(/databases/(default)/documents/insuranceClaims/$(claimId)).data.reportedByUid == request.auth.uid || 
                   isAdmin();
      allow write: if isAuthenticated() && 
                    firestore.get(/databases/(default)/documents/insuranceClaims/$(claimId)).data.reportedByUid == request.auth.uid;
    }
  }
}