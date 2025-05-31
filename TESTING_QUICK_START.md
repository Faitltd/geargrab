# GearGrab E2E Testing - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Verify Setup
```bash
npm run test:setup
```
This command will:
- ✅ Check if your app is running
- ✅ Verify Cypress is installed
- ✅ Validate configuration
- ✅ Create necessary directories

### Step 2: Start Your Application
```bash
npm run dev
```
Make sure your GearGrab app is running at `http://localhost:5173`

### Step 3: Run Your First Tests
```bash
# Quick smoke test (recommended first run)
npm run test:smoke

# Or open interactive mode to see tests run
npm run cypress:open
```

## 🎯 Test Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run test:setup` | Verify environment | Before first run |
| `npm run test:smoke` | Quick essential tests | Daily development |
| `npm run cypress:open` | Interactive test runner | Debugging/development |
| `npm run test:core` | Core functionality | Before commits |
| `npm run test:all` | Complete test suite | Before deployment |

## 🔧 Common Issues & Solutions

### ❌ "Server not running" Error
**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5173`

**Solution**:
```bash
# Start your application first
npm run dev
# Then run tests
npm run test:smoke
```

### ❌ "Element not found" Errors
**Problem**: Tests fail because elements don't exist

**Solution**: The tests include fallback selectors and will adapt to your current UI. If many tests fail:

1. **Check if your app is actually running** at the expected URL
2. **Run setup to verify environment**:
   ```bash
   npm run test:setup
   ```
3. **Start with smoke tests** to verify basic functionality:
   ```bash
   npm run test:smoke
   ```

### ❌ TypeScript Errors
**Problem**: TypeScript compilation errors

**Solution**: The configuration has been updated to handle this. If issues persist:
```bash
# Clear TypeScript cache
rm -rf .svelte-kit
npm run dev
```

### ❌ Tests Timeout
**Problem**: Tests hang or timeout

**Solution**:
1. **Increase timeout** in individual tests if needed
2. **Check network connectivity**
3. **Verify app is responsive** by manually testing in browser

## 📊 Understanding Test Results

### ✅ Passing Tests
- Green checkmarks indicate successful tests
- Screenshots saved for reference

### ❌ Failing Tests
- Red X marks indicate failures
- **Screenshots automatically saved** to `cypress/screenshots/`
- **Error details** shown in console
- **Video recordings** available if enabled

### ⚠️ Skipped Tests
- Yellow warnings for skipped tests
- Usually due to missing UI elements (this is normal during development)

## 🎯 Test Categories Explained

### Smoke Tests (`test:smoke`)
**What**: Essential functionality only
**Time**: ~2-3 minutes
**Use**: Daily development, quick verification

### Core Tests (`test:core`)
**What**: Main features and user flows
**Time**: ~5-8 minutes
**Use**: Before commits, feature development

### All Tests (`test:all`)
**What**: Complete test suite
**Time**: ~15-20 minutes
**Use**: Before deployment, major releases

## 🛠️ Development Workflow

### Daily Development
```bash
# 1. Start app
npm run dev

# 2. Quick verification
npm run test:smoke

# 3. Develop features...

# 4. Test specific areas
npm run test:core
```

### Before Committing
```bash
# 1. Run core tests
npm run test:core

# 2. If all pass, commit
git add .
git commit -m "Your changes"
```

### Before Deployment
```bash
# 1. Run full test suite
npm run test:all

# 2. Review any failures
# 3. Deploy if all critical tests pass
```

## 🎨 Interactive Testing (Recommended)

For the best development experience:

```bash
npm run cypress:open
```

This opens the Cypress UI where you can:
- **See tests run in real-time**
- **Debug failing tests step-by-step**
- **Inspect elements** during test execution
- **Time travel** through test steps
- **View detailed error messages**

## 📱 Testing Different Devices

The test suite automatically tests:
- **Mobile** (375px width)
- **Tablet** (768px width)  
- **Desktop** (1280px width)

Run responsive tests specifically:
```bash
npm run test:responsive
```

## 🔍 Debugging Tips

### 1. Use Interactive Mode
```bash
npm run cypress:open
```
Click on individual test files to see them run step-by-step.

### 2. Check Screenshots
Failed tests automatically save screenshots to:
```
cypress/screenshots/
```

### 3. Add Debug Points
In test files, add:
```javascript
cy.pause()  // Pauses test execution
cy.debug() // Opens browser DevTools
```

### 4. Check Browser Console
Open DevTools in the Cypress browser to see JavaScript errors.

## 🚨 When Tests Fail

### Don't Panic! 
Test failures during development are normal and expected.

### Investigation Steps:
1. **Check if app is running** (`http://localhost:5173`)
2. **Look at the error message** - it usually tells you what's wrong
3. **Check screenshots** in `cypress/screenshots/`
4. **Run tests interactively** to see what's happening
5. **Start with smoke tests** to verify basics work

### Common Reasons for Failures:
- **App not running** (most common)
- **UI elements changed** (tests need updating)
- **Network issues** (temporary)
- **Browser compatibility** (try different browser)

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ `npm run test:setup` passes all checks
- ✅ `npm run test:smoke` runs without errors
- ✅ You can see your app at `http://localhost:5173`
- ✅ Interactive mode (`npm run cypress:open`) opens successfully

## 📞 Need Help?

If you're still having issues:

1. **Run the setup command** first:
   ```bash
   npm run test:setup
   ```

2. **Check the detailed logs** for specific error messages

3. **Try the interactive mode** to see what's happening:
   ```bash
   npm run cypress:open
   ```

4. **Verify your app works manually** in a browser first

The testing suite is designed to be resilient and will adapt to your current UI implementation. Start with the smoke tests and gradually work up to the full test suite as your application develops.
