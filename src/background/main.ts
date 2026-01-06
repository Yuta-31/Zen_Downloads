import { buildCtx, isInDomain, matchAll } from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/rules/template";
import { getRulesSnapshot, initRulesCache } from "@/background/lib/cache";
import { attachMessageListeners } from "./message";
import { logger } from "@/background/lib/logger";

attachMessageListeners();
initRulesCache().catch((err) => logger.error("Init rules cache failed:", err));
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
    if (item.byExtensionId === chrome.runtime.id) return;
    if (processed.has(item.id)) return;
    processed.add(item.id);

    const urlStr = item.finalUrl || item.url;

    logger.info("Download URL:", urlStr);
    logger.info("Download item:", item);

    // Get active tab URL
    let pageUrl: string | undefined;
    let urlSource: string = "none";
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.url) {
        pageUrl = tabs[0].url;
        urlSource = "active tab";
        logger.info("Got URL from active tab:", pageUrl);
      }
    } catch (e) {
      logger.warn("Failed to get active tab URL:", e);
    }

    // Use pageUrl if available, otherwise use referrer
    const referrer = pageUrl || item.referrer;
    if (!pageUrl && item.referrer) {
      urlSource = "referrer header";
    }
    logger.info(`[URL Source: ${urlSource}] Using referrer:`, referrer);
    const ctx = buildCtx(urlStr, item.filename, referrer);

    logger.info("=== Domain Info ===");
    logger.info("Download URL domain:", ctx.host);
    logger.info("Referrer domain:", ctx.referrerHost || "(none)");

    const rules = getRulesSnapshot();
    if (!rules) return;
    const enabled = rules.filter((r) => r.enabled);
    const rule = enabled.find(
      (r) =>
        isInDomain(r.domains, ctx.host, ctx.referrerHost) &&
        matchAll(r.conditions, ctx)
    );

    if (rule) {
      logger.info("=== Matched Rule ===");
      logger.info("Rule name:", rule.name);
      logger.info("Rule ID:", rule.id);
      logger.info("Rule domains:", rule.domains.join(", "));
      logger.info("Path template:", rule.actions.pathTemplate);

      const tpl = rule.actions.pathTemplate ?? "{host}/{file}";
      let newPath = expandTemplate(tpl, ctx);

      // Normalize path: convert backslashes to forward slashes
      newPath = newPath.replace(/\\/g, "/");

      logger.info("Final path:", newPath);
      logger.info("Suggesting filename to Chrome...");

      const suggestion: chrome.downloads.FilenameSuggestion = {
        filename: newPath,
        conflictAction: "uniquify",
      };
      logger.info("Suggestion object:", JSON.stringify(suggestion));

      suggest(suggestion);

      logger.info("Suggested successfully");
      return true; // Important: return true to indicate suggest has been processed
    } else {
      logger.info("=== No Rule Matched ===");
    }
    return;
  } catch (e) {
    logger.error("Failed to build filename:", e);
    return;
  }
};

if (chrome.downloads.onDeterminingFilename.hasListener(handler)) {
  chrome.downloads.onDeterminingFilename.removeListener(handler);
}
chrome.downloads.onDeterminingFilename.addListener(handler);
