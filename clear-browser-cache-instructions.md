# 🧹 Clear Browser Cache Instructions

## Why This is Needed
The browser is caching the old JavaScript bundle that contains the old Stripe key. Even though we've updated the server, your browser is still using the cached version.

## 🔄 How to Clear Cache

### **Chrome/Edge:**
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "All time" from the time range
3. Check "Cached images and files"
4. Click "Clear data"

### **Firefox:**
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Everything" from the time range
3. Check "Cache"
4. Click "Clear Now"

### **Safari:**
1. Press `Cmd+Option+E` (Mac)
2. Or go to Safari > Clear History...
3. Select "All History"
4. Click "Clear History"

## 🚀 Alternative: Hard Refresh
Instead of clearing all cache, you can do a hard refresh:
- **Chrome/Firefox/Edge:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari:** `Cmd+Option+R` (Mac)

## 🧪 Test After Clearing Cache

1. **Visit Debug Page:** https://geargrab.co/debug/stripe
   - Should show new key starting with `pk_live_51RZXbx...`

2. **Test Payment Form:** https://geargrab.co/payment?amount=1.00&currency=usd&title=Test
   - Should show credit card input fields
   - No more 400 errors in browser console

3. **Check Browser Console:** (F12 → Console tab)
   - Should see no Stripe-related errors
   - Should see successful Stripe initialization

## ✅ Expected Results After Fix

### **Browser Console Should Show:**
```
✅ Stripe initialized successfully
✅ Payment element mounted
✅ No 400 errors from api.stripe.com
```

### **Payment Form Should Show:**
```
┌─────────────────────────────────────┐
│ Card number                         │
│ [•••• •••• •••• ••••]              │
├─────────────────────────────────────┤
│ MM/YY    CVC                        │
│ [••/••]  [•••]                      │
├─────────────────────────────────────┤
│ Cardholder name                     │
│ [                    ]              │
└─────────────────────────────────────┘
```

## 🆘 If Still Not Working

1. **Try Incognito/Private Mode:** This bypasses all cache
2. **Try Different Browser:** To rule out browser-specific issues
3. **Check Network Tab:** Look for failed requests to Stripe API
4. **Wait 5-10 minutes:** CDN cache might need time to update

---

**Status:** 🔄 Deployment in progress...
**Next:** Clear cache and test once deployment completes!
