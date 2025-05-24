/**
 * Simple logger utility for the application
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Current log level - can be set based on environment
let currentLogLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

/**
 * Set the current log level
 * @param level The log level to set
 */
export const setLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
};

/**
 * Log a debug message
 * @param message The message to log
 * @param data Optional data to include
 */
export const logDebug = (message: string, data?: any) => {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.debug(`[DEBUG] ${message}`, data ? data : '');
  }
};

/**
 * Log an info message
 * @param message The message to log
 * @param data Optional data to include
 */
export const logInfo = (message: string, data?: any) => {
  if (currentLogLevel <= LogLevel.INFO) {
    console.info(`[INFO] ${message}`, data ? data : '');
  }
};

/**
 * Log a warning message
 * @param message The message to log
 * @param data Optional data to include
 */
export const logWarn = (message: string, data?: any) => {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(`[WARN] ${message}`, data ? data : '');
  }
};

/**
 * Log an error message
 * @param message The message to log
 * @param error Optional error to include
 */
export const logError = (message: string, error?: any) => {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }
}; 