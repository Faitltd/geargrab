# 🔧 Quick Fix Guide - Authentication & 500 Errors

## 🚨 **TL;DR - Run This First:**

```bash
./scripts/fix-auth-issues.sh
```

This master script will diagnose and guide you through fixing all issues.

---

## 📋 **Available Scripts:**

### **🔍 1. Diagnose Issues**
```bash
./scripts/fix-500-errors.sh
```
- Checks current deployment status
- Identifies missing environment variables
- Shows recent error logs
- Recommends next steps

### **🔥 2. Setup Firebase Admin**
```bash
./scripts/setup-firebase-admin.sh
```
- Guides you through Firebase Admin setup
- Extracts credentials from service account JSON
- Updates .env file with required variables
- **Run this if you haven't set up Firebase Admin yet**

### **🚀 3. Deploy with Environment Variables**
```bash
./scripts/deploy-with-env.sh
```
- Deploys with all required environment variables
- Fixes Firebase Admin initialization issues
- **This fixes the 500 errors**
- Takes 5-10 minutes

### **⚡ 4. Simple Code Deployment**
```bash
./scripts/simple-deploy.sh
```
- Quick deployment for code changes only
- Preserves existing environment variables
- Use when you only changed code, not config

### **🔍 5. Check Deployment Health**
```bash
./scripts/check-deployment.sh
```
- Tests all endpoints
- Checks environment variables
- Shows recent logs
- Provides health summary

---

## 🎯 **Most Common Issues & Solutions:**

### **Issue: 500 Internal Server Error**
**Cause:** Missing Firebase Admin environment variables
**Solution:**
```bash
./scripts/setup-firebase-admin.sh
./scripts/deploy-with-env.sh
```

### **Issue: Sign-in button scrolls to top**
**Cause:** Browser cache loading old JavaScript
**Solution:**
1. Clear browser cache completely (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Test in incognito mode

### **Issue: Google sign-in fails with CSP errors**
**Cause:** Old cached JavaScript with old CSP config
**Solution:**
1. Clear browser cache completely
2. The new deployment has fixed CSP

### **Issue: Payment forms show 401 errors**
**Cause:** Authentication not working properly
**Solution:**
1. Fix Firebase Admin with scripts above
2. Clear browser cache
3. Test authentication flow

---

## 🔄 **Step-by-Step Fix Process:**

### **Step 1: Run Master Script**
```bash
./scripts/fix-auth-issues.sh
```

### **Step 2: If Firebase Admin Missing**
```bash
# Download service account JSON from Firebase Console
./scripts/setup-firebase-admin.sh
./scripts/deploy-with-env.sh
```

### **Step 3: Clear Browser Cache**
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "All time"
- Check all boxes
- Click "Clear data"

### **Step 4: Test Everything**
```bash
./scripts/check-deployment.sh
```

---

## 🧪 **Testing Checklist:**

After running the scripts:

### **✅ Authentication Tests:**
- [ ] Visit your GearGrab URL
- [ ] Click "Book Now" on any item
- [ ] Click "Sign In to Continue"
- [ ] Should navigate to `/auth/login` (not scroll to top)
- [ ] Google sign-in should work without CSP errors
- [ ] Authentication state should persist across pages

### **✅ Payment Tests:**
- [ ] Sign in first
- [ ] Try to book an item
- [ ] Payment form should load without 401 errors
- [ ] Stripe elements should initialize properly

### **✅ Browser Console:**
- [ ] No CSP violation errors
- [ ] No Firebase auth internal errors
- [ ] Should see: "🔄 Navigating to login page..." when clicking sign-in

---

## 🆘 **If Scripts Don't Work:**

### **Manual Environment Variable Setup:**
```bash
# Set these in Cloud Run manually:
gcloud run services update geargrab --region us-central1 \
  --set-env-vars FIREBASE_PROJECT_ID=geargrabco \
  --set-env-vars FIREBASE_ADMIN_CLIENT_EMAIL=your-email@geargrabco.iam.gserviceaccount.com \
  --set-env-vars FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **Check Logs Manually:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=geargrab" --limit=20
```

### **Test Endpoints Manually:**
```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe geargrab --region us-central1 --format="value(status.url)")

# Test homepage
curl -I $SERVICE_URL

# Test login page
curl -I $SERVICE_URL/auth/login
```

---

## 📞 **Need Help?**

If the scripts don't solve your issue:

1. **Run the diagnosis:** `./scripts/fix-500-errors.sh`
2. **Check the logs:** `./scripts/check-deployment.sh`
3. **Review the detailed guides:**
   - `SIGN_IN_NAVIGATION_FIX.md`
   - `CACHE_CLEARING_GUIDE.md`
   - `AUTHENTICATION_FIXES_SUMMARY.md`

---

## 🎉 **Success Indicators:**

You'll know everything is working when:

- ✅ Homepage loads without 500 errors
- ✅ Sign-in button navigates to login page
- ✅ Google authentication works
- ✅ Payment forms load for authenticated users
- ✅ No CSP violations in browser console
- ✅ Authentication state persists across pages

**The scripts above will get you there! 🚀**
