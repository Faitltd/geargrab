#!/usr/bin/env node

/**
 * Tailwind CSS Configuration Fixer
 * 
 * This script fixes common Tailwind CSS configuration issues including
 * missing plugins, incorrect dependencies, and configuration errors.
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
 * Check if Tailwind CSS dependencies are installed
 */
function checkTailwindDependencies() {
  logHeader('Checking Tailwind CSS Dependencies');
  
  const packagePath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    logError('package.json not found');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = {
      'tailwindcss': '^3.3.2',
      '@tailwindcss/forms': '^0.5.10',
      '@tailwindcss/typography': '^0.5.16',
      'autoprefixer': '^10.4.14',
      'postcss': '^8.4.24'
    };

    const missingDeps = [];
    const outdatedDeps = [];

    for (const [dep, expectedVersion] of Object.entries(requiredDeps)) {
      if (!allDeps[dep]) {
        missingDeps.push({ name: dep, version: expectedVersion });
      } else {
        logSuccess(`${dep} is installed: ${allDeps[dep]}`);
      }
    }

    if (missingDeps.length > 0) {
      logWarning('Missing dependencies:');
      missingDeps.forEach(dep => {
        logError(`  - ${dep.name}: ${dep.version}`);
      });
      return { valid: false, missingDeps, outdatedDeps };
    }

    logSuccess('All Tailwind CSS dependencies are installed');
    return { valid: true, missingDeps: [], outdatedDeps: [] };

  } catch (error) {
    logError(`Failed to check dependencies: ${error.message}`);
    return false;
  }
}

/**
 * Install missing Tailwind CSS dependencies
 */
function installMissingDependencies(missingDeps) {
  logHeader('Installing Missing Dependencies');
  
  if (missingDeps.length === 0) {
    logInfo('No dependencies to install');
    return true;
  }

  try {
    const depsToInstall = missingDeps.map(dep => `${dep.name}@${dep.version}`);
    const command = `npm install --save-dev ${depsToInstall.join(' ')}`;
    
    logInfo(`Running: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: projectRoot });
    
    logSuccess('Dependencies installed successfully');
    return true;
    
  } catch (error) {
    logError(`Failed to install dependencies: ${error.message}`);
    return false;
  }
}

/**
 * Validate Tailwind configuration file
 */
function validateTailwindConfig() {
  logHeader('Validating Tailwind Configuration');
  
  const configPath = path.join(projectRoot, 'tailwind.config.js');
  
  if (!fs.existsSync(configPath)) {
    logError('tailwind.config.js not found');
    return false;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for required plugins
    const requiredPlugins = ['@tailwindcss/forms', '@tailwindcss/typography'];
    const missingPlugins = [];
    
    for (const plugin of requiredPlugins) {
      if (!configContent.includes(plugin)) {
        missingPlugins.push(plugin);
      } else {
        logSuccess(`Plugin found: ${plugin}`);
      }
    }
    
    if (missingPlugins.length > 0) {
      logWarning('Missing plugins in config:');
      missingPlugins.forEach(plugin => {
        logError(`  - ${plugin}`);
      });
    }
    
    // Check content paths
    if (configContent.includes("'./src/**/*.{html,js,svelte,ts}'")) {
      logSuccess('Content paths are configured correctly');
    } else {
      logWarning('Content paths might need adjustment');
    }
    
    logSuccess('Tailwind configuration is valid');
    return true;
    
  } catch (error) {
    logError(`Failed to validate config: ${error.message}`);
    return false;
  }
}

/**
 * Check PostCSS configuration
 */
function checkPostCSSConfig() {
  logHeader('Checking PostCSS Configuration');
  
  const configPath = path.join(projectRoot, 'postcss.config.js');
  
  if (!fs.existsSync(configPath)) {
    logWarning('postcss.config.js not found, creating one...');
    createPostCSSConfig();
    return true;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    if (configContent.includes('tailwindcss') && configContent.includes('autoprefixer')) {
      logSuccess('PostCSS configuration is correct');
      return true;
    } else {
      logWarning('PostCSS configuration needs updating');
      createPostCSSConfig();
      return true;
    }
    
  } catch (error) {
    logError(`Failed to check PostCSS config: ${error.message}`);
    return false;
  }
}

/**
 * Create PostCSS configuration file
 */
function createPostCSSConfig() {
  const configContent = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  const configPath = path.join(projectRoot, 'postcss.config.js');
  
  try {
    fs.writeFileSync(configPath, configContent);
    logSuccess('Created postcss.config.js');
  } catch (error) {
    logError(`Failed to create PostCSS config: ${error.message}`);
  }
}

/**
 * Test Tailwind CSS compilation
 */
function testTailwindCompilation() {
  logHeader('Testing Tailwind CSS Compilation');
  
  try {
    // Try to run Tailwind CLI to test configuration
    execSync('npx tailwindcss --help', { stdio: 'pipe', cwd: projectRoot });
    logSuccess('Tailwind CSS CLI is working');
    
    // Test if we can build CSS
    const testCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

.test-class {
  @apply bg-blue-500 text-white p-4;
}`;

    const testInputPath = path.join(projectRoot, 'test-tailwind.css');
    const testOutputPath = path.join(projectRoot, 'test-tailwind-output.css');
    
    fs.writeFileSync(testInputPath, testCSS);
    
    execSync(`npx tailwindcss -i ${testInputPath} -o ${testOutputPath}`, {
      stdio: 'pipe',
      cwd: projectRoot
    });
    
    if (fs.existsSync(testOutputPath)) {
      logSuccess('Tailwind CSS compilation test passed');
      
      // Clean up test files
      fs.unlinkSync(testInputPath);
      fs.unlinkSync(testOutputPath);
      
      return true;
    } else {
      logError('Tailwind CSS compilation test failed');
      return false;
    }
    
  } catch (error) {
    logError(`Tailwind compilation test failed: ${error.message}`);
    
    // Clean up test files if they exist
    const testInputPath = path.join(projectRoot, 'test-tailwind.css');
    const testOutputPath = path.join(projectRoot, 'test-tailwind-output.css');
    
    if (fs.existsSync(testInputPath)) fs.unlinkSync(testInputPath);
    if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);
    
    return false;
  }
}

