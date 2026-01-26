import { initRulesCache } from "@/background/lib/cache";
import { createLogger } from "@/background/lib/logger";
import { getSettings } from "@/lib/settings";
import { attachMessageListeners } from "./lib/message";
import { getActiveTabUrl } from "./lib/tabUrl";
import { findMatchingRule } from "./lib/ruleMatcher";
import { buildDownloadPath } from "./lib/pathBuilder";

const logger = createLogger("[Main]");

attachMessageListeners();

const processed = new Set<number>();

const handler = (
  item: chrome.downloads.DownloadItem,
  suggest: (s: chrome.downloads.FilenameSuggestion) => void,
) => {
  // Separate async processing into another function
  processDownload(item, suggest);
  return true; // Notify Chrome that async processing is being performed
};

const processDownload = async (
  item: chrome.downloads.DownloadItem,
  suggest: (s: chrome.downloads.FilenameSuggestion) => void,
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

    // Get settings to determine conflict action
    const settings = await getSettings();
    logger.info("Loaded settings:", settings);
    logger.info("Rule conflict action:", rule.actions.conflict);
    logger.info("Default conflict action:", settings.defaultConflictAction);

    // Use rule's conflict action if specified, otherwise use default from settings
    const conflictAction =
      rule.actions.conflict ?? settings.defaultConflictAction;
    logger.info("Final conflict action:", conflictAction);

    // Suggest the new filename to Chrome
    logger.info("Suggesting filename to Chrome...");
    const suggestion: chrome.downloads.FilenameSuggestion = {
      filename: newPath,
      conflictAction: conflictAction,
    };
    logger.debug("Suggestion object:", JSON.stringify(suggestion));

    suggest(suggestion);
    logger.info("Suggested successfully");

    // Send notification to the active tab where download was initiated
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, {
            type: "download-organized",
            data: {
              ruleName: rule.name,
              ruleId: rule.id,
              path: newPath,
              filename: item.filename,
            },
          })
          .catch((e) => {
            logger.debug("Could not send message to tab:", e);
          });
      }
    } catch (e) {
      logger.debug("Failed to notify tab:", e);
    }

    return true;
  } catch (e) {
    logger.error("Failed to build filename:", e);
    return;
  }
};

// Initialize rules cache and register download handler
(async () => {
  try {
    logger.info("Initializing rules cache...");
    await initRulesCache();
    logger.info("Rules cache initialized successfully");

    // Register download handler after cache is ready
    if (chrome.downloads.onDeterminingFilename.hasListener(handler)) {
      chrome.downloads.onDeterminingFilename.removeListener(handler);
    }
    chrome.downloads.onDeterminingFilename.addListener(handler);
    logger.info("Download handler registered");
  } catch (e) {
    logger.error("Failed to initialize extension:", e);
  }
})();
