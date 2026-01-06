import { buildCtx, isInDomain, matchAll } from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/rules/template";
import { getRulesSnapshot, initRulesCache } from "@/background/lib/cache";
import { attachMessageListeners } from "./message";

attachMessageListeners();
initRulesCache().catch(console.error);
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

    console.log(urlStr);
    console.log(item);

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
        console.log("Got URL from active tab:", pageUrl);
      }
    } catch (e) {
      console.warn("Failed to get active tab URL:", e);
    }

    // Use pageUrl if available, otherwise use referrer
    const referrer = pageUrl || item.referrer;
    if (!pageUrl && item.referrer) {
      urlSource = "referrer header";
    }
    console.log(`[URL Source: ${urlSource}] Using referrer:`, referrer);
    const ctx = buildCtx(urlStr, item.filename, referrer);

    console.log("=== Domain Info ===");
    console.log("Download URL domain:", ctx.host);
    console.log("Referrer domain:", ctx.referrerHost || "(none)");

    const rules = getRulesSnapshot();
    if (!rules) return;
    const enabled = rules.filter((r) => r.enabled);
    const rule = enabled.find(
      (r) =>
        isInDomain(r.domains, ctx.host, ctx.referrerHost) &&
        matchAll(r.conditions, ctx)
    );

    if (rule) {
      console.log("=== Matched Rule ===");
      console.log("Rule name:", rule.name);
      console.log("Rule ID:", rule.id);
      console.log("Rule domains:", rule.domains.join(", "));
      console.log("Path template:", rule.actions.pathTemplate);

      const tpl = rule.actions.pathTemplate ?? "{host}/{file}";
      let newPath = expandTemplate(tpl, ctx);

      // Normalize path: convert backslashes to forward slashes
      newPath = newPath.replace(/\\/g, "/");

      console.log("Final path:", newPath);
      console.log("Suggesting filename to Chrome...");

      const suggestion: chrome.downloads.FilenameSuggestion = {
        filename: newPath,
        conflictAction: "uniquify",
      };
      console.log("Suggestion object:", JSON.stringify(suggestion));

      suggest(suggestion);

      console.log("Suggested successfully");
      return true; // Important: return true to indicate suggest has been processed
    } else {
      console.log("=== No Rule Matched ===");
    }
    return;
  } catch (e) {
    console.error("Failed to build filename:", e);
    return;
  }
};

if (chrome.downloads.onDeterminingFilename.hasListener(handler)) {
  chrome.downloads.onDeterminingFilename.removeListener(handler);
}
chrome.downloads.onDeterminingFilename.addListener(handler);