/**
 * Generate Tailwind CSS documentation
 */
function generateTailwindDocs() {
  logHeader('Generating Tailwind CSS Documentation');
  
  const docsContent = `# Tailwind CSS Configuration

## Overview
This project uses Tailwind CSS with the following plugins:
- \`@tailwindcss/forms\` - Better form styling
- \`@tailwindcss/typography\` - Typography utilities

## Custom Configuration

### Colors
- **Primary**: Green-600 (#16a34a)
- **Green palette**: Extended green color scale
- **Teal palette**: Extended teal color scale

### Shadows
- **Top shadow**: \`shadow-t\` for top-facing shadows

## Usage Examples

### Forms
\`\`\`html
<input class="form-input rounded-md border-gray-300" type="text" />
<select class="form-select rounded-md border-gray-300">
  <option>Option 1</option>
</select>
\`\`\`

### Typography
\`\`\`html
<article class="prose prose-lg">
  <h1>Article Title</h1>
  <p>Article content...</p>
</article>
\`\`\`

### Custom Colors
\`\`\`html
<div class="bg-primary text-white">Primary background</div>
<div class="bg-green-500 text-white">Green background</div>
<div class="bg-teal-400 text-white">Teal background</div>
\`\`\`

## Build Process
Tailwind CSS is processed through PostCSS with autoprefixer for vendor prefixes.

## Troubleshooting
If you encounter issues:
1. Run \`node scripts/fix-tailwind.js\`
2. Check that all plugins are installed
3. Verify PostCSS configuration
4. Test compilation with \`npm run build\`
`;

  const docsPath = path.join(projectRoot, 'docs', 'TAILWIND.md');
  const docsDir = path.dirname(docsPath);
  
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(docsPath, docsContent);
    logSuccess('Generated Tailwind CSS documentation: docs/TAILWIND.md');
  } catch (error) {
    logError(`Failed to generate documentation: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'fix';
  
  logHeader('Tailwind CSS Configuration Fixer');
  
  try {
    switch (command) {
      case 'check':
        const checkResult = checkTailwindDependencies();
        if (checkResult && !checkResult.valid) {
          process.exit(1);
        }
        validateTailwindConfig();
        checkPostCSSConfig();
        break;
        
      case 'install':
        const installResult = checkTailwindDependencies();
        if (installResult && !installResult.valid) {
          installMissingDependencies(installResult.missingDeps);
        }
        break;
        
      case 'test':
        testTailwindCompilation();
        break;
        
      case 'docs':
        generateTailwindDocs();
        break;
        
      case 'fix':
      default:
        // Run all fixes
        const result = checkTailwindDependencies();
        if (result && !result.valid) {
          installMissingDependencies(result.missingDeps);
        }
        
        validateTailwindConfig();
        checkPostCSSConfig();
        testTailwindCompilation();
        generateTailwindDocs();
        
        logSuccess('Tailwind CSS configuration has been fixed!');
        logInfo('Next steps:');
        logInfo('1. Run: npm run build');
        logInfo('2. Run: npm run dev');
        logInfo('3. Check that styles are loading correctly');
        break;
        
      case 'help':
        logHeader('Available Commands');
        log('  check    - Check Tailwind configuration', 'cyan');
        log('  install  - Install missing dependencies', 'cyan');
        log('  test     - Test Tailwind compilation', 'cyan');
        log('  docs     - Generate documentation', 'cyan');
        log('  fix      - Run all fixes (default)', 'cyan');
        log('  help     - Show this help message', 'cyan');
        break;
    }
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
