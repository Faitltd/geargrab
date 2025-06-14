import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        fetch: 'readonly'
      }
    },
    rules: {
      // General rules for JS files only
      'no-console': 'off', // Allow console in scripts
      'no-debugger': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'off' // Disable for JS files as they may use globals
    }
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'node_modules/',
      'cypress/',
      'static/',
      'dev-routes/',
      '*.cjs',
      'vite.config.js.timestamp-*',
      'scripts/',
      'firebase-security-rules.js',
      'verify-deployment.js',
      'tailwind.config.js',
      'svelte.config.js',
      'src/**/*.ts',
      'src/**/*.svelte'
    ]
  }
];
