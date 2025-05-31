# 🔥 Firebase Setup Guide for GearGrab

## Current Issue
You're seeing this error: `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`

This happens because your `.env` file contains placeholder values instead of actual Firebase configuration.

## 🚀 Quick Fix Steps

### Step 1: Get Firebase Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your GearGrab project** (or create new project)
3. **Click the gear icon** → **Project settings**
4. **Scroll to "Your apps"** section
5. **Click the web app `</>` icon** (or select existing web app)
6. **Copy the config object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEF123"
};
```

### Step 2: Update Your .env File

Replace the placeholder values in your `.env` file with the actual values from Firebase:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC...  # Your actual API key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF123

# Environment
VITE_USE_EMULATORS=false
```

### Step 3: Enable Authentication

In Firebase Console:
1. **Go to Authentication** → **Sign-in method**
2. **Enable Email/Password** authentication
3. **Enable Google** (optional)
4. **Add your domain** to authorized domains if needed

### Step 4: Set up Firestore Database

1. **Go to Firestore Database**
2. **Create database** in production mode
3. **Choose a location** (preferably close to your users)
4. **Update security rules** (see below)

### Step 5: Configure Storage (if needed)

1. **Go to Storage**
2. **Get started**
3. **Choose same location** as Firestore

## 🔒 Security Rules

### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Listings are readable by all, writable by owner
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;
    }
    
    // Bookings are readable/writable by participants
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.renterId || 
         request.auth.uid == resource.data.ownerId);
      allow create: if request.auth != null;
    }
  }
}
```

### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listings/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing Your Setup

After updating your `.env` file:

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Test authentication**:
   - Go to `/auth/login`
   - Try to create an account
   - Check Firebase Console → Authentication → Users

3. **Check browser console** for any remaining errors

## 🚨 Common Issues & Solutions

### Issue: "Firebase project not found"
**Solution**: Make sure `VITE_FIREBASE_PROJECT_ID` matches your actual project ID

### Issue: "Auth domain not authorized"
**Solution**: Add your domain (localhost:5173) to Firebase Console → Authentication → Settings → Authorized domains

### Issue: "API key restrictions"
**Solution**: Check Firebase Console → Project Settings → API Keys and ensure web API key is not restricted

### Issue: Still getting API key error
**Solution**: 
1. Double-check all environment variables are correct
2. Restart your development server
3. Clear browser cache
4. Check for typos in `.env` file

## 🔄 Environment Variables Checklist

Make sure your `.env` file has these variables with actual values (not placeholders):

- ✅ `VITE_FIREBASE_API_KEY` - Should start with "AIzaSy"
- ✅ `VITE_FIREBASE_AUTH_DOMAIN` - Should end with ".firebaseapp.com"
- ✅ `VITE_FIREBASE_PROJECT_ID` - Your project ID
- ✅ `VITE_FIREBASE_STORAGE_BUCKET` - Should end with ".appspot.com"
- ✅ `VITE_FIREBASE_MESSAGING_SENDER_ID` - Numeric string
- ✅ `VITE_FIREBASE_APP_ID` - Should start with "1:"
- ✅ `VITE_FIREBASE_MEASUREMENT_ID` - Should start with "G-" (optional)

## 🎯 Next Steps

Once Firebase is working:

1. **Test user registration/login**
2. **Set up your data structure** in Firestore
3. **Configure email templates** in Firebase Console
4. **Set up custom domain** (for production)
5. **Configure backup and monitoring**

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify your Firebase project is active and billing is set up (if needed)
3. Make sure you're using the correct project configuration
4. Try creating a fresh Firebase project for testing

Remember: Never commit your actual `.env` file to version control! Keep your API keys secure.
