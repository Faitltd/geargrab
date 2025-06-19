#!/usr/bin/env node

/**
 * API Documentation Generator
 * 
 * This script generates comprehensive API documentation from the OpenAPI 3.0 specification,
 * validates the spec, and creates interactive documentation with proper HTTP status codes,
 * request/response schemas, and error handling examples.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
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

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
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

/**
 * Validate OpenAPI specification
 */
function validateOpenAPISpec() {
  logHeader('Validating OpenAPI Specification');
  
  const specPath = path.join(projectRoot, 'docs', 'api', 'openapi.yaml');
  
  if (!fs.existsSync(specPath)) {
    logError('OpenAPI specification not found at docs/api/openapi.yaml');
    return false;
  }

  try {
    // Load and parse YAML
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(specContent);
    
    // Basic validation
    const requiredFields = ['openapi', 'info', 'paths'];
    const missingFields = requiredFields.filter(field => !spec[field]);
    
    if (missingFields.length > 0) {
      logError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate OpenAPI version
    if (!spec.openapi.startsWith('3.0')) {
      logError(`Unsupported OpenAPI version: ${spec.openapi}`);
      return false;
    }

    // Count endpoints and schemas
    const pathCount = Object.keys(spec.paths).length;
    const schemaCount = spec.components?.schemas ? Object.keys(spec.components.schemas).length : 0;
    const responseCount = spec.components?.responses ? Object.keys(spec.components.responses).length : 0;

    logSuccess(`OpenAPI specification is valid`);
    logInfo(`  - OpenAPI version: ${spec.openapi}`);
    logInfo(`  - API version: ${spec.info.version}`);
    logInfo(`  - Endpoints: ${pathCount}`);
    logInfo(`  - Schemas: ${schemaCount}`);
    logInfo(`  - Response templates: ${responseCount}`);

    return { valid: true, spec, stats: { pathCount, schemaCount, responseCount } };
  } catch (error) {
    logError(`Failed to validate OpenAPI spec: ${error.message}`);
    return false;
  }
}

/**
 * Generate endpoint summary
 */
function generateEndpointSummary(spec) {
  logHeader('Generating Endpoint Summary');
  
  const endpoints = [];
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
  
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of httpMethods) {
      if (pathItem[method]) {
        const operation = pathItem[method];
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: operation.summary || 'No summary',
          operationId: operation.operationId,
          tags: operation.tags || [],
          security: operation.security !== undefined ? operation.security : spec.security,
          responses: Object.keys(operation.responses || {})
        });
      }
    }
  }

  // Group by tags
  const endpointsByTag = {};
  endpoints.forEach(endpoint => {
    const tag = endpoint.tags[0] || 'Untagged';
    if (!endpointsByTag[tag]) {
      endpointsByTag[tag] = [];
    }
    endpointsByTag[tag].push(endpoint);
  });

  // Generate summary table
  let summary = '# API Endpoint Summary\n\n';
  
  for (const [tag, tagEndpoints] of Object.entries(endpointsByTag)) {
    summary += `## ${tag}\n\n`;
    summary += '| Method | Endpoint | Summary | Auth Required | Status Codes |\n';
    summary += '|--------|----------|---------|---------------|-------------|\n';
    
    tagEndpoints.forEach(endpoint => {
      const authRequired = endpoint.security && endpoint.security.length > 0 ? '✅' : '❌';
      const statusCodes = endpoint.responses.join(', ');
      summary += `| ${endpoint.method} | \`${endpoint.path}\` | ${endpoint.summary} | ${authRequired} | ${statusCodes} |\n`;
    });
    
    summary += '\n';
  }

  return summary;
}

/**
 * Generate schema documentation
 */
function generateSchemaDocumentation(spec) {
  logHeader('Generating Schema Documentation');
  
  if (!spec.components?.schemas) {
    logWarning('No schemas found in specification');
    return '';
  }

  let docs = '# API Schemas\n\n';
  
  for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
    docs += `## ${schemaName}\n\n`;
    
    if (schema.description) {
      docs += `${schema.description}\n\n`;
    }
    
    if (schema.type === 'object' && schema.properties) {
      docs += '### Properties\n\n';
      docs += '| Property | Type | Required | Description | Example |\n';
      docs += '|----------|------|----------|-------------|----------|\n';
      
      const required = schema.required || [];
      
      for (const [propName, prop] of Object.entries(schema.properties)) {
        const isRequired = required.includes(propName) ? '✅' : '❌';
        const type = prop.type || 'object';
        const description = prop.description || '';
        const example = prop.example ? `\`${JSON.stringify(prop.example)}\`` : '';
        
        docs += `| ${propName} | ${type} | ${isRequired} | ${description} | ${example} |\n`;
      }
      
      docs += '\n';
    }
    
    if (schema.enum) {
      docs += '### Allowed Values\n\n';
      schema.enum.forEach(value => {
        docs += `- \`${value}\`\n`;
      });
      docs += '\n';
    }
  }

  return docs;
}

