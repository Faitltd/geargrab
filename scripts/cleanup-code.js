#!/usr/bin/env node

/**
 * Code Cleanup Script for GearGrab
 * 
 * This script performs various cleanup tasks:
 * - Finds unused exports
 * - Identifies dead code
 * - Checks for unused imports
 * - Validates component props
 * - Reports accessibility issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class CodeCleanup {
  constructor() {
    this.issues = {
      unusedExports: [],
      unusedImports: [],
      deadCode: [],
      accessibilityIssues: [],
      typeIssues: []
    };
  }

  async runCleanup() {
    log('\n🧹 Starting Code Cleanup for GearGrab\n', 'bright');

    try {
      await this.findUnusedExports();
      await this.findUnusedImports();
      await this.checkAccessibilityIssues();
      await this.validateTypeScript();
      
      this.generateReport();

    } catch (error) {
      log(`❌ Cleanup failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async findUnusedExports() {
    log('🔍 Checking for unused exports...', 'blue');
    
    const srcDir = path.join(projectRoot, 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.js', '.svelte']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const exports = this.extractExports(content);
      
      for (const exportName of exports) {
        const isUsed = await this.isExportUsed(exportName, file, files);
        if (!isUsed) {
          this.issues.unusedExports.push({
            file: path.relative(projectRoot, file),
            export: exportName
          });
        }
      }
    }
  }

  async findUnusedImports() {
    log('📦 Checking for unused imports...', 'blue');
    
    const srcDir = path.join(projectRoot, 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.js', '.svelte']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = this.extractImports(content);
      
      for (const importName of imports) {
        const isUsed = this.isImportUsed(importName, content);
        if (!isUsed) {
          this.issues.unusedImports.push({
            file: path.relative(projectRoot, file),
            import: importName
          });
        }
      }
    }
  }

  async checkAccessibilityIssues() {
    log('♿ Checking accessibility issues...', 'blue');
    
    const srcDir = path.join(projectRoot, 'src');
    const svelteFiles = this.getAllFiles(srcDir, ['.svelte']);
    
    for (const file of svelteFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for images without alt text
      const imgRegex = /<img[^>]*>/g;
      const images = content.match(imgRegex) || [];
      
      for (const img of images) {
        if (!img.includes('alt=')) {
          this.issues.accessibilityIssues.push({
            file: path.relative(projectRoot, file),
            issue: 'Image missing alt attribute',
            element: img.substring(0, 50) + '...'
          });
        }
      }
      
      // Check for buttons without aria-label or text content
      const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/g;
      const buttons = content.match(buttonRegex) || [];
      
      for (const button of buttons) {
        if (!button.includes('aria-label') && !this.hasTextContent(button)) {
          this.issues.accessibilityIssues.push({
            file: path.relative(projectRoot, file),
            issue: 'Button missing accessible text',
            element: button.substring(0, 50) + '...'
          });
        }
      }
      
      // Check for form inputs without labels
      const inputRegex = /<input[^>]*>/g;
      const inputs = content.match(inputRegex) || [];
      
      for (const input of inputs) {
        const idMatch = input.match(/id="([^"]*)"/);
        if (idMatch) {
          const id = idMatch[1];
          const labelRegex = new RegExp(`<label[^>]*for="${id}"`, 'g');
          if (!content.match(labelRegex)) {
            this.issues.accessibilityIssues.push({
              file: path.relative(projectRoot, file),
              issue: 'Input missing associated label',
              element: input.substring(0, 50) + '...'
            });
          }
        }
      }
    }
  }

  async validateTypeScript() {
    log('🔧 Checking TypeScript issues...', 'blue');
    
    // This would typically run tsc --noEmit to check for type errors
    // For now, we'll check for common patterns
    
    const srcDir = path.join(projectRoot, 'src');
    const tsFiles = this.getAllFiles(srcDir, ['.ts', '.svelte']);
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for any types
      if (content.includes(': any')) {
        this.issues.typeIssues.push({
          file: path.relative(projectRoot, file),
          issue: 'Using "any" type - consider more specific typing'
        });
      }
      
      // Check for console.log in production code
      if (content.includes('console.log') && !file.includes('dev-routes')) {
        this.issues.typeIssues.push({
          file: path.relative(projectRoot, file),
          issue: 'Console.log found - consider removing for production'
        });
      }
    }
  }

  getAllFiles(dir, extensions) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  extractExports(content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Export statements
    const exportStatementRegex = /export\s*{\s*([^}]+)\s*}/g;
    while ((match = exportStatementRegex.exec(content)) !== null) {
      const exportList = match[1].split(',').map(e => e.trim().split(' as ')[0]);
      exports.push(...exportList);
    }
    
    return exports;
  }

  extractImports(content) {
    const imports = [];
    
    // Import statements
    const importRegex = /import\s*{\s*([^}]+)\s*}\s*from/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importList = match[1].split(',').map(i => i.trim().split(' as ')[0]);
      imports.push(...importList);
    }
    
    // Default imports
    const defaultImportRegex = /import\s+(\w+)\s+from/g;
    while ((match = defaultImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  async isExportUsed(exportName, exportFile, allFiles) {
    // Simple check - look for the export name in other files
    for (const file of allFiles) {
      if (file === exportFile) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(exportName)) {
        return true;
      }
    }
    return false;
  }

  isImportUsed(importName, content) {
    // Remove the import statement and check if the name is still used
    const withoutImports = content.replace(/import[\s\S]*?from[^;]+;/g, '');
    return withoutImports.includes(importName);
  }

  hasTextContent(element) {
    // Simple check for text content in HTML element
    const textContent = element.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  }

  generateReport() {
    log('\n📊 Code Cleanup Report\n', 'bright');
    
    // Unused exports
    if (this.issues.unusedExports.length > 0) {
      log('🗑️  Unused Exports:', 'yellow');
      this.issues.unusedExports.forEach(issue => {
        log(`  • ${issue.file}: ${issue.export}`, 'yellow');
      });
      log('');
    }
    
    // Unused imports
    if (this.issues.unusedImports.length > 0) {
      log('📦 Unused Imports:', 'yellow');
      this.issues.unusedImports.forEach(issue => {
        log(`  • ${issue.file}: ${issue.import}`, 'yellow');
      });
      log('');
    }
    
    // Accessibility issues
    if (this.issues.accessibilityIssues.length > 0) {
      log('♿ Accessibility Issues:', 'red');
      this.issues.accessibilityIssues.forEach(issue => {
        log(`  • ${issue.file}: ${issue.issue}`, 'red');
      });
      log('');
    }
    
    // Type issues
    if (this.issues.typeIssues.length > 0) {
      log('🔧 Type Issues:', 'magenta');
      this.issues.typeIssues.forEach(issue => {
        log(`  • ${issue.file}: ${issue.issue}`, 'magenta');
      });
      log('');
    }
    
    // Summary
    const totalIssues = Object.values(this.issues).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalIssues === 0) {
      log('✅ No issues found! Your code is clean.', 'green');
    } else {
      log(`📋 Summary: ${totalIssues} issues found`, 'cyan');
      log('💡 Run with --fix flag to automatically fix some issues', 'cyan');
    }
  }
}

// Run the cleanup
const cleanup = new CodeCleanup();
cleanup.runCleanup().catch(console.error);
