# Google Authentication Setup Guide for GearGrab

This guide will help you configure Google authentication for the GearGrab application.

## Prerequisites

- Firebase project created (geargrabco)
- Google Cloud Console access
- Admin access to Firebase Console

## Step 1: Firebase Console Configuration

### 1.1 Enable Google Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **geargrabco**
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Google** in the list of providers
5. Click **Enable**
6. Configure the settings:
   - **Project support email**: Use your project email
   - **Project public-facing name**: GearGrab
7. Click **Save**

### 1.2 Configure Authorized Domains

1. In the same **Sign-in method** tab
2. Scroll down to **Authorized domains**
3. Ensure these domains are added:
   - `localhost` (for development)
   - `geargrabco.web.app` (Firebase hosting)
   - `geargrabco.firebaseapp.com` (Firebase hosting)
   - Your custom domain (if any)

## Step 2: Google Cloud Console Configuration

### 2.1 Access OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **geargrabco**
3. Navigate to **APIs & Services** → **OAuth consent screen**

### 2.2 Configure OAuth Consent Screen

1. **User Type**: Choose **External** (unless you have Google Workspace)
2. **App Information**:
   - App name: `GearGrab`
   - User support email: Your email
   - App logo: Upload GearGrab logo (optional)
3. **App domain**:
   - Application home page: `https://geargrabco.web.app`
   - Application privacy policy: `https://geargrabco.web.app/privacy`
   - Application terms of service: `https://geargrabco.web.app/terms`
4. **Developer contact information**: Your email
5. Click **Save and Continue**

### 2.3 Configure Scopes

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. Click **Update** and **Save and Continue**

### 2.4 Add Test Users (if needed)

If your app is in testing mode:
1. Add test user emails
2. Click **Save and Continue**

## Step 3: OAuth Client Configuration

### 3.1 Access Credentials

1. In Google Cloud Console
2. Navigate to **APIs & Services** → **Credentials**

### 3.2 Configure OAuth 2.0 Client

1. Find your OAuth 2.0 Client ID (created by Firebase)
2. Click the edit icon (pencil)
3. **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://geargrabco.web.app` (production)
   - `https://geargrabco.firebaseapp.com` (production)
4. **Authorized redirect URIs**:
   - `http://localhost:5173/__/auth/handler` (development)
   - `https://geargrabco.web.app/__/auth/handler` (production)
   - `https://geargrabco.firebaseapp.com/__/auth/handler` (production)
5. Click **Save**

## Step 4: Environment Variables

Ensure your `.env` file has the correct Firebase configuration:

```env
# Firebase Configuration - GearGrab Project
VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs
VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=geargrabco
VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028
VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009
```

## Step 5: Testing

### 5.1 Use Debug Panel

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:5173/debug/auth`
3. Click **Test Google Auth** to diagnose issues

### 5.2 Test Authentication Flow

1. Go to login page: `http://localhost:5173/auth/login`
2. Click **Sign in with Google**
3. Complete the OAuth flow
4. Verify successful authentication

## Common Issues and Solutions

### Issue: "This app isn't verified"

**Solution**: 
- Your app is in testing mode
- Add your email as a test user in Google Cloud Console
- Or submit for verification (for production)

### Issue: "redirect_uri_mismatch"

**Solution**:
- Check authorized redirect URIs in Google Cloud Console
- Ensure they match exactly (including protocol and port)

### Issue: "popup_closed_by_user"

**Solution**:
- User closed the popup
- Disable popup blockers
- Try again

### Issue: "unauthorized_domain"

**Solution**:
- Add your domain to authorized domains in Firebase Console
- Include both localhost and production domains

## Verification Checklist

- [ ] Google provider enabled in Firebase Console
- [ ] Authorized domains configured
- [ ] OAuth consent screen configured
- [ ] OAuth client credentials configured
- [ ] Authorized JavaScript origins set
- [ ] Authorized redirect URIs set
- [ ] Environment variables correct
- [ ] Test authentication works

## Support

If you continue to have issues:

1. Check browser console for detailed error messages
2. Use the debug panel at `/debug/auth`
3. Verify all configuration steps above
4. Check Firebase Console logs
5. Review Google Cloud Console audit logs

## Security Notes

- Never expose Firebase config in client-side code (it's safe - these are public identifiers)
- Keep your Firebase Admin SDK private key secure
- Regularly review authorized domains
- Monitor authentication logs for suspicious activity
