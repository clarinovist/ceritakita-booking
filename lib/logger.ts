/**
 * Structured logging system for the application
 * Provides consistent log formats and levels
 */

import fs from 'fs/promises';
import path from 'path';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_FILE = path.join(LOG_DIR, 'error.log');

// Ensure log directory exists
async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Format log entry for console output
function formatLogEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  
  const parts = [base];
  
  if (entry.context) {
    parts.push(`Context: ${JSON.stringify(entry.context)}`);
  }
  
  if (entry.userId) {
    parts.push(`User: ${entry.userId}`);
  }
  
  if (entry.requestId) {
    parts.push(`Request: ${entry.requestId}`);
  }
  
  if (entry.error) {
    parts.push(`Error: ${entry.error.message}`);
    if (entry.error.stack) {
      parts.push(entry.error.stack);
    }
  }
  
  return parts.join(' | ');
}

// Write to log file
async function writeToFile(level: LogLevel, formatted: string) {
  try {
    await ensureLogDir();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const logFile = level === 'error' ? ERROR_FILE : LOG_FILE;
    
    // Append to file
    await fs.appendFile(logFile, `${formatted}\n`);
    
    // Rotate if file is too large (10MB)
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > 10 * 1024 * 1024) {
        const backupFile = `${logFile}.${timestamp}`;
        await fs.rename(logFile, backupFile);
      }
    } catch (e) {
      // File might not exist yet
    }
  } catch (error) {
    // If file logging fails, fall back to console only
    console.error('Failed to write to log file:', error);
  }
}

// Main logging function
async function log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, userId?: string, requestId?: string): Promise<void> {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error,
    userId,
    requestId
  };

  const formatted = formatLogEntry(entry);
  
  // Always log to console
  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else if (level === 'info') {
    console.info(formatted);
  } else {
    console.log(formatted);
  }
  
  // Write to file (async, fire and forget)
  writeToFile(level, formatted).catch(() => {});
}

// Convenience methods
export const logger = {
  error: (message: string, context?: Record<string, any>, error?: Error, userId?: string, requestId?: string) => 
    log('error', message, context, error, userId, requestId),
  
  warn: (message: string, context?: Record<string, any>, userId?: string, requestId?: string) => 
    log('warn', message, context, undefined, userId, requestId),
  
  info: (message: string, context?: Record<string, any>, userId?: string, requestId?: string) => 
    log('info', message, context, undefined, userId, requestId),
  
  debug: (message: string, context?: Record<string, any>, userId?: string, requestId?: string) => 
    log('debug', message, context, undefined, userId, requestId),
  
  // Audit logging for security events
  audit: (action: string, resource: string, userId: string, details?: Record<string, any>) => {
    log('info', `AUDIT: ${action} on ${resource}`, {
      action,
      resource,
      ...details
    }, undefined, userId);
  }
};

// Error response standardization
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createErrorResponse(error: Error | AppError, requestId?: string, userId?: string) {
  const isAppError = error instanceof AppError;
  
  // Log the error
  logger.error(error.message, {
    code: isAppError ? error.code : undefined,
    details: isAppError ? error.details : undefined,
    stack: error.stack
  }, error, userId, requestId);
  
  // Return standardized response
  return {
    error: {
      message: error.message,
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      details: isAppError ? error.details : undefined,
      timestamp: new Date().toISOString(),
      requestId
    },
    statusCode: isAppError ? error.statusCode : 500
  };
}

// Validation error helper
export function createValidationError(errors: any[], requestId?: string) {
  return {
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
      timestamp: new Date().toISOString(),
      requestId
    },
    statusCode: 400
  };
}