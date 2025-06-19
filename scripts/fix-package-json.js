#!/usr/bin/env node

/**
 * Package.json Validator and Fixer
 * 
 * This script validates and fixes common issues in package.json files
 * that can cause npm install failures.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function validatePackageJson() {
  const packagePath = path.join(projectRoot, 'package.json');
  
  try {
    // Read and parse package.json
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    console.log('✅ package.json is valid JSON');
    
    // Check for duplicate keys in scripts
    const scripts = packageJson.scripts || {};
    const scriptKeys = Object.keys(scripts);
    const duplicateKeys = scriptKeys.filter((key, index) => scriptKeys.indexOf(key) !== index);
    
    if (duplicateKeys.length > 0) {
      console.log('❌ Found duplicate script keys:', duplicateKeys);
      return false;
    }
    
    console.log('✅ No duplicate script keys found');
    
    // Validate version numbers
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const invalidVersions = [];
    
    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version !== 'string' || version.trim() === '') {
        invalidVersions.push({ name, version });
      }
    }
    
    if (invalidVersions.length > 0) {
      console.log('❌ Found invalid versions:', invalidVersions);
      return false;
    }
    
    console.log('✅ All dependency versions are valid');
    
    // Check required fields
    const requiredFields = ['name', 'version', 'scripts'];
    const missingFields = requiredFields.filter(field => !packageJson[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return false;
    }
    
    console.log('✅ All required fields present');
    console.log(`📦 Package: ${packageJson.name} v${packageJson.version}`);
    console.log(`📜 Scripts: ${Object.keys(scripts).length}`);
    console.log(`📚 Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
    console.log(`🔧 Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ package.json validation failed:', error.message);
    return false;
  }
}

function fixCommonIssues() {
  const packagePath = path.join(projectRoot, 'package.json');
  
  try {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    let packageJson = JSON.parse(packageContent);
    let hasChanges = false;
    
    // Fix common version issues
    const versionFixes = {
      'bcrypt': '^5.1.1',
      'express': '^4.21.1',
      'firebase': '^10.14.1',
      'firebase-admin': '^12.6.0',
      'jsonwebtoken': '^9.0.2'
    };
    
    for (const [pkg, correctVersion] of Object.entries(versionFixes)) {
      if (packageJson.dependencies?.[pkg] && packageJson.dependencies[pkg] !== correctVersion) {
        console.log(`🔧 Fixing ${pkg}: ${packageJson.dependencies[pkg]} → ${correctVersion}`);
        packageJson.dependencies[pkg] = correctVersion;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      // Write back the fixed package.json
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ package.json has been fixed');
    } else {
      console.log('✅ No fixes needed');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Failed to fix package.json:', error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Validating package.json...\n');
  
  const isValid = validatePackageJson();
  
  if (!isValid) {
    console.log('\n🔧 Attempting to fix common issues...\n');
    fixCommonIssues();
    
    console.log('\n🔍 Re-validating package.json...\n');
    validatePackageJson();
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. If issues persist, try: npm cache clean --force');
  console.log('3. Then try: npm install again');
}

main();
