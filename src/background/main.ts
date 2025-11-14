import { buildCtx, inDomain, matchAll } from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/template";
import { getRulesSnapshot, initRulesCache } from "@/lib/rules/cache";
import { registerHandler, attachMessageListener, type MsgExportRules } from "@/lib/message";

registerHandler<MsgExportRules, { id: number }>("export-rules", async (msg) => {
   const base = (msg.filename ?? "rules.json").split(/[\\/]/).pop() || "rules.json";
  const safe = base
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/^\.+/, "_")
    .replace(/\.+$/, "");
  const finalName = /\.[A-Za-z0-9]+$/.test(safe) ? safe : `${safe}.json`;

  // ★ createObjectURL は使わず data: を作る
  const dataUrl = "data:application/json;charset=utf-8," + encodeURIComponent(msg.json);

  const id = await chrome.downloads.download({
    url: dataUrl,
    filename: finalName,
    conflictAction: "uniquify",
    saveAs: false, // ← ここがポイント（ダイアログ出さない）
  });

  return { ok: true, data: { id } };
});
registerHandler("ping", async () => ({ ok: true }));
attachMessageListener();

initRulesCache().catch(console.error);
const processed = new Set<number>();

const handler = (
  item: chrome.downloads.DownloadItem,
  suggest: (s: chrome.downloads.FilenameSuggestion) => void
) => {
  try {
    if (item.byExtensionId === chrome.runtime.id) return;
    if (processed.has(item.id)) return;
    processed.add(item.id);

    const urlStr = item.finalUrl || item.url;
    const ctx = buildCtx(urlStr, item.filename);
    const cfg = getRulesSnapshot();
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