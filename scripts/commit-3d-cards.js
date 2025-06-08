#!/usr/bin/env node

/**
 * Script to commit the new 3D listing cards
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commit3DCards() {
  console.log('📝 Committing new 3D listing cards...');
  
  try {
    // Add the new files
    console.log('📁 Adding files to git...');
    await execAsync('git add src/lib/components/ListingCard3D.svelte');
    await execAsync('git add src/routes/browse/+page.svelte');
    await execAsync('git add src/routes/+page.svelte');
    await execAsync('git add scripts/update-listing-card.js');
    await execAsync('git add scripts/update-browse-page.js');
    await execAsync('git add scripts/commit-3d-cards.js');
    
    console.log('✅ Files added to git');
    
    // Commit the changes
    const commitMessage = 'feat: Add stunning 3D glass morphism listing cards\n\n- Created new ListingCard3D component with 3D perspective effects\n- Added beautiful gradient backgrounds and glass morphism design\n- Implemented interactive hover animations and rotations\n- Added social action buttons with staggered animations\n- Updated browse and home pages to use new 3D cards\n- Enhanced user experience with modern card design\n- Features depth layers, backdrop blur, and smooth transitions';
    
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
commit3DCards().then(success => {
  if (success) {
    console.log('🎉 3D listing cards committed successfully!');
    console.log('📤 Ready to push and deploy the new design');
    console.log('✨ Users will love the new 3D card effects!');
  } else {
    console.log('❌ Failed to commit changes');
    process.exit(1);
  }
});
