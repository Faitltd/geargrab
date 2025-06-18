# Google Authentication Troubleshooting Guide

## Current Configuration Status ✅

Your Firebase project is properly configured:
- **Project ID**: `geargrabco`
- **Auth Domain**: `geargrabco.firebaseapp.com`
- **API Key**: Configured ✅
- **App ID**: Configured ✅

## Step-by-Step Verification Checklist

### 1. Firebase Console - Authentication Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `geargrabco`
3. **Navigate to**: Authentication → Sign-in method
4. **Verify Google Provider**:
   - ✅ Google should be **ENABLED**
   - ✅ Project support email should be set
   - ✅ Project public-facing name should be "GearGrab"

### 2. Authorized Domains Configuration

**CRITICAL**: Verify these domains are in the authorized domains list:

1. In Firebase Console → Authentication → Settings → Authorized domains
2. **Required domains**:
   - ✅ `localhost` (for development)
   - ✅ `geargrabco.firebaseapp.com` (Firebase hosting)
   - ✅ Your production domain (if deployed elsewhere)

**To add localhost**:
1. Click "Add domain"
2. Enter: `localhost`
3. Click "Add"

### 3. Google Cloud Console - OAuth Setup

1. **Go to**: https://console.cloud.google.com/
2. **Select Project**: `geargrabco`
3. **Navigate to**: APIs & Services → Credentials
4. **Find OAuth 2.0 Client IDs**
5. **Verify Authorized Origins**:
   - ✅ `http://localhost:5173`
   - ✅ `https://geargrabco.firebaseapp.com`
   - ✅ Your production domain

**To add localhost**:
1. Click on your OAuth client ID
2. Under "Authorized JavaScript origins", click "ADD URI"
3. Add: `http://localhost:5173`
4. Click "Save"

### 4. OAuth Consent Screen

1. **Navigate to**: APIs & Services → OAuth consent screen
2. **Verify Configuration**:
   - ✅ App name: "GearGrab"
   - ✅ User support email: Set
   - ✅ Developer contact email: Set
   - ✅ App domain: Your domain
   - ✅ Privacy policy URL: Set (if required)
   - ✅ Terms of service URL: Set (if required)

### 5. Browser-Specific Troubleshooting

#### Chrome/Edge:
1. **Disable popup blockers**:
   - Click the popup blocker icon in address bar
   - Select "Always allow popups from localhost:5173"

2. **Clear browser data**:
   - Press F12 → Application → Storage → Clear site data

#### Safari:
1. **Enable popups**: Safari → Preferences → Websites → Pop-up Windows
2. **Allow cross-site tracking**: Privacy → Prevent cross-site tracking (disable)

#### Firefox:
1. **Popup settings**: about:preferences#privacy → Permissions → Block pop-up windows
2. **Add exception** for localhost:5173

### 6. Testing Steps

1. **Open browser console** (F12)
2. **Navigate to**: http://localhost:5173/auth/login
3. **Click "Continue with Google"**
4. **Check console for errors**

## Common Error Messages & Solutions

### "popup_blocked_by_browser"
- **Solution**: Disable popup blockers for localhost:5173
- **Alternative**: Try incognito/private browsing mode

### "unauthorized_domain"
- **Solution**: Add `localhost` to Firebase authorized domains
- **Solution**: Add `http://localhost:5173` to Google Cloud OAuth origins

### "invalid_client"
- **Solution**: Verify OAuth client ID matches Firebase configuration
- **Solution**: Check Google Cloud Console credentials

### "access_denied"
- **Solution**: User cancelled or OAuth consent screen not properly configured
- **Solution**: Verify OAuth consent screen is published (not in testing mode)

### "network_error"
- **Solution**: Check internet connection
- **Solution**: Verify Firebase API key is correct

## Debug Component

I've created a debug component to help diagnose issues. Add this to any page:

```svelte
<script>
  import GoogleAuthDebug from '$lib/components/debug/GoogleAuthDebug.svelte';
</script>

<GoogleAuthDebug />
```

## Quick Test Commands

Run these in browser console on localhost:5173:

```javascript
// Check Firebase config
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});

// Test popup
window.open('https://accounts.google.com', '_blank', 'width=500,height=600');
```

## Next Steps

1. ✅ Verify all checklist items above
2. ✅ Test in incognito/private browsing mode
3. ✅ Check browser console for specific error messages
4. ✅ Use the debug component to get detailed information
5. ✅ Test with different browsers

If issues persist, the debug component will provide specific error details to help identify the exact problem.
