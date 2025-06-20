const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    env: {
      // Test environment variables
      TEST_USER_EMAIL: 'test@geargrab.co',
      TEST_USER_PASSWORD: 'TestPassword123!',
      INVALID_EMAIL: 'invalid@example.com',
      INVALID_PASSWORD: 'wrongpassword',
      API_BASE_URL: 'http://localhost:5173/api'
    },

    setupNodeEvents(on, config) {
      // Disable TypeScript processing
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.js', '.json']
          },
          module: {
            rules: [
              {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env']
                  }
                }
              }
            ]
          }
        }
      }));

      // Node event listeners
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        // Clear test data
        clearTestData() {
          // Implementation would clear test user data
          return null;
        },

        // Create test user
        createTestUser(userData) {
          // Implementation would create a test user
          return userData;
        }
      });

      // Use isolated TypeScript config
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    configFile: 'cypress/tsconfig.json'
                  }
                }
              }
            ]
          }
        }
      }));
      
      // Use isolated TypeScript config
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    configFile: 'cypress/tsconfig.json'
                  }
                }
              }
            ]
          }
        }
      }));
      
      // Use isolated TypeScript config
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    configFile: 'cypress/tsconfig.json'
                  }
                }
              }
            ]
          }
        }
      }));
      
      // Use isolated TypeScript config
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    configFile: 'cypress/tsconfig.json'
                  }
                }
              }
            ]
          }
        }
      }));
      
      // Use isolated TypeScript config
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                  loader: 'ts-loader',
                  options: {
                    configFile: 'cypress/tsconfig.json'
                  }
                }
              }
            ]
          }
        }
      }));
      
      return config;
    },
  },

  component: {
    devServer: {
      framework: 'svelte',
      bundler: 'vite',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  }
});