/**
 * Generate error handling documentation
 */
function generateErrorDocumentation(spec) {
  logHeader('Generating Error Documentation');
  
  let docs = '# Error Handling\n\n';
  docs += 'The GearGrab API uses conventional HTTP response codes to indicate the success or failure of an API request.\n\n';
  
  // Standard HTTP status codes
  const statusCodes = {
    '200': { name: 'OK', description: 'The request was successful' },
    '201': { name: 'Created', description: 'The resource was successfully created' },
    '204': { name: 'No Content', description: 'The request was successful with no response body' },
    '400': { name: 'Bad Request', description: 'The request was invalid or cannot be served' },
    '401': { name: 'Unauthorized', description: 'Authentication is required and has failed or not been provided' },
    '403': { name: 'Forbidden', description: 'The request is understood but access is forbidden' },
    '404': { name: 'Not Found', description: 'The requested resource could not be found' },
    '409': { name: 'Conflict', description: 'The request conflicts with the current state of the resource' },
    '422': { name: 'Unprocessable Entity', description: 'The request was well-formed but contains semantic errors' },
    '429': { name: 'Too Many Requests', description: 'Rate limit exceeded' },
    '500': { name: 'Internal Server Error', description: 'An error occurred on the server' }
  };

  docs += '## HTTP Status Codes\n\n';
  docs += '| Code | Name | Description |\n';
  docs += '|------|------|-------------|\n';
  
  for (const [code, info] of Object.entries(statusCodes)) {
    docs += `| ${code} | ${info.name} | ${info.description} |\n`;
  }
  
  docs += '\n## Error Response Format\n\n';
  docs += 'All error responses follow a consistent format:\n\n';
  docs += '```json\n';
  docs += JSON.stringify({
    success: false,
    error: {
      code: "ERROR_CODE",
      message: "Human-readable error message",
      details: {
        field: "fieldName",
        value: "invalidValue"
      }
    },
    timestamp: "2024-01-15T10:30:00Z",
    requestId: "req_1234567890",
    path: "/api/v1/endpoint"
  }, null, 2);
  docs += '\n```\n\n';

  // Error codes from schema
  if (spec.components?.schemas?.ErrorResponse?.properties?.error?.properties?.code?.enum) {
    docs += '## Error Codes\n\n';
    docs += '| Code | Description |\n';
    docs += '|------|-------------|\n';
    
    const errorCodes = {
      'VALIDATION_ERROR': 'Input validation failed',
      'INVALID_CREDENTIALS': 'Authentication credentials are invalid',
      'ACCOUNT_LOCKED': 'User account is temporarily locked',
      'EMAIL_EXISTS': 'Email address is already registered',
      'USER_NOT_FOUND': 'User account not found',
      'TOKEN_EXPIRED': 'Authentication token has expired',
      'INSUFFICIENT_PERMISSIONS': 'User lacks required permissions',
      'RATE_LIMIT_EXCEEDED': 'API rate limit exceeded',
      'INTERNAL_ERROR': 'Internal server error occurred'
    };
    
    for (const [code, description] of Object.entries(errorCodes)) {
      docs += `| \`${code}\` | ${description} |\n`;
    }
    docs += '\n';
  }

  return docs;
}

/**
 * Generate interactive HTML documentation
 */
function generateInteractiveDocumentation(spec) {
  logHeader('Generating Interactive Documentation');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${spec.info.title} - API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .custom-header h1 { margin: 0; font-size: 2.5em; }
        .custom-header p { margin: 10px 0 0 0; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>${spec.info.title}</h1>
        <p>${spec.info.description?.split('\\n')[0] || 'RESTful API Documentation'}</p>
        <p>Version ${spec.info.version}</p>
    </div>
    <div id="swagger-ui"></div>
    
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: './openapi.yaml',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            requestInterceptor: (request) => {
                // Add custom headers or modify requests here
                return request;
            },
            responseInterceptor: (response) => {
                // Handle responses here
                return response;
            }
        });
    </script>
