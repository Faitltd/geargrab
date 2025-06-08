#!/usr/bin/env node

/**
 * Script to commit the listing creation fixes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commitListingFixes() {
  console.log('📝 Committing listing creation fixes...');
  
  try {
    // Add the fixed files
    console.log('📁 Adding fixed files to git...');
    await execAsync('git add src/routes/list-gear/+page.svelte');
    await execAsync('git add src/lib/data/products.ts');
    await execAsync('git add scripts/fix-undefined-fields.js');
    await execAsync('git add scripts/fix-image-urls.js');
    await execAsync('git add scripts/fix-listing-validation.js');
    await execAsync('git add scripts/commit-listing-fixes.js');
    
    console.log('✅ Files added to git');
    
    // Commit the changes
    const commitMessage = 'fix: Resolve listing creation issues\n\n- Fix undefined field values in deliveryOptions that caused Firestore errors\n- Replace undefined with appropriate default values (empty strings, 0)\n- Fix broken Unsplash image URLs that returned 404 errors\n- Add utility scripts for listing validation and image URL fixes\n- Listing creation should now work without Firebase errors';
    
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
commitListingFixes().then(success => {
  if (success) {
    console.log('🎉 Listing fixes committed successfully!');
    console.log('📤 Ready to push and deploy');
  } else {
    console.log('❌ Failed to commit changes');
    process.exit(1);
  }
});
