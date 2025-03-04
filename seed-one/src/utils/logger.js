/**
 * Logging Utility for Seed One
 * 
 * Provides structured logging capabilities with multiple output targets
 * and configurable log levels.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { app } = require('electron');

// Define log levels and colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  }
};

// Create logs directory if it doesn't exist
let logsDir;
if (app) {
  // In Electron context
  logsDir = path.join(app.getPath('userData'), 'logs');
} else {
  // Outside Electron context (e.g., during testing)
  logsDir = path.join(os.homedir(), '.seed-one', 'logs');
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure log file paths
const logFilePath = path.join(logsDir, 'seed-one.log');
const errorLogFilePath = path.join(logsDir, 'error.log');

// Create logger instance
let logger;

/**
 * Initialize the logging system with the specified configuration
 * @param {boolean} isDev - Whether running in development mode
 */
function setupLogging(isDev = false) {
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(
      ({ level, message, timestamp, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? `\n${stack}` : ''}`;
      }
    )
  );

  // Configure console output format with colors
  const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(
      ({ level, message, timestamp, stack }) => {
        return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ''}`;
      }
    )
  );

  // Set default log level based on environment
  const defaultLogLevel = isDev ? 'debug' : 'info';

  // Create the logger
  logger = winston.createLogger({
    levels: logLevels.levels,
    level: defaultLogLevel,
    format: logFormat,
    transports: [
      // Console output
      new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
      }),
      // Regular log file
      new winston.transports.File({
        filename: logFilePath,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true,
      }),
      // Error log file (error level only)
      new winston.transports.File({
        filename: errorLogFilePath,
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true,
      }),
    ],
    exitOnError: false,
  });

  // Add colors to winston
  winston.addColors(logLevels.colors);

  logger.info('Logging system initialized');
  logger.debug(`Log files location: ${logsDir}`);

  return logger;
}

// Export the setup function and logger
module.exports = {
  setupLogging,
  logger: {
    error: (...args) => logger ? logger.error(...args) : console.error(...args),
    warn: (...args) => logger ? logger.warn(...args) : console.warn(...args),
    info: (...args) => logger ? logger.info(...args) : console.info(...args),
    http: (...args) => logger ? logger.http(...args) : console.info(...args),
    debug: (...args) => logger ? logger.debug(...args) : console.debug(...args),
  }
};