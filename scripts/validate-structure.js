#!/usr/bin/env node

/**
 * SvelteKit Project Structure Validator
 * Validates that the project follows SvelteKit best practices
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

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  log(`${exists ? '✅' : '❌'} ${description}: ${dirPath}`, exists ? 'green' : 'red');
  return exists;
}

function checkNoDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  log(`${!exists ? '✅' : '❌'} ${description}: ${dirPath} should not exist`, !exists ? 'green' : 'red');
  return !exists;
}

function validateSvelteKitStructure() {
  log('\n🔍 Validating SvelteKit Project Structure\n', 'bold');

  let score = 0;
  let total = 0;

  // Core SvelteKit files
  log('📁 Core SvelteKit Files:', 'blue');
  total += 4;
  score += checkFile('src/app.html', 'Main HTML template') ? 1 : 0;
  score += checkFile('src/app.d.ts', 'TypeScript declarations') ? 1 : 0;
  score += checkFile('src/hooks.server.ts', 'Server hooks') ? 1 : 0;
  score += checkFile('src/ambient.d.ts', 'Global type declarations') ? 1 : 0;

  // Configuration files
  log('\n⚙️ Configuration Files:', 'blue');
  total += 5;
  score += checkFile('svelte.config.js', 'SvelteKit configuration') ? 1 : 0;
  score += checkFile('vite.config.js', 'Vite configuration') ? 1 : 0;
  score += checkFile('tsconfig.json', 'TypeScript configuration') ? 1 : 0;
  score += checkFile('package.json', 'Package configuration') ? 1 : 0;
  score += checkFile('tailwind.config.js', 'Tailwind configuration') ? 1 : 0;

  // Directory structure
  log('\n📂 Directory Structure:', 'blue');
  total += 8;
  score += checkDirectory('src/lib', 'Library directory') ? 1 : 0;
  score += checkDirectory('src/lib/components', 'Components directory') ? 1 : 0;
  score += checkDirectory('src/lib/stores', 'Stores directory') ? 1 : 0;
  score += checkDirectory('src/lib/utils', 'Utils directory') ? 1 : 0;
  score += checkDirectory('src/lib/types', 'Types directory') ? 1 : 0;
  score += checkDirectory('src/lib/services', 'Services directory') ? 1 : 0;
  score += checkDirectory('src/routes', 'Routes directory') ? 1 : 0;
  score += checkDirectory('static', 'Static assets directory') ? 1 : 0;

  // Routes structure
  log('\n🛣️ Routes Structure:', 'blue');
  total += 4;
  score += checkFile('src/routes/+layout.svelte', 'Root layout') ? 1 : 0;
  score += checkFile('src/routes/+page.svelte', 'Homepage') ? 1 : 0;
  score += checkDirectory('src/routes/api', 'API routes directory') ? 1 : 0;
  score += checkDirectory('src/routes/browse', 'Browse routes directory') ? 1 : 0;

  // PWA files
  log('\n📱 PWA Support:', 'blue');
  total += 3;
  score += checkFile('static/manifest.json', 'PWA manifest') ? 1 : 0;
  score += checkFile('static/offline.html', 'Offline page') ? 1 : 0;
  score += checkFile('src/service-worker.ts', 'Service worker') ? 1 : 0;

  // Clean structure (no duplicates)
  log('\n🧹 Clean Structure:', 'blue');
  total += 2;
  score += checkNoDirectory('src/types', 'No duplicate types directory') ? 1 : 0;
  score += checkNoDirectory('src/utils', 'No duplicate utils directory') ? 1 : 0;

  // Component organization
  log('\n🧩 Component Organization:', 'blue');
  const componentDirs = [
    'src/lib/components/auth',
    'src/lib/components/booking',
    'src/lib/components/cards',
    'src/lib/components/forms',
    'src/lib/components/layout',
    'src/lib/components/ui'
  ];
  
  componentDirs.forEach(dir => {
    total += 1;
    score += checkDirectory(dir, `Component category: ${path.basename(dir)}`) ? 1 : 0;
  });

  // Check for test routes in main structure
  log('\n🧪 Test Route Cleanup:', 'blue');
  const testRoutes = [
    'src/routes/test-basic',
    'src/routes/test-payment',
    'src/routes/debug-auth',
    'src/routes/animation-test'
  ];

  testRoutes.forEach(route => {
    total += 1;
    score += checkNoDirectory(route, `No test route: ${path.basename(route)}`) ? 1 : 0;
  });

  // Check gitignore
  log('\n🙈 Git Configuration:', 'blue');
  total += 1;
  if (checkFile('.gitignore', 'Git ignore file')) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    const requiredEntries = ['.svelte-kit/', 'build/', 'node_modules/', '.env'];
    const hasAllEntries = requiredEntries.every(entry => gitignoreContent.includes(entry));
    log(`${hasAllEntries ? '✅' : '❌'} Gitignore has required entries`, hasAllEntries ? 'green' : 'red');
    score += hasAllEntries ? 1 : 0;
  }

  // Final score
  log('\n📊 Structure Validation Results:', 'bold');
  const percentage = Math.round((score / total) * 100);
  const grade = percentage >= 95 ? 'A+' : percentage >= 90 ? 'A' : percentage >= 85 ? 'B+' : percentage >= 80 ? 'B' : percentage >= 75 ? 'C+' : percentage >= 70 ? 'C' : 'D';
  
  log(`Score: ${score}/${total} (${percentage}%)`, percentage >= 90 ? 'green' : percentage >= 80 ? 'yellow' : 'red');
  log(`Grade: ${grade}`, percentage >= 90 ? 'green' : percentage >= 80 ? 'yellow' : 'red');

  if (percentage >= 95) {
    log('\n🎉 Excellent! Your project structure follows SvelteKit best practices perfectly!', 'green');
  } else if (percentage >= 90) {
    log('\n👍 Great! Your project structure is very well organized.', 'green');
  } else if (percentage >= 80) {
    log('\n👌 Good structure, but there are some areas for improvement.', 'yellow');
  } else {
    log('\n⚠️ Your project structure needs some improvements to follow SvelteKit best practices.', 'red');
  }

  // Recommendations
  if (percentage < 100) {
    log('\n💡 Recommendations:', 'blue');
    
    if (!fs.existsSync('src/ambient.d.ts')) {
      log('• Add src/ambient.d.ts for global type declarations', 'yellow');
    }
    
    if (!fs.existsSync('static/manifest.json')) {
      log('• Add PWA manifest for better mobile experience', 'yellow');
    }
    
    if (fs.existsSync('src/types') || fs.existsSync('src/utils')) {
      log('• Remove duplicate directories (src/types, src/utils)', 'yellow');
    }

    const testRoutesExist = testRoutes.some(route => fs.existsSync(route));
    if (testRoutesExist) {
      log('• Move test routes to dev-routes/ directory', 'yellow');
    }
  }

  return { score, total, percentage, grade };
}

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = validateSvelteKitStructure();
    process.exit(result.percentage >= 80 ? 0 : 1);
  } catch (error) {
    log(`\n❌ Error validating structure: ${error.message}`, 'red');
    process.exit(1);
  }
}

export { validateSvelteKitStructure };
