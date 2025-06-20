# GCTS Quick Reference Card

## 🎯 GearGrab Comprehensive Test Suite (GCTS)

**What it does:** Validates authentication + transaction flows with automatic error correction

## ⚡ Quick Commands

```bash
# Run comprehensive tests (RECOMMENDED)
npm run test:comprehensive

# Alternative command
npm run test:gcts

# With logging
npm run test:comprehensive 2>&1 | tee test-output.log
```

## 📊 Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| `PRODUCTION_READY` ✅ | All systems go | Deploy with confidence |
| `PARTIAL_SUCCESS` ⚠️ | Some issues found | Review before deploy |
| `NEEDS_ATTENTION` ❌ | Critical failures | Fix before deploy |

## 🔍 What Gets Tested

### Phase 1: Authentication 🔐
- Firebase auth integration
- Social logins (Google, Apple, Facebook, GitHub)
- JWT token management
- User sessions

### Phase 2: Transaction Flow 💳
- Payment API security
- Booking authentication
- Stripe integration
- End-to-end security

## 📁 Results Location

```
test-results/gcts-comprehensive-report.json
```

## 🚨 Troubleshooting

```bash
# Check Firebase config
npm run setup:firebase

# Test APIs manually
curl https://geargrab.co/api/payments/create-intent
curl https://geargrab.co/api/book

# Fix permissions
chmod +x scripts/geargrab-comprehensive-test-suite.js
```

## ⏱️ Typical Runtime

- **Duration:** 30-60 seconds
- **Retries:** Up to 3 attempts
- **Timeout:** 2 minutes per test

## 🎯 When to Run

- ✅ Before every deployment
- ✅ After auth system changes
- ✅ After payment updates
- ✅ Before pull requests

---

**💡 Pro Tip:** Always run GCTS before deploying to production!
