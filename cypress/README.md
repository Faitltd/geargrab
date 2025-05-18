# Cypress Tests for GearGrab

This directory contains end-to-end tests for the GearGrab application using Cypress.

## Test Cases

### Listing Creation Form Tests

The `e2e/list-gear.cy.js` file contains tests for the listing creation form:

1. **Initial State Test**: Verifies that the form loads correctly with the expected initial state.
2. **Form Navigation Test**: Tests navigation through all steps of the form.
3. **Validation Test**: Verifies that required fields are properly validated.
4. **Availability Calendar Test**: Tests the functionality of the availability calendar.
5. **Image Uploader Test**: Verifies that the image uploader component is rendered correctly.

## Running the Tests

### Prerequisites

- Make sure the application is running locally on port 5173 (`npm run dev`)
- Ensure Cypress is installed (`npm install --save-dev cypress`)

### Running Tests in the Cypress UI

```bash
npm run cypress:open
```

This will open the Cypress Test Runner UI. From there, you can:
1. Select "E2E Testing"
2. Choose a browser
3. Click on the `list-gear.cy.js` test to run it

### Running Tests Headlessly

```bash
npm run cypress:run
```

This will run all tests in headless mode and output the results to the console.

## Known Issues

There may be issues with TypeScript configuration when running Cypress tests. If you encounter errors related to TypeScript configuration, try the following:

1. Create a separate `tsconfig.json` file in the `cypress` directory with the following content:
   ```json
   {
     "compilerOptions": {
       "target": "es5",
       "lib": ["es5", "dom"],
       "types": ["cypress", "node"],
       "esModuleInterop": true,
       "skipLibCheck": true
     },
     "include": ["**/*.ts"]
   }
   ```

2. Update the `cypress.config.js` file to use CommonJS format:
   ```js
   const { defineConfig } = require("cypress");

   module.exports = defineConfig({
     e2e: {
       baseUrl: 'http://localhost:5173',
       setupNodeEvents(on, config) {
         // implement node event listeners here
       },
     },
   });
   ```

## Test Coverage

The tests cover the following features:

1. **Basic Form Navigation**: Tests that users can navigate through all steps of the form.
2. **Form Validation**: Tests that required fields are properly validated.
3. **Availability Calendar**: Tests that users can select and deselect dates in the calendar.
4. **Image Uploader**: Tests that the image uploader component is rendered correctly.

## Future Improvements

1. **File Upload Testing**: Add tests for actual file uploads using Cypress plugins.
2. **Drag-and-Drop Testing**: Add tests for the drag-and-drop functionality in the image uploader.
3. **API Mocking**: Add tests that mock API calls to test form submission.
4. **Visual Testing**: Add visual regression tests to ensure the UI looks correct.
