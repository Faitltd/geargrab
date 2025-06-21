#!/usr/bin/env node

/**
 * Build Issues Fixer
 * 
 * This script fixes common build issues including:
 * - Git merge conflicts
 * - Accessibility issues
 * - Syntax errors
 * - Missing dependencies
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

/**
 * Find and fix Git merge conflicts
 */
function fixMergeConflicts() {
  logHeader('Fixing Git Merge Conflicts');
  
  const conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];
  let fixedFiles = 0;
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.svelte')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          if (conflictMarkers.some(marker => content.includes(marker))) {
            logWarning(`Found merge conflict in: ${path.relative(projectRoot, fullPath)}`);
            
            // Try to auto-resolve simple conflicts
            let fixedContent = content;
            
            // Remove conflict markers and keep both versions merged
            fixedContent = fixedContent.replace(/<<<<<<< HEAD\n/g, '');
            fixedContent = fixedContent.replace(/=======\n/g, '');
            fixedContent = fixedContent.replace(/>>>>>>> [^\n]+\n/g, '');
            
            if (fixedContent !== content) {
              fs.writeFileSync(fullPath, fixedContent);
              logSuccess(`Fixed merge conflict in: ${path.relative(projectRoot, fullPath)}`);
              fixedFiles++;
            }
          }
        } catch (error) {
          logError(`Error processing ${fullPath}: ${error.message}`);
        }
      }
    }
  }
  
  scanDirectory(path.join(projectRoot, 'src'));
  
  if (fixedFiles === 0) {
    logInfo('No merge conflicts found');
  } else {
    logSuccess(`Fixed ${fixedFiles} merge conflicts`);
  }
  
  return fixedFiles;
}

/**
 * Fix accessibility issues
 */
function fixAccessibilityIssues() {
  logHeader('Fixing Accessibility Issues');
  
  try {
    execSync('node scripts/fix-accessibility.js fix', { 
      stdio: 'inherit', 
      cwd: projectRoot 
    });
    logSuccess('Accessibility issues fixed');
    return true;
  } catch (error) {
    logError(`Failed to fix accessibility issues: ${error.message}`);
    return false;
  }
}

/**
 * Fix common syntax errors
 */
function fixSyntaxErrors() {
  logHeader('Fixing Common Syntax Errors');
  
  let fixedFiles = 0;
  
  // Fix common issues in Svelte files
  const svelteFiles = [];
  
  function findSvelteFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findSvelteFiles(fullPath);
      } else if (item.endsWith('.svelte')) {
        svelteFiles.push(fullPath);
      }
    }
  }
  
  findSvelteFiles(path.join(projectRoot, 'src'));
  
  for (const file of svelteFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Fix common syntax issues
      
      // Fix duplicate labels
      content = content.replace(/<<label/g, '<label');
      content = content.replace(/label>>/g, 'label>');
      
      // Fix broken tags
      content = content.replace(/<([^>]*?)>([^<]*?)<([^>]*?)>/g, (match, tag1, text, tag2) => {
        if (tag1.includes('label') && tag2.includes('label')) {
          return `<${tag1}>${text}</${tag2.replace(/^\//, '')}>`;
        }
        return match;
      });
      
      // Fix malformed attributes
      content = content.replace(/(\w+)=([^"\s>]+)(?=\s|>)/g, '$1="$2"');
      
      // Fix unclosed tags
      content = content.replace(/<(input|img|br|hr)([^>]*?)(?<!\/)\s*>/g, '<$1$2 />');
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        logSuccess(`Fixed syntax in: ${path.relative(projectRoot, file)}`);
        fixedFiles++;
      }
      
    } catch (error) {
      logError(`Error fixing ${file}: ${error.message}`);
    }
  }
  
  if (fixedFiles === 0) {
    logInfo('No syntax errors found');
  } else {
    logSuccess(`Fixed syntax errors in ${fixedFiles} files`);
  }
  
  return fixedFiles;
}

/**
 * Validate package.json
 */
function validatePackageJson() {
  logHeader('Validating package.json');
  
  try {
    execSync('node scripts/fix-package-json.js', { 
      stdio: 'inherit', 
      cwd: projectRoot 
    });
    logSuccess('package.json validated');
    return true;
  } catch (error) {
    logError(`Failed to validate package.json: ${error.message}`);
    return false;
  }
}

/**
 * Test build
 */
function testBuild() {
  logHeader('Testing Build');
  
  try {
    execSync('npm run build', { 
      stdio: 'pipe', 
      cwd: projectRoot 
    });
    logSuccess('Build completed successfully');
    return true;
  } catch (error) {
    logError('Build failed');
    
    // Extract useful error information
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
    const lines = errorOutput.split('\n');
    
    for (const line of lines) {
      if (line.includes('error') || line.includes('Error') || line.includes('ParseError')) {
        logError(`  ${line.trim()}`);
      }
    }
    
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  logHeader('Build Issues Fixer');
  
  try {
    switch (command) {
      case 'conflicts':
        fixMergeConflicts();
        break;
        
      case 'accessibility':
        fixAccessibilityIssues();
        break;
        
      case 'syntax':
        fixSyntaxErrors();
        break;
        
      case 'package':
        validatePackageJson();
        break;
        
      case 'test':
        testBuild();
        break;
        
      case 'all':
        logInfo('Running comprehensive build fixes...');
        
        // Step 1: Fix merge conflicts
        fixMergeConflicts();
        
        // Step 2: Validate package.json
        validatePackageJson();
        
        // Step 3: Fix syntax errors
        fixSyntaxErrors();
        
        // Step 4: Fix accessibility issues
        fixAccessibilityIssues();
        
        // Step 5: Test build
        const buildSuccess = testBuild();
        
        if (buildSuccess) {
          logSuccess('All build issues have been resolved!');
          logInfo('Next steps:');
          logInfo('1. Run: npm run dev');
          logInfo('2. Test the application');
          logInfo('3. Run: npm run docs:api');
        } else {
          logWarning('Build still has issues. Check the error messages above.');
        }
        break;
        
      case 'help':
      default:
        logHeader('Available Commands');
        log('  conflicts      - Fix Git merge conflicts', 'cyan');
        log('  accessibility  - Fix accessibility issues', 'cyan');
        log('  syntax         - Fix common syntax errors', 'cyan');
        log('  package        - Validate package.json', 'cyan');
        log('  test           - Test build', 'cyan');
        log('  all            - Run all fixes (default)', 'cyan');
        log('  help           - Show this help message', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node scripts/fix-build-issues.js all', 'blue');
        log('  node scripts/fix-build-issues.js test', 'blue');
        break;
    }
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
