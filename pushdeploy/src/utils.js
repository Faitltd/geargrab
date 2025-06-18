const chalk = require('chalk');

const logger = {
  info: (message) => console.log(chalk.blue('ℹ'), message),
  success: (message) => console.log(chalk.green('✅'), message),
  warn: (message) => console.log(chalk.yellow('⚠️'), message),
  error: (message) => console.log(chalk.red('❌'), message)
};

function handleError(error, context) {
  logger.error(`${context}: ${error.message}`);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}

module.exports = { logger, handleError };
