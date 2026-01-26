type LogLevel = "log" | "info" | "warn" | "error" | "debug";

class Logger {
  private prefix: string;

  constructor(prefix: string = "[Options]") {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, ...args: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    return [`${timestamp} ${this.prefix} [${level.toUpperCase()}]`, ...args];
  }

  log(...args: unknown[]): void {
    console.log(...this.formatMessage("log", ...args));
  }

  info(...args: unknown[]): void {
    console.info(...this.formatMessage("info", ...args));
  }

  warn(...args: unknown[]): void {
    console.warn(...this.formatMessage("warn", ...args));
  }

  error(...args: unknown[]): void {
    console.error(...this.formatMessage("error", ...args));
  }

  debug(...args: unknown[]): void {
    console.debug(...this.formatMessage("debug", ...args));
  }
}

export const createLogger = (prefix?: string): Logger => {
  return new Logger(prefix);
};
