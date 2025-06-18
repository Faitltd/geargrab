const fs = require('fs').promises;
const { logger } = require('./utils');

const DEFAULT_CONFIG = {
  github: {
    token: process.env.GITHUB_TOKEN || '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',
    owner: process.env.GITHUB_OWNER || 'Faitltd',
    repo: process.env.GITHUB_REPO || 'geargrab',
    workflow: process.env.GITHUB_WORKFLOW || 'deploy.yml'
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || 'geargrabco',
    projectNumber: process.env.GCP_PROJECT_NUMBER || '227444442028',
    region: process.env.GCP_REGION || 'us-central1',
    registry: process.env.GCP_REGISTRY || 'gcr.io'
  },
  services: [
    {
      name: process.env.SERVICE_NAME || 'geargrab-app',
      dockerfile: process.env.DOCKERFILE || 'Dockerfile',
      context: process.env.BUILD_CONTEXT || '.',
      port: parseInt(process.env.SERVICE_PORT || '3000'),
      memory: process.env.SERVICE_MEMORY || '2Gi',
      cpu: process.env.SERVICE_CPU || '1000m',
      minInstances: parseInt(process.env.MIN_INSTANCES || '0'),
      maxInstances: parseInt(process.env.MAX_INSTANCES || '10')
    }
  ],
  domains: [
    'geargrab.co',
    'www.geargrab.co'
  ],
  docker: {
    imagePrefix: process.env.DOCKER_IMAGE_PREFIX || 'geargrab'
  }
};

async function load(configPath = '.pushdeployrc.json') {
  try {
    const configFile = await fs.readFile(configPath, 'utf8');
    const fileConfig = JSON.parse(configFile);
    return mergeConfig(DEFAULT_CONFIG, fileConfig);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`Configuration file ${configPath} not found, using defaults`);
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

async function init(outputPath = '.pushdeployrc.json') {
  await fs.writeFile(outputPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  logger.info(`Configuration initialized at ${outputPath}`);
}

function mergeConfig(defaults, overrides) {
  return { ...defaults, ...overrides };
}

module.exports = { load, init, DEFAULT_CONFIG };
