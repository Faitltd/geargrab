#!/usr/bin/env node

/**
 * Script to commit only the utility scripts (not .env file)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commitScripts() {
  console.log('📝 Committing Stripe utility scripts...');
  
  try {
    // Add only the scripts (not .env)
    console.log('📁 Adding script files to git...');
    await execAsync('git add scripts/fix-stripe-config.js');
    await execAsync('git add scripts/test-payment-form.js');
    await execAsync('git add scripts/check-dev-server.js');
    await execAsync('git add scripts/payment-fix-summary.js');
    await execAsync('git add scripts/restart-dev.js');
    await execAsync('git add scripts/commit-stripe-fix.js');
    await execAsync('git add scripts/commit-scripts-only.js');
    
    console.log('✅ Script files added to git');
    
    // Commit the changes
    const commitMessage = 'feat: Add Stripe configuration utility scripts\n\n- Added fix-stripe-config.js to automatically add missing Stripe keys\n- Added test-payment-form.js to verify Stripe configuration\n- Added check-dev-server.js to manage development server\n- Added utility scripts for payment form troubleshooting\n- These scripts help resolve payment form initialization issues';
    
    console.log('💾 Committing changes...');
    await execAsync(`git commit -m "${commitMessage}"`);
    console.log('✅ Changes committed');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during commit:', error.message);
    return false;
  }
}

// Run the commit
commitScripts().then(success => {
  if (success) {
    console.log('🎉 Stripe utility scripts committed successfully!');
    console.log('📤 Ready to push to remote repository');
  } else {
    console.log('❌ Failed to commit changes');
    process.exit(1);
  }
});
