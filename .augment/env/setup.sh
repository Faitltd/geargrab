#!/bin/bash

# Script 1: Fix the nextStep() function validation logic
echo "🔧 Fixing nextStep() function validation logic..."

# Create a backup of the original file
cp src/routes/list-gear/+page.svelte src/routes/list-gear/+page.svelte.backup

# Create a temporary script to fix the nextStep function
cat > fix_nextstep.js << 'EOL'
const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/routes/list-gear/+page.svelte', 'utf8');

// Find and replace the nextStep function
const oldNextStep = `  // Navigate to next step with validation
  function nextStep(): void {
    if (currentStep < totalSteps) {
      // Still validate to show errors, but proceed anyway
      validateStep(currentStep);
      currentStep++;
      window.scrollTo(0, 0);
    }
  }`;

const newNextStep = `  // Navigate to next step with validation
  function nextStep(): void {
    if (currentStep < totalSteps) {
      // Validate current step and only proceed if valid
      const isValid = validateStep(currentStep);
      if (isValid) {
        currentStep++;
        window.scrollTo(0, 0);
      }
      // If validation fails, errors will be shown but we stay on current step
    }
  }`;

// Replace the function
content = content.replace(oldNextStep, newNextStep);

// Write the file back
fs.writeFileSync('src/routes/list-gear/+page.svelte', content);

console.log('✅ Fixed nextStep() function validation logic');
EOL

# Run the fix script
node fix_nextstep.js

# Clean up
rm fix_nextstep.js

echo "✅ Script 1 completed: nextStep() function now properly validates before proceeding"