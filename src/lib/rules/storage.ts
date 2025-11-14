import { RulesConfigSchema, type RulesConfig } from "@/schemas/rules";
import { DEFAULT_RULES } from "@/lib/rules/type";

const KEY = "rulesConfig" as const;

/** 取得（Zodで検証、壊れてたらDEFAULTに置換） */
export const readRules = async (): Promise<RulesConfig> => {
  const raw = (await chrome.storage.sync.get({ [KEY]: DEFAULT_RULES }))[KEY];
  const res = RulesConfigSchema.safeParse(raw);
  if (res.success) return res.data;

  // 破損自己修復
//   await chrome.storage.sync.set({ [KEY]: DEFAULT_RULES });
//   console.warn("rules: invalid config found. reset to DEFAULT.", res.error);
  return DEFAULT_RULES;
};

/** 保存（厳密検証。失敗時はZodErrorをthrow） */
export const writeRules = async (cfg: unknown): Promise<void> => {
  const parsed = RulesConfigSchema.parse(cfg);
  await chrome.storage.sync.set({ [KEY]: parsed });
};

/** 変更監視（解除関数を返す） */
export const observeRules = (
  cb: (cfg: RulesConfig) => void
): (() => void) => {
  const listener = async (changes: { [k: string]: chrome.storage.StorageChange }, area: string) => {
    if (area !== "sync" || !(KEY in changes)) return;
    const next = await readRules(); // 検証付きで再取得
    cb(next);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};

/** エクスポート／インポート（任意） */
export const exportRules = async (filename: string, text: string) => {
  // ★ data: ではなく blob: を使う
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // 早期解放で失敗しないよう、完了後に revoke
  const downloadId = await chrome.downloads.download({
    url,
    filename,                 // 例: "download-helper-rules.json"
    conflictAction: "uniquify",
    saveAs: false             // ← ダイアログ無し。指定名が確実に使われる
  });

  const onChanged = (delta: chrome.downloads.DownloadDelta) => {
    if (delta.id === downloadId && delta.state &&
        (delta.state.current === "complete" || delta.state.current === "interrupted")) {
      URL.revokeObjectURL(url);
      chrome.downloads.onChanged.removeListener(onChanged);
    }
  };
  chrome.downloads.onChanged.addListener(onChanged);
};

export const importRules = async (json: string): Promise<void> =>
  writeRules(JSON.parse(json));
