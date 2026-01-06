import { initRulesCache } from "@/background/lib/cache";
import { createLogger } from "@/background/lib/logger";
import { attachMessageListeners } from "./lib/message";
import { getActiveTabUrl } from "./lib/tabUrl";
import { findMatchingRule } from "./lib/ruleMatcher";
import { buildDownloadPath } from "./lib/pathBuilder";

const logger = createLogger("[Main]");

attachMessageListeners();
initRulesCache().catch((e) => logger.error("Failed to init rules cache:", e));

const processed = new Set<number>();

const handler = (
  item: chrome.downloads.DownloadItem,
  suggest: (s: chrome.downloads.FilenameSuggestion) => void
) => {
  // Separate async processing into another function
  processDownload(item, suggest);
  return true; // Notify Chrome that async processing is being performed
};

const processDownload = async (
  item: chrome.downloads.DownloadItem,
  suggest: (s: chrome.downloads.FilenameSuggestion) => void
) => {
  try {
    // Skip if download is initiated by this extension
    if (item.byExtensionId === chrome.runtime.id) return;

    // Skip if already processed
    if (processed.has(item.id)) return;
    processed.add(item.id);

    const urlStr = item.finalUrl || item.url;
    logger.log("Download URL:", urlStr);
    logger.log("Download item:", item);

    // Get active tab URL
    const { url: pageUrl, source: urlSource } = await getActiveTabUrl();

    // Use pageUrl if available, otherwise use referrer
    const referrer = pageUrl || item.referrer;
    const finalSource =
      !pageUrl && item.referrer ? "referrer header" : urlSource;

    logger.info(`[URL Source: ${finalSource}] Using referrer:`, referrer);

    // Find matching rule
    const rule = findMatchingRule({
      urlStr,
      filename: item.filename,
      referrer,
    });

    if (!rule) return;

    // Build the download path
    const newPath = buildDownloadPath(rule, {
      urlStr,
      filename: item.filename,
      referrer,
    });

    // Suggest the new filename to Chrome
    logger.info("Suggesting filename to Chrome...");
    const suggestion: chrome.downloads.FilenameSuggestion = {
      filename: newPath,
      conflictAction: "uniquify",
    };
    logger.debug("Suggestion object:", JSON.stringify(suggestion));

    suggest(suggestion);
    logger.info("Suggested successfully");

    return true;
  } catch (e) {
    logger.error("Failed to build filename:", e);
    return;
  }
};

// Register download handler
if (chrome.downloads.onDeterminingFilename.hasListener(handler)) {
  chrome.downloads.onDeterminingFilename.removeListener(handler);
}
chrome.downloads.onDeterminingFilename.addListener(handler);
