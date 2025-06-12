import winston from 'winston';
import env, { isProduction } from '../config/env.js';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create base transports
const baseTransports: winston.transport[] = [
  new winston.transports.Console({
    level: env.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add file transports in production
if (isProduction()) {
  baseTransports.push(
    new winston.transports.File({
      filename: 'logs/storage-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/storage-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger configuration
const loggerConfig = {
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      let logMessage = `${timestamp} [${level.toUpperCase()}]`;
      if (service) {
        logMessage += ` [${service}]`;
      }
      logMessage += `: ${message}`;
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta)}`;
      }
      
      return logMessage;
    })
  ),
  transports: baseTransports
};

// Create the main logger
export const logger = winston.createLogger(loggerConfig);

// Create service-specific loggers
export const createServiceLogger = (serviceName: string) => {
  return logger.child({ service: serviceName });
};

// Export default logger
export default logger; 