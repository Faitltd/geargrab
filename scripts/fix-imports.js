#!/usr/bin/env node

/**
 * Fix Import Statements Script
 * 
 * This script fixes PascalCase component imports to kebab-case
 * to match the actual file names in the project.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Mapping of PascalCase imports to kebab-case file names
const importMappings = {
  'VideoBackground': 'video-background',
  'ScrollLinkedAnimator': 'scroll-linked-animator',
  'ScrollLinkedSequential': 'scroll-linked-sequential',
  'AuthGuard': 'auth-guard',
  'HeroSearch': 'hero-search',
  'FilterBar': 'filter-bar',
  'GearGrid': 'gear-grid',
  'ScrollAnimated': 'scroll-animated',
  'ContactSection': 'contact-section',
  'UniverseCard': 'universe-card',
  'StripePaymentForm': 'stripe-payment-form',
  'HelpModal': 'help-modal',
  'ContactSupportModal': 'contact-support-modal',
  'ReportIssueModal': 'report-issue-modal',
  'CommunityGuidelinesModal': 'community-guidelines-modal',
  'FormContainer': 'form-container',
  'FormField': 'form-field',
  'FormButton': 'form-button',
  'SequentialAnimator': 'sequential-animator',
  'Checkbox': 'checkbox',
  'GoogleAuthButton': 'google-auth-button',
  'ErrorAlert': 'error-alert',
  'SkeletonCard': 'skeleton-card',
  'ProgressiveLoader': 'progressive-loader'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getAllFiles(dir, extensions = ['.svelte', '.ts', '.js']) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules' && item !== 'build' && item !== '.svelte-kit') {
            traverse(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix each import mapping
    for (const [pascalCase, kebabCase] of Object.entries(importMappings)) {
      // Pattern to match import statements with PascalCase component names
      const patterns = [
        // Standard imports: import Component from 'path/Component.svelte'
        new RegExp(`(import\\s+${pascalCase}\\s+from\\s+['"\`][^'"\`]*/)${pascalCase}(\\.svelte['"\`])`, 'g'),
        // Named imports: import { Component } from 'path/Component.svelte'
        new RegExp(`(import\\s*{[^}]*}\\s+from\\s+['"\`][^'"\`]*/)${pascalCase}(\\.svelte['"\`])`, 'g'),
        // Mixed imports: import Default, { Component } from 'path/Component.svelte'
        new RegExp(`(import\\s+[^,]+,\\s*{[^}]*}\\s+from\\s+['"\`][^'"\`]*/)${pascalCase}(\\.svelte['"\`])`, 'g')
      ];
      
      for (const pattern of patterns) {
        const newContent = content.replace(pattern, `$1${kebabCase}$2`);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'red');
  }
  
  return false;
}

function main() {
  log('\n🔧 Fixing import statements across the project\n', 'bright');
  
  const srcDir = path.join(projectRoot, 'src');
  const devRoutesDir = path.join(projectRoot, 'dev-routes');
  
  let totalFixed = 0;
  
  // Process src directory
  if (fs.existsSync(srcDir)) {
    log('📁 Processing src directory...', 'blue');
    const srcFiles = getAllFiles(srcDir);
    
    for (const file of srcFiles) {
      if (fixImportsInFile(file)) {
        const relativePath = path.relative(projectRoot, file);
        log(`✅ Fixed imports in: ${relativePath}`, 'green');
        totalFixed++;
      }
    }
  }
  
  // Process dev-routes directory
  if (fs.existsSync(devRoutesDir)) {
    log('\n📁 Processing dev-routes directory...', 'blue');
    const devFiles = getAllFiles(devRoutesDir);
    
    for (const file of devFiles) {
      if (fixImportsInFile(file)) {
        const relativePath = path.relative(projectRoot, file);
        log(`✅ Fixed imports in: ${relativePath}`, 'green');
        totalFixed++;
      }
    }
  }
  
  // Summary
  log(`\n📊 Summary:`, 'cyan');
  if (totalFixed === 0) {
    log('✅ No import fixes needed - all imports are already correct!', 'green');
  } else {
    log(`🔧 Fixed imports in ${totalFixed} files`, 'green');
    log('🎉 All import statements now use correct kebab-case file names', 'green');
  }
  
  log('\n💡 Tip: Restart your development server to see the changes', 'yellow');
}

main();
