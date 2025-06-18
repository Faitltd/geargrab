# Development and Test Routes

This directory contains routes that were moved from the main application to keep the production structure clean.

## Moved Routes

### Test Routes
- `test-basic/` - Basic functionality tests
- `test-payment/` - Payment system tests
- `test-minimal/` - Minimal component tests
- `test-listings/` - Listing functionality tests
- `test-firebase/` - Firebase integration tests
- `test-simple/` - Simple UI tests
- `test-checkboxes/` - Checkbox component tests
- `test-console/` - Console debugging tests
- `test-auth/` - Authentication tests
- `test-payment-debug/` - Payment debugging
- `test-raw/` - Raw component tests

### Debug Routes
- `debug-auth/` - Authentication debugging
- `debug/` - General debugging tools
- `animation-test/` - Animation testing

## Usage

To use these routes during development:

1. **Temporarily restore routes:**
   ```bash
   cp -r dev-routes/test-* src/routes/
   ```

2. **Access in browser:**
   ```
   http://localhost:5173/test-basic
   http://localhost:5173/debug-auth
   ```

3. **Clean up after testing:**
   ```bash
   rm -rf src/routes/test-* src/routes/debug-*
   ```

## Remaining Test Endpoints

The following test endpoints remain in the main application as they may be needed for production monitoring:

- `src/routes/admin/*/test` - Admin test endpoints
- `src/routes/api/*/test` - API test endpoints

These should be protected by authentication and only accessible to administrators.

## Notes

- These routes are excluded from production builds
- They can be restored temporarily for development/debugging
- Consider creating a development-only environment variable to conditionally include these routes