</body>
</html>`;

  return html;
}

/**
 * Generate Postman collection
 */
function generatePostmanCollection(spec) {
  logHeader('Generating Postman Collection');
  
  const collection = {
    info: {
      name: spec.info.title,
      description: spec.info.description,
      version: spec.info.version,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    auth: {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{auth_token}}",
          type: "string"
        }
      ]
    },
    variable: [
      {
        key: "baseUrl",
        value: spec.servers?.[0]?.url || "http://localhost:5173/api/v1",
        type: "string"
      },
      {
        key: "auth_token",
        value: "",
        type: "string"
      }
    ],
    item: []
  };

  // Convert OpenAPI paths to Postman requests
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
    
    for (const method of httpMethods) {
      if (pathItem[method]) {
        const operation = pathItem[method];
        const request = {
          name: operation.summary || `${method.toUpperCase()} ${path}`,
          request: {
            method: method.toUpperCase(),
            header: [
              {
                key: "Content-Type",
                value: "application/json",
                type: "text"
              }
            ],
            url: {
              raw: "{{baseUrl}}" + path,
              host: ["{{baseUrl}}"],
              path: path.split('/').filter(p => p)
            }
          }
        };

        // Add request body for POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(method) && operation.requestBody) {
          const schema = operation.requestBody.content?.['application/json']?.schema;
          if (schema?.example) {
            request.request.body = {
              mode: "raw",
              raw: JSON.stringify(schema.example, null, 2)
            };
          }
        }

        collection.item.push(request);
      }
    }
  }

  return collection;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  logHeader('GearGrab API Documentation Generator');
  
  try {
    // Validate OpenAPI spec
    const validation = validateOpenAPISpec();
    if (!validation) {
      process.exit(1);
    }

    const { spec, stats } = validation;
    const docsDir = path.join(projectRoot, 'docs', 'api');
    
    // Ensure docs directory exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    switch (command) {
      case 'validate':
        logSuccess('OpenAPI specification is valid');
        break;
        
      case 'summary':
        const summary = generateEndpointSummary(spec);
        fs.writeFileSync(path.join(docsDir, 'endpoint-summary.md'), summary);
        logSuccess('Endpoint summary generated: docs/api/endpoint-summary.md');
        break;
        
      case 'schemas':
        const schemaDocs = generateSchemaDocumentation(spec);
        fs.writeFileSync(path.join(docsDir, 'schemas.md'), schemaDocs);
        logSuccess('Schema documentation generated: docs/api/schemas.md');
        break;
        
      case 'errors':
        const errorDocs = generateErrorDocumentation(spec);
        fs.writeFileSync(path.join(docsDir, 'error-handling.md'), errorDocs);
        logSuccess('Error documentation generated: docs/api/error-handling.md');
        break;
        
      case 'interactive':
        const html = generateInteractiveDocumentation(spec);
        fs.writeFileSync(path.join(docsDir, 'index.html'), html);
        logSuccess('Interactive documentation generated: docs/api/index.html');
        logInfo('Open docs/api/index.html in your browser to view the interactive docs');
        break;
        
      case 'postman':
        const collection = generatePostmanCollection(spec);
        fs.writeFileSync(path.join(docsDir, 'postman-collection.json'), JSON.stringify(collection, null, 2));
        logSuccess('Postman collection generated: docs/api/postman-collection.json');
        break;
        
      case 'all':
        // Generate all documentation
        const allSummary = generateEndpointSummary(spec);
        const allSchemaDocs = generateSchemaDocumentation(spec);
        const allErrorDocs = generateErrorDocumentation(spec);
        const allHtml = generateInteractiveDocumentation(spec);
        const allCollection = generatePostmanCollection(spec);
        
        fs.writeFileSync(path.join(docsDir, 'endpoint-summary.md'), allSummary);
        fs.writeFileSync(path.join(docsDir, 'schemas.md'), allSchemaDocs);
        fs.writeFileSync(path.join(docsDir, 'error-handling.md'), allErrorDocs);
        fs.writeFileSync(path.join(docsDir, 'index.html'), allHtml);
        fs.writeFileSync(path.join(docsDir, 'postman-collection.json'), JSON.stringify(allCollection, null, 2));
        
        logSuccess('All documentation generated successfully!');
        logInfo(`Generated ${stats.pathCount} endpoints, ${stats.schemaCount} schemas`);
        logInfo('Files created:');
        logInfo('  - docs/api/endpoint-summary.md');
        logInfo('  - docs/api/schemas.md');
        logInfo('  - docs/api/error-handling.md');
        logInfo('  - docs/api/index.html');
        logInfo('  - docs/api/postman-collection.json');
        break;
        
      case 'help':
      default:
        logHeader('Available Commands');
        log('  validate    - Validate OpenAPI specification', 'cyan');
        log('  summary     - Generate endpoint summary', 'cyan');
        log('  schemas     - Generate schema documentation', 'cyan');
        log('  errors      - Generate error handling documentation', 'cyan');
        log('  interactive - Generate interactive HTML documentation', 'cyan');
        log('  postman     - Generate Postman collection', 'cyan');
        log('  all         - Generate all documentation', 'cyan');
        log('  help        - Show this help message', 'cyan');
        log('\nExamples:', 'yellow');
        log('  node scripts/generate-api-docs.js validate', 'blue');
        log('  node scripts/generate-api-docs.js all', 'blue');
        break;
    }
  } catch (error) {
    logError(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
