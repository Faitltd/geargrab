# Authentication E2E Test Report

**Generated:** 2025-06-17T13:16:53.042Z
**Test Target:** https://geargrab.co
**Status:** ❌ FAILED

## ❌ Test Failures

```
It looks like this is your first time using Cypress: 14.4.1

[STARTED] Task without title.
[TITLE]  Verified Cypress!       /Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app
[SUCCESS]  Verified Cypress!       /Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app

Opening Cypress...
Your configFile is invalid: /Users/raymondkinneiii/Documents/augment-projects/GearGrab/cypress.auth-test.config.js

It threw an error when required, check the stack trace below:

TSError: ⨯ Unable to compile TypeScript:
error TS5102: Option 'importsNotUsedAsValues' has been removed. Please remove it from your configuration.
  Use 'verbatimModuleSyntax' instead.
error TS5102: Option 'preserveValueImports' has been removed. Please remove it from your configuration.
  Use 'verbatimModuleSyntax' instead.

    at createTSError (/Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/index.js:308:16)
    at reportTSError (/Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/index.js:311:23)
    at /Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/index.js:683:17
    at Object.compile (/Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/index.js:740:35)
    at transformSource (/Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/esm.js:212:41)
    at /Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/esm.js:130:61
    at async addShortCircuitFlag (/Users/raymondkinneiii/Library/Caches/Cypress/14.4.1/Cypress.app/Contents/Resources/app/node_modules/ts-node/dist/esm.js:219:17)
    at async nextLoad (node:internal/modules/esm/hooks:748:22)
    at async Hooks.load (node:internal/modules/esm/hooks:385:20)
    at async handleMessage (node:internal/modules/esm/worker:199:18)

```

## 🔧 Test Configuration

- **Base URL:** https://geargrab.co
- **Timeout:** 60000ms per test
- **Retries:** 1 attempt
- **Browser:** Electron (headless)

## 📁 Artifacts

- **Screenshots:** `cypress/screenshots/`
- **Videos:** `cypress/videos/`
- **Raw Results:** `cypress/reports/auth-test-results.json`
