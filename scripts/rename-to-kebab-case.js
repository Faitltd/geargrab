#!/usr/bin/env node

/**
 * Rename files to kebab-case convention
 * Converts PascalCase and camelCase files to kebab-case
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Convert PascalCase/camelCase to kebab-case
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

// Find all files that need renaming
function findFilesToRename(directory, extensions = ['.svelte', '.ts', '.js']) {
  const filesToRename = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other system directories
        if (!item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        const basename = path.basename(item, ext);
        
        if (extensions.includes(ext)) {
          const kebabName = toKebabCase(basename);
          
          // Only rename if it's different and not already kebab-case
          if (kebabName !== basename && basename !== kebabName) {
            filesToRename.push({
              oldPath: fullPath,
              newPath: path.join(path.dirname(fullPath), kebabName + ext),
              oldName: item,
              newName: kebabName + ext
            });
          }
        }
      }
    }
  }
  
  scanDirectory(directory);
  return filesToRename;
}

// Update import statements in files
function updateImports(filePath, renamedFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const renamed of renamedFiles) {
      const oldBasename = path.basename(renamed.oldPath, path.extname(renamed.oldPath));
      const newBasename = path.basename(renamed.newPath, path.extname(renamed.newPath));
      
      // Update import statements
      const importRegex = new RegExp(`(import.*from\\s+['"\`][^'"\`]*/)${oldBasename}(['"\`])`, 'g');
      const newContent = content.replace(importRegex, `$1${newBasename}$2`);
      
      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      return true;
    }
  } catch (error) {
    log(`Error updating imports in ${filePath}: ${error.message}`, 'red');
  }
  
  return false;
}

// Main renaming function
function renameToKebabCase(directories = ['src/lib/components', 'src/lib/utils']) {
  log('\n🔄 Converting files to kebab-case naming convention\n', 'bold');
  
  let totalRenamed = 0;
  let totalImportsUpdated = 0;
  const allRenamedFiles = [];
  
  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      log(`❌ Directory not found: ${directory}`, 'red');
      continue;
    }
    
    log(`📁 Processing directory: ${directory}`, 'blue');
    
    const filesToRename = findFilesToRename(directory);
    
    if (filesToRename.length === 0) {
      log(`✅ No files need renaming in ${directory}`, 'green');
      continue;
    }
    
    log(`\n📋 Files to rename in ${directory}:`, 'yellow');
    filesToRename.forEach(file => {
      log(`  ${file.oldName} → ${file.newName}`, 'yellow');
    });
    
    // Rename files
    for (const file of filesToRename) {
      try {
        fs.renameSync(file.oldPath, file.newPath);
        log(`✅ Renamed: ${file.oldName} → ${file.newName}`, 'green');
        totalRenamed++;
        allRenamedFiles.push(file);
      } catch (error) {
        log(`❌ Failed to rename ${file.oldName}: ${error.message}`, 'red');
      }
    }
  }
  
  // Update import statements in all TypeScript and Svelte files
  if (allRenamedFiles.length > 0) {
    log('\n🔗 Updating import statements...', 'blue');
    
    const allFiles = [];
    
    // Find all files that might contain imports
    function findAllFiles(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            findAllFiles(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.svelte', '.ts', '.js'].includes(ext)) {
            allFiles.push(fullPath);
          }
        }
      }
    }
    
    findAllFiles('src');
    
    // Update imports in all files
    for (const filePath of allFiles) {
      if (updateImports(filePath, allRenamedFiles)) {
        totalImportsUpdated++;
        log(`✅ Updated imports in: ${path.relative(process.cwd(), filePath)}`, 'green');
      }
    }
  }
  
  // Summary
  log('\n📊 Renaming Summary:', 'bold');
  log(`Files renamed: ${totalRenamed}`, totalRenamed > 0 ? 'green' : 'yellow');
  log(`Import statements updated: ${totalImportsUpdated}`, totalImportsUpdated > 0 ? 'green' : 'yellow');
  
  if (totalRenamed > 0) {
    log('\n✅ Successfully converted files to kebab-case!', 'green');
    log('\n💡 Next steps:', 'blue');
    log('1. Test your application to ensure all imports work correctly', 'yellow');
    log('2. Update any documentation that references the old file names', 'yellow');
    log('3. Commit the changes to version control', 'yellow');
  } else {
    log('\n✅ All files already follow kebab-case naming convention!', 'green');
  }
  
  return { totalRenamed, totalImportsUpdated };
}

// Dry run function to preview changes
function previewChanges(directories = ['src/lib/components', 'src/lib/utils']) {
  log('\n👀 Preview: Files that would be renamed to kebab-case\n', 'bold');
  
  let totalFiles = 0;
  
  for (const directory of directories) {
    if (!fs.existsSync(directory)) {
      log(`❌ Directory not found: ${directory}`, 'red');
      continue;
    }
    
    const filesToRename = findFilesToRename(directory);
    
    if (filesToRename.length === 0) {
      log(`✅ ${directory}: No files need renaming`, 'green');
      continue;
    }
    
    log(`📁 ${directory}:`, 'blue');
    filesToRename.forEach(file => {
      log(`  ${file.oldName} → ${file.newName}`, 'yellow');
      totalFiles++;
    });
    log('');
  }
  
  log(`📊 Total files to rename: ${totalFiles}`, 'bold');
  
  if (totalFiles > 0) {
    log('\n💡 To apply these changes, run:', 'blue');
    log('node scripts/rename-to-kebab-case.js --apply', 'yellow');
  }
  
  return totalFiles;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const shouldApply = args.includes('--apply');
  const shouldPreview = args.includes('--preview') || !shouldApply;
  
  try {
    if (shouldPreview && !shouldApply) {
      previewChanges();
    } else if (shouldApply) {
      renameToKebabCase();
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

export { renameToKebabCase, previewChanges, toKebabCase };
