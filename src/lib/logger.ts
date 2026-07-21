// ─── Error Handler & Logger ────────────────────────────────────────────────────

import { config } from './config';

export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

interface ErrorLog {
  timestamp: string;
  level: ErrorLevel;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(
    level: ErrorLevel,
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error instanceof Error ? error : undefined,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.logs.push(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // ─── Console output
    const logMethod = this.getConsoleMethod(level);
    logMethod(`[${level.toUpperCase()}] ${message}`, {
      error,
      context,
      timestamp: errorLog.timestamp,
    });

    // ─── Send to monitoring service in production
    if (
      config.app.environment === 'production' &&
      config.features.errorTracking &&
      (level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL)
    ) {
      this.sendToMonitoring(errorLog);
    }
  }

  private getConsoleMethod(level: ErrorLevel): any {
    switch (level) {
      case ErrorLevel.DEBUG:
        return console.debug;
      case ErrorLevel.INFO:
        return console.info;
      case ErrorLevel.WARNING:
        return console.warn;
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private async sendToMonitoring(errorLog: ErrorLog): Promise<void> {
    try {
      // ─── Example: Send to Sentry
      if (config.monitoring.sentryDsn && typeof window !== 'undefined') {
        const payload = {
          message: errorLog.message,
          level: errorLog.level,
          timestamp: errorLog.timestamp,
          stacktrace: errorLog.error?.stack,
          context: errorLog.context,
          tags: {
            environment: config.app.environment,
            version: config.app.version,
          },
        };

        await fetch(config.monitoring.sentryDsn, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {
          // Silently fail to avoid infinite loops
        });
      }
    } catch {
      // Prevent errors in error handling
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

// ─── Global Error Handlers ────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event: ErrorEvent) => {
    logger.log(
      ErrorLevel.ERROR,
      `Uncaught error: ${event.message}`,
      event.error,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.log(
      ErrorLevel.ERROR,
      'Unhandled promise rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  });
}

// ─── Custom Error Classes ──────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, 'AUTHZ_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, 'NOT_FOUND', 404, context);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 0, context);
    this.name = 'NetworkError';
  }
}

// ─── Helper functions ─────────────────────────────────────────────────────────

export function logDebug(message: string, context?: Record<string, any>): void {
  if (config.features.logging) {
    logger.log(ErrorLevel.DEBUG, message, undefined, context);
  }
}

export function logInfo(message: string, context?: Record<string, any>): void {
  if (config.features.logging) {
    logger.log(ErrorLevel.INFO, message, undefined, context);
  }
}

export function logWarn(message: string, context?: Record<string, any>): void {
  logger.log(ErrorLevel.WARNING, message, undefined, context);
}

export function logError(message: string, error?: Error | unknown, context?: Record<string, any>): void {
  logger.log(
    ErrorLevel.ERROR,
    message,
    error instanceof Error ? error : new Error(String(error)),
    context
  );
}

export function logCritical(message: string, error?: Error | unknown, context?: Record<string, any>): void {
  logger.log(
    ErrorLevel.CRITICAL,
    message,
    error instanceof Error ? error : new Error(String(error)),
    context
  );
}

export default logger;
