import { buildCtx, inDomain, matchAll } from "@/lib/rule-engine";
import { expandTemplate } from "@/lib/template";
import { getRulesCache, initRulesCache } from "@/lib/rules-cache";


initRulesCache().catch(console.error);
const processed = new Set<number>();

const handler = (
  item: chrome.downloads.DownloadItem,
  suggest: (s: chrome.downloads.FilenameSuggestion) => void
) => {
  try {
    if (processed.has(item.id)) return;
    processed.add(item.id);

    const urlStr = item.finalUrl || item.url;
    const ctx = buildCtx(urlStr, item.filename);
    const cfg = getRulesCache();
    if (!cfg) return;
    const enabled = cfg.rules.filter((r) => r.enabled);
    const rule = enabled.find((r) => inDomain(r.domains, ctx.host) && matchAll(r.conditions, ctx));

    if (rule) {
      const tpl = rule.actions.pathTemplate ?? "{host}/{file}";
      const newPath = expandTemplate(tpl, ctx);
      suggest({
        filename: newPath,
        conflictAction: "uniquify"
      });
      return;
    }
    return;
  } catch (e) {
    console.error("Failed to build filename:", e);
    return;
  }
}

if (chrome.downloads.onDeterminingFilename.hasListener(handler)) {
  chrome.downloads.onDeterminingFilename.removeListener(handler);
}
chrome.downloads.onDeterminingFilename.addListener(handler);