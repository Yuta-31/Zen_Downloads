/**
 * Logger class for background script
 * Provides structured logging with levels (info, warn, error)
 */
export class Logger {
  private prefix: string;

  constructor(prefix = "[CDP]") {
    this.prefix = prefix;
  }

  /**
   * Log info level message
   */
  info(...args: unknown[]): void {
    console.log(this.prefix, ...args);
  }

  /**
   * Log warning level message
   */
  warn(...args: unknown[]): void {
    console.warn(this.prefix, ...args);
  }

  /**
   * Log error level message
   */
  error(...args: unknown[]): void {
    console.error(this.prefix, ...args);
  }

  /**
   * Create a child logger with additional prefix
   */
  child(childPrefix: string): Logger {
    return new Logger(`${this.prefix}[${childPrefix}]`);
  }
}

// Default logger instance
export const logger = new Logger("[CDP: BG]");
