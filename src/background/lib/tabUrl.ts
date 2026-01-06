import { createLogger } from "@/background/lib/logger";

const logger = createLogger("[TabUrl]");

/**
 * Get the URL of the currently active tab
 * @returns The URL of the active tab, or undefined if not available
 */
export const getActiveTabUrl = async (): Promise<{
  url: string | undefined;
  source: string;
}> => {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tabs[0]?.url) {
      logger.info("Got URL from active tab:", tabs[0].url);
      return { url: tabs[0].url, source: "active tab" };
    }
  } catch (e) {
    logger.warn("Failed to get active tab URL:", e);
  }
  return { url: undefined, source: "none" };
};
