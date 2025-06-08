#!/usr/bin/env node

/**
 * Script to find and fix listing validation issues
 */

import fs from 'fs';
import path from 'path';

function findListingFiles() {
  console.log('🔍 Finding listing-related files...');
  
  const filesToCheck = [
    'src/routes/list-gear/+page.svelte',
    'src/lib/services/listings.ts',
    'src/lib/data/products.ts'
  ];
  
  const foundFiles = [];
  
  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      foundFiles.push(file);
      console.log(`✅ Found: ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
    }
  }
  
  return foundFiles;
}

function checkForUndefinedFields(filePath) {
  console.log(`\n🔍 Checking ${filePath} for undefined field issues...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for deliveryOptions patterns
    const deliveryOptionsMatches = content.match(/deliveryOptions[.\s]*dropoffDistance/g);
    if (deliveryOptionsMatches) {
      console.log(`⚠️  Found deliveryOptions.dropoffDistance references:`);
      deliveryOptionsMatches.forEach(match => console.log(`   - ${match}`));
    }
    
    // Look for undefined assignments
    const undefinedMatches = content.match(/:\s*undefined/g);
    if (undefinedMatches) {
      console.log(`⚠️  Found undefined assignments:`);
      undefinedMatches.forEach(match => console.log(`   - ${match}`));
    }
    
    // Look for missing default values
    if (content.includes('dropoffDistance') && !content.includes('dropoffDistance:')) {
      console.log(`⚠️  dropoffDistance may need default value`);
    }
    
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔧 Fixing listing validation issues...\n');
  
  const files = findListingFiles();
  
  if (files.length === 0) {
    console.log('❌ No listing files found to check');
    return;
  }
  
  files.forEach(file => checkForUndefinedFields(file));
  
  console.log('\n💡 Next steps:');
  console.log('1. Check the files above for undefined field assignments');
  console.log('2. Add default values for optional fields');
  console.log('3. Ensure deliveryOptions has proper structure');
  console.log('4. Run: node scripts/fix-image-urls.js to fix image issues');
}

main();
