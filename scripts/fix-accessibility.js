#!/usr/bin/env node

/**
 * Accessibility Fixer
 * 
 * This script fixes common accessibility issues in Svelte components,
 * particularly form labels that need to be associated with controls.
 */

import fs from 'fs';
import path from 'path';
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
 * Generate unique ID for form controls
 */
function generateId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fix accessibility issues in a Svelte file
 */
function fixAccessibilityInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Pattern to match labels without 'for' attribute followed by input/select/textarea
    const labelPattern = /<label\s+class="[^"]*"[^>]*>([^<]+)<\/label>\s*<(input|select|textarea)([^>]*)>/g;
    
    content = content.replace(labelPattern, (match, labelText, elementType, elementAttrs) => {
      // Generate ID from label text
      const id = generateId(labelText.trim());
      
      // Check if element already has an id
      if (elementAttrs.includes('id=')) {
        // Extract existing id
        const idMatch = elementAttrs.match(/id="([^"]+)"/);
        if (idMatch) {
          const existingId = idMatch[1];
          // Add 'for' attribute to label
          const newLabel = match.replace(
            /<label\s+class="([^"]*)"([^>]*)>/,
            `<label for="${existingId}" class="$1"$2>`
          );
          hasChanges = true;
          return newLabel;
        }
      } else {
        // Add id to element and for to label
        const newElement = `<${elementType} id="${id}"${elementAttrs}>`;
        const newLabel = match.replace(
          /<label\s+class="([^"]*)"([^>]*)>/,
          `<label for="${id}" class="$1"$2>`
        ).replace(/<(input|select|textarea)([^>]*)>/, newElement);
        hasChanges = true;
        return newLabel;
      }
      
      return match;
    });
    
    // Handle labels that are not immediately followed by inputs
    const standaloneLabels = /<label\s+class="[^"]*"[^>]*>([^<]+)<\/label>/g;
    const labelMatches = [...content.matchAll(standaloneLabels)];
    
    for (const match of labelMatches) {
      const labelText = match[1].trim();
      const id = generateId(labelText);
      
      // Check if this label doesn't have a 'for' attribute
      if (!match[0].includes('for=')) {
        // Look for the next input/select/textarea after this label
        const afterLabel = content.substring(match.index + match[0].length);
        const nextInputMatch = afterLabel.match(/<(input|select|textarea)([^>]*?)>/);
        
        if (nextInputMatch && nextInputMatch.index < 200) { // Within reasonable distance
          const elementAttrs = nextInputMatch[2];
          
          if (!elementAttrs.includes('id=')) {
            // Add id to the input and for to the label
            const newLabel = match[0].replace(
              /<label\s+class="([^"]*)"([^>]*)>/,
              `<label for="${id}" class="$1"$2>`
            );
            
            const inputStart = match.index + match[0].length + nextInputMatch.index;
            const inputEnd = inputStart + nextInputMatch[0].length;
            
            const newInput = nextInputMatch[0].replace(
              /<(input|select|textarea)([^>]*?)>/,
              `<$1 id="${id}"$2>`
            );
            
            content = content.substring(0, match.index) + 
                     newLabel + 
                     content.substring(match.index + match[0].length, inputStart) +
                     newInput +
                     content.substring(inputEnd);
            
            hasChanges = true;
          }
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
    
  } catch (error) {
    logError(`Failed to fix accessibility in ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Find all Svelte files with accessibility issues
 */
function findSvelteFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.svelte')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Check for accessibility issues in a file
 */
function checkAccessibilityIssues(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for labels without 'for' attributes
    const labelPattern = /<label\s+class="[^"]*"[^>]*>([^<]+)<\/label>/g;
    const labels = [...content.matchAll(labelPattern)];
    
    for (const label of labels) {
      if (!label[0].includes('for=')) {
        const lineNumber = content.substring(0, label.index).split('\n').length;
        issues.push({
          type: 'missing-for-attribute',
          line: lineNumber,
          text: label[1].trim(),
          element: label[0]
        });
      }
    }
    
    return issues;
    
  } catch (error) {
    logError(`Failed to check accessibility in ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'fix';
  
  logHeader('Accessibility Fixer');
  
  try {
    const srcDir = path.join(projectRoot, 'src');
    const svelteFiles = findSvelteFiles(srcDir);
    
    logInfo(`Found ${svelteFiles.length} Svelte files`);
    
    switch (command) {
      case 'check':
        logHeader('Checking Accessibility Issues');
        let totalIssues = 0;
        
        for (const file of svelteFiles) {
          const issues = checkAccessibilityIssues(file);
          if (issues.length > 0) {
            const relativePath = path.relative(projectRoot, file);
            logWarning(`${relativePath}: ${issues.length} issues`);
            
            for (const issue of issues) {
              logError(`  Line ${issue.line}: ${issue.text}`);
            }
            
            totalIssues += issues.length;
          }
        }
        
        if (totalIssues === 0) {
          logSuccess('No accessibility issues found');
        } else {
          logWarning(`Found ${totalIssues} accessibility issues`);
        }
        break;
        
      case 'fix':
        logHeader('Fixing Accessibility Issues');
        let fixedFiles = 0;
        
        for (const file of svelteFiles) {
          const relativePath = path.relative(projectRoot, file);
          const wasFixed = fixAccessibilityInFile(file);
          
          if (wasFixed) {
            logSuccess(`Fixed: ${relativePath}`);
            fixedFiles++;
          }
        }
        
        if (fixedFiles === 0) {
          logInfo('No files needed accessibility fixes');
        } else {
          logSuccess(`Fixed accessibility issues in ${fixedFiles} files`);
        }
        break;
        
      case 'help':
      default:
        logHeader('Available Commands');
        log('  check    - Check for accessibility issues', 'cyan');
        log('  fix      - Fix accessibility issues (default)', 'cyan');
        log('  help     - Show this help message', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node scripts/fix-accessibility.js check', 'blue');
        log('  node scripts/fix-accessibility.js fix', 'blue');
        break;
    }
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
