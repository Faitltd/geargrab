#!/usr/bin/env node

/**
 * Script to update browse page to use new 3D listing cards
 */

import fs from 'fs';

function updateBrowsePage() {
  console.log('🔄 Updating browse page to use 3D listing cards...');
  
  const filePath = 'src/routes/browse/+page.svelte';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import for new 3D component at the top
    if (!content.includes('ListingCard3D')) {
      // Find the script tag and add import
      const scriptMatch = content.match(/<script[^>]*>/);
      if (scriptMatch) {
        const importStatement = `  import ListingCard3D from '$lib/components/ListingCard3D.svelte';\n`;
        content = content.replace(scriptMatch[0], scriptMatch[0] + '\n' + importStatement);
        console.log('✅ Added ListingCard3D import');
      }
    }
    
    // Look for existing listing card usage patterns
    const cardPatterns = [
      // Pattern 1: Simple listing card
      /<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<\/div>/g,
      // Pattern 2: Grid item with listing
      /<div[^>]*class="[^"]*listing[^"]*"[^>]*>[\s\S]*?<\/div>/g,
      // Pattern 3: Any div containing listing data
      /{#each.*listings.*as.*listing[^}]*}[\s\S]*?{\/each}/g
    ];
    
    // Find the listings grid section
    const gridMatch = content.match(/{#each.*listings.*as.*listing[^}]*}([\s\S]*?){\/each}/);
    
    if (gridMatch) {
      console.log('📍 Found listings grid section');
      
      // Replace with new 3D card
      const newGridContent = `{#each filteredListings as listing}
        <ListingCard3D 
          {listing} 
          onClick={() => goto(\`/listing/\${listing.id}\`)} 
        />
      {/each}`;
      
      content = content.replace(gridMatch[0], newGridContent);
      console.log('✅ Updated listings grid to use 3D cards');
    }
    
    // Update the grid container classes for better 3D card layout
    const gridContainerPattern = /class="[^"]*grid[^"]*"/g;
    const gridMatches = content.match(gridContainerPattern);
    
    if (gridMatches) {
      for (const match of gridMatches) {
        if (match.includes('grid') && !match.includes('gap-8')) {
          const newGridClass = match.replace('"', ' gap-8 justify-items-center"');
          content = content.replace(match, newGridClass);
          console.log('✅ Updated grid container classes for 3D cards');
        }
      }
    }
    
    // Write the updated content
    fs.writeFileSync(filePath, content);
    console.log('💾 Updated browse page successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating browse page:', error.message);
    return false;
  }
}

function updateHomePage() {
  console.log('🔄 Updating home page to use 3D listing cards...');
  
  const filePath = 'src/routes/+page.svelte';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import for new 3D component
    if (!content.includes('ListingCard3D')) {
      const scriptMatch = content.match(/<script[^>]*>/);
      if (scriptMatch) {
        const importStatement = `  import ListingCard3D from '$lib/components/ListingCard3D.svelte';\n`;
        content = content.replace(scriptMatch[0], scriptMatch[0] + '\n' + importStatement);
        console.log('✅ Added ListingCard3D import to homepage');
      }
    }
    
    // Find featured listings section
    const featuredMatch = content.match(/{#each.*featuredListings.*as.*listing[^}]*}([\s\S]*?){\/each}/);
    
    if (featuredMatch) {
      console.log('📍 Found featured listings section');
      
      const newFeaturedContent = `{#each featuredListings as listing}
        <ListingCard3D 
          {listing} 
          onClick={() => goto(\`/listing/\${listing.id}\`)} 
        />
      {/each}`;
      
      content = content.replace(featuredMatch[0], newFeaturedContent);
      console.log('✅ Updated featured listings to use 3D cards');
    }
    
    // Write the updated content
    fs.writeFileSync(filePath, content);
    console.log('💾 Updated home page successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating home page:', error.message);
    return false;
  }
}

function main() {
  console.log('🎨 Updating pages to use new 3D listing cards...\n');
  
  const browseSuccess = updateBrowsePage();
  const homeSuccess = updateHomePage();
  
  if (browseSuccess && homeSuccess) {
    console.log('\n🎉 Successfully updated pages with 3D listing cards!');
    console.log('🚀 The new cards feature:');
    console.log('   ✨ 3D perspective and rotation effects');
    console.log('   🌈 Beautiful gradient backgrounds');
    console.log('   💎 Glass morphism design');
    console.log('   🎯 Interactive hover animations');
    console.log('   🔘 Social action buttons');
    console.log('');
    console.log('📝 Next: Test the new cards in your browser!');
  } else {
    console.log('\n❌ Some updates failed');
  }
}

main();
