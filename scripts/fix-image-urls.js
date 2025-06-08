#!/usr/bin/env node

/**
 * Script to fix broken Unsplash image URLs
 */

import fs from 'fs';

function findImageUrls() {
  console.log('🔍 Finding files with image URLs...');
  
  const filesToCheck = [
    'src/lib/data/products.ts',
    'src/routes/browse/+page.svelte',
    'src/routes/+page.svelte'
  ];
  
  const foundIssues = [];
  
  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      console.log(`📁 Checking: ${file}`);
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Look for broken Unsplash URLs
        const brokenUrls = content.match(/images\.unsplash\.com\/photo-[^"'\s]+/g);
        if (brokenUrls) {
          foundIssues.push({
            file,
            urls: brokenUrls,
            content
          });
          console.log(`⚠️  Found ${brokenUrls.length} Unsplash URLs in ${file}`);
        }
        
      } catch (error) {
        console.error(`❌ Error reading ${file}:`, error.message);
      }
    }
  }
  
  return foundIssues;
}

function fixImageUrls(issues) {
  console.log('\n🔧 Fixing broken image URLs...');
  
  // Working Unsplash URLs for different categories
  const workingImages = {
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    skiing: 'https://images.unsplash.com/photo-1551524164-6cf2ac2d7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    biking: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    water: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
    climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
  };
  
  let fixedCount = 0;
  
  for (const issue of issues) {
    let content = issue.content;
    let fileChanged = false;
    
    // Replace broken URLs with working ones
    for (const brokenUrl of issue.urls) {
      // Try to determine category from context
      let replacementUrl = workingImages.camping; // default
      
      if (content.includes('ski') || content.includes('snow')) {
        replacementUrl = workingImages.skiing;
      } else if (content.includes('bike') || content.includes('cycle')) {
        replacementUrl = workingImages.biking;
      } else if (content.includes('hik') || content.includes('trek')) {
        replacementUrl = workingImages.hiking;
      } else if (content.includes('water') || content.includes('kayak')) {
        replacementUrl = workingImages.water;
      } else if (content.includes('climb') || content.includes('rock')) {
        replacementUrl = workingImages.climbing;
      }
      
      // Replace the broken URL
      content = content.replace(brokenUrl, replacementUrl);
      fileChanged = true;
      fixedCount++;
    }
    
    if (fileChanged) {
      fs.writeFileSync(issue.file, content);
      console.log(`✅ Fixed ${issue.urls.length} URLs in ${issue.file}`);
    }
  }
  
  return fixedCount;
}

function main() {
  console.log('🖼️  Fixing broken image URLs...\n');
  
  const issues = findImageUrls();
  
  if (issues.length === 0) {
    console.log('✅ No broken image URLs found');
    return;
  }
  
  const fixedCount = fixImageUrls(issues);
  
  console.log(`\n🎉 Fixed ${fixedCount} broken image URLs!`);
  console.log('📝 All images should now load properly');
}

main();
