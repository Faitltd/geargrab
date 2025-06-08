#!/usr/bin/env node

/**
 * Script to commit and push the Stripe payment fix
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commitStripeFix() {
  console.log('📝 Committing Stripe payment fix...');
  
  try {
    // Add the .env file and scripts
    console.log('📁 Adding files to git...');
    await execAsync('git add .env');
    await execAsync('git add scripts/fix-stripe-config.js');
    await execAsync('git add scripts/test-payment-form.js');
    await execAsync('git add scripts/check-dev-server.js');
    await execAsync('git add scripts/payment-fix-summary.js');
    await execAsync('git add scripts/restart-dev.js');
    
    console.log('✅ Files added to git');
    
    // Commit the changes
    const commitMessage = 'fix: Add Stripe test keys to resolve payment form initialization issue\n\n- Added missing VITE_STRIPE_PUBLISHABLE_KEY to .env\n- Added missing STRIPE_SECRET_KEY to .env\n- Added missing STRIPE_WEBHOOK_SECRET to .env\n- Created utility scripts for Stripe configuration management\n- Payment form should now initialize properly';
    
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
commitStripeFix().then(success => {
  if (success) {
    console.log('🎉 Stripe fix committed successfully!');
    console.log('📤 Ready to push to remote repository');
  } else {
    console.log('❌ Failed to commit changes');
    process.exit(1);
  }
});
