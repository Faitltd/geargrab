# JWT Role-Based Authentication Implementation Guide for GearGrab

## ✅ What's Already Done

1. **✅ JWT Dependency Added** - `jsonwebtoken` package installed
2. **✅ Environment Variable Added** - `JWT_SECRET` added to `.env`
3. **✅ Middleware Created** - Enhanced auth middleware in `src/lib/server/enhanced-auth-middleware.ts`
4. **✅ Example Routes Created** - Sample implementation in `src/routes/api/admin/example/+server.ts`

## 🚀 How to Use in Your Existing Routes

### Option 1: Quick Integration (Recommended)

Replace your existing auth calls with the enhanced version:

**Before:**
```typescript
// Old way
const authResult = await AuthMiddlewareV2.requireAuth(event);
if (authResult instanceof Response) {
  return authResult;
}
const userId = authResult.userId!;
```

**After:**
```typescript
// New way with roles
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';

const authResult = await EnhancedAuthMiddleware.requireAdminOrEditor(event);
if (!authResult.success) {
  return EnhancedAuthMiddleware.createErrorResponse(authResult);
}

const { userId, userRole } = authResult;
// Now you have: userRole.isAdmin, userRole.isEditor, userRole.roles
```

### Option 2: Add Role Checking to Existing Routes

Keep your existing auth, just add role checking:

```typescript
// Keep existing auth
const authResult = await AuthMiddlewareV2.requireAuth(event);
if (authResult instanceof Response) {
  return authResult;
}

// Add role checking
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';
const roleResult = await EnhancedAuthMiddleware.requireAuthWithRoles(event);
if (!roleResult.success || !roleResult.userRole?.isAdmin) {
  return json({ error: 'Admin access required' }, { status: 403 });
}
```

## 📋 Implementation Steps

### Step 1: Update Admin Routes

For routes that should only be accessible by admins:

```typescript
// src/routes/api/admin/users/+server.ts
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';

export const POST: RequestHandler = async (event) => {
  // Require admin privileges
  const authResult = await EnhancedAuthMiddleware.requireAdmin(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  // Admin-only logic here
  const { userId, userRole } = authResult;
  console.log(`Admin action by: ${userRole?.roles}`);
  
  // Your existing code...
};
```

### Step 2: Update Editor/Admin Routes

For routes that should be accessible by editors OR admins:

```typescript
// src/routes/api/content/+server.ts
import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware';

export const POST: RequestHandler = async (event) => {
  // Require admin or editor privileges
  const authResult = await EnhancedAuthMiddleware.requireAdminOrEditor(event);
  if (!authResult.success) {
    return EnhancedAuthMiddleware.createErrorResponse(authResult);
  }

  // Editor/Admin logic here
  const { userId, userRole } = authResult;
  
  // Your existing code...
};
```

### Step 3: Keep Regular User Routes Unchanged

For regular user routes, keep using your existing auth:

```typescript
// src/routes/api/bookings/+server.ts
import { AuthMiddlewareV2 } from '$lib/auth/middleware-v2';

export const POST: RequestHandler = async (event) => {
  // Regular user authentication (no role requirements)
  const authResult = await AuthMiddlewareV2.requireAuth(event);
  if (authResult instanceof Response) {
    return authResult;
  }

  // Regular user logic here
  const userId = authResult.userId!;
  
  // Your existing code...
};
```

## 🔧 Setting User Roles

### Option 1: Firebase Custom Claims (Recommended)

Add roles to users in Firebase:

```javascript
// In Firebase Admin SDK
await admin.auth().setCustomUserClaims(userId, {
  admin: true,  // Makes user an admin
  editor: true  // Makes user an editor
});
```

### Option 2: JWT Token Roles

Include roles when creating JWT tokens:

```javascript
const token = jwt.sign({
  sub: userId,
  email: userEmail,
  roles: ['admin', 'editor']  // User roles
}, process.env.JWT_SECRET);
```

## 🧪 Testing Your Implementation

### Test Admin Access

```bash
# Create admin token (for testing)
curl -X POST http://localhost:5173/api/admin/example \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Role Rejection

```bash
# Try with regular user token (should fail)
curl -X POST http://localhost:5173/api/admin/example \
  -H "Authorization: Bearer YOUR_REGULAR_USER_TOKEN" \
  -H "Content-Type: application/json"
```

## 📝 Quick Checklist

- [ ] **Install dependency**: `npm install jsonwebtoken` ✅ Done
- [ ] **Add JWT_SECRET**: Added to `.env` file ✅ Done
- [ ] **Import middleware**: `import { EnhancedAuthMiddleware } from '$lib/server/enhanced-auth-middleware'`
- [ ] **Update admin routes**: Replace auth calls with `requireAdmin()`
- [ ] **Update editor routes**: Replace auth calls with `requireAdminOrEditor()`
- [ ] **Set user roles**: Add admin/editor roles to user accounts
- [ ] **Test access**: Verify admin/editor access works correctly

## 🔒 Security Notes

1. **JWT_SECRET**: Keep this secret secure and use a strong random string
2. **Role Assignment**: Only assign admin/editor roles to trusted users
3. **Token Expiration**: Set appropriate expiration times for JWT tokens
4. **HTTPS Only**: Always use HTTPS in production for token transmission

## 🆘 Need Help?

If you encounter issues:

1. **Check logs**: Look for authentication error messages in console
2. **Verify JWT_SECRET**: Make sure it's set in environment variables
3. **Check user roles**: Verify users have correct admin/editor roles assigned
4. **Test with example route**: Use `/api/admin/example` to test basic functionality

## 🎯 Next Steps

1. **Start with one route**: Pick one admin route and implement role checking
2. **Test thoroughly**: Verify both success and failure cases
3. **Gradually migrate**: Update other routes one by one
4. **Add role management**: Create UI for assigning roles to users

The middleware is designed to work alongside your existing authentication system, so you can implement it gradually without breaking existing functionality!
