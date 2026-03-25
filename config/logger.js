/**
 * Centralized Logging Configuration
 * Replaces console.log with structured logging for production
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_FORMAT = process.env.LOG_FORMAT || 'json';

/**
 * Simple logger that doesn't require external dependencies
 * Writes to console and file with proper formatting
 */
const logger = {
  info: (message, data = {}) => {
    const log = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...data,
    };
    console.log(JSON.stringify(log));
    if (NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'app.log'),
        JSON.stringify(log) + '\n'
      );
    }
  },

  error: (message, error, data = {}) => {
    const log = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message || error,
      stack: NODE_ENV === 'development' ? error?.stack : undefined,
      ...data,
    };
    console.error(JSON.stringify(log));
    fs.appendFileSync(
      path.join(logsDir, 'error.log'),
      JSON.stringify(log) + '\n'
    );
  },

  warn: (message, data = {}) => {
    const log = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...data,
    };
    console.warn(JSON.stringify(log));
    if (NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'app.log'),
        JSON.stringify(log) + '\n'
      );
    }
  },

  debug: (message, data = {}) => {
    if (NODE_ENV === 'development') {
      const log = {
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message,
        ...data,
      };
      console.debug(JSON.stringify(log));
    }
  },
};

module.exports = logger;
