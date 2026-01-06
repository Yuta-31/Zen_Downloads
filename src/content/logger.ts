import { sendMessage } from "@/lib/message";

/**
 * Content script logger that sends logs to background script
 * Falls back to console.error if message fails to send
 */
class ContentLogger {
  private async sendLog(
    level: "info" | "warn" | "error",
    ...args: unknown[]
  ): Promise<void> {
    try {
      const result = await sendMessage(
        {
          command: "log",
          payload: { level, args },
        },
        3000
      );

      if (!result.ok) {
        // If background doesn't handle the log, fallback to console.error
        console.error(
          "[CDP] Failed to send log to background:",
          result.error,
          "\nOriginal log:",
          ...args
        );
      }
    } catch (error) {
      // If message can't be sent at all, output error to console
      console.error(
        "[CDP] Error sending log message to background:",
        error,
        "\nOriginal log:",
        ...args
      );
    }
  }

  info(...args: unknown[]): void {
    this.sendLog("info", ...args);
  }

  warn(...args: unknown[]): void {
    this.sendLog("warn", ...args);
  }

  error(...args: unknown[]): void {
    this.sendLog("error", ...args);
  }
}

export const logger = new ContentLogger();
