import { attachMessageListener, registerHandler } from "@/lib/message";

export const attachMessageListeners = () => {
  registerHandler<"export-rules", { id: number }>(
    "export-rules",
    async (msg) => {
      const base =
        (msg.filename ?? "rules.json").split(/[\\/]/).pop() || "rules.json";
      const safe = base
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/^\.+/, "_")
        .replace(/\.+$/, "");
      const finalName = /\.[A-Za-z0-9]+$/.test(safe) ? safe : `${safe}.json`;

      // ★ createObjectURL は使わず data: を作る
      const dataUrl =
        "data:application/json;charset=utf-8," + encodeURIComponent(msg.json);

      const id = await chrome.downloads.download({
        url: dataUrl,
        filename: finalName,
        conflictAction: "uniquify",
        saveAs: false, // ← ここがポイント（ダイアログ出さない）
      });

      return { ok: true, data: { id } };
    }
  );
  registerHandler("ping", async () => ({ ok: true }));
  attachMessageListener();
};
