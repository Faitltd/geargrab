# Firebase Domain Authorization Setup for GearGrab

## Current Issue
Google authentication is failing with CSP and domain authorization errors. This guide will help you configure Firebase to work with your production domain `geargrab.co`.

## Step 1: Firebase Console - Authorized Domains

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `geargrabco`
3. **Navigate to**: Authentication → Settings → Authorized domains
4. **Add the following domains** (if not already present):
   - `geargrab.co`
   - `www.geargrab.co`
   - `geargrabco.firebaseapp.com` (should already be there)
   - `geargrabco.web.app` (should already be there)
   - `localhost` (for development)

## Step 2: Google Cloud Console - OAuth Configuration

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select Project**: `geargrabco`
3. **Navigate to**: APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID** (should be auto-created by Firebase)
5. **Click Edit** on the OAuth client
6. **Add Authorized JavaScript origins**:
   - `https://geargrab.co`
   - `https://www.geargrab.co`
   - `https://geargrabco.firebaseapp.com`
   - `https://geargrabco.web.app`
7. **Add Authorized redirect URIs**:
   - `https://geargrab.co/__/auth/handler`
   - `https://www.geargrab.co/__/auth/handler`
   - `https://geargrabco.firebaseapp.com/__/auth/handler`
   - `https://geargrabco.web.app/__/auth/handler`

## Step 3: Verify DNS and SSL

1. **Ensure your domain `geargrab.co` is properly configured**:
   - DNS points to your hosting provider
   - SSL certificate is valid and active
   - HTTPS is enforced

## Step 4: Test the Configuration

After making these changes:

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache** completely
3. **Test Google authentication** on your live site
4. **Check browser console** for any remaining errors

## Step 5: Alternative Authentication Method

If popup authentication continues to fail, the code now includes a fallback to redirect-based authentication:

- **Popup Method**: Opens Google sign-in in a popup window
- **Redirect Method**: Redirects the entire page to Google sign-in (fallback)

## Common Issues and Solutions

### Issue: "auth/unauthorized-domain"
- **Solution**: Add your domain to Firebase authorized domains (Step 1)

### Issue: "Popup blocked" or CSP errors
- **Solution**: The code now automatically falls back to redirect method

### Issue: "Cross-Origin-Opener-Policy" errors
- **Solution**: Updated security headers to allow authentication popups

## Verification Checklist

- [ ] Domain added to Firebase authorized domains
- [ ] OAuth client configured in Google Cloud Console
- [ ] DNS and SSL properly configured
- [ ] Browser cache cleared
- [ ] Test authentication on live site

## Need Help?

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Verify all domains are correctly spelled and include proper protocols (https://)
3. Ensure there are no typos in the Firebase configuration
4. Test with different browsers to isolate browser-specific issues

## Security Notes

The recent updates include:
- Updated Content Security Policy to allow Google authentication
- Modified Cross-Origin-Opener-Policy to support auth popups
- Added fallback redirect method for better compatibility
- Maintained security while enabling authentication functionality
