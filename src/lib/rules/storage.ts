import { RulesSchema, type Rule } from "@/schemas/rules";

const KEY = "rulesConfig" as const;

/** Read rules from local storage */
export const readRules = async (): Promise<Rule[]> => {
  const result = await chrome.storage.local.get(KEY);
  const raw = result[KEY];
  const res = RulesSchema.safeParse(raw);
  if (res.success) return res.data;
  return [];
};

/** Save rules to local storage (strict validation. Throws ZodError on failure) */
export const writeRules = async (rules: Rule[]): Promise<void> => {
  const parsed = RulesSchema.parse(rules);
  await chrome.storage.local.set({ [KEY]: parsed });
};

/** Watch rules in local storage */
export const watchRules = (cb: (rules: Rule[]) => void): (() => void) => {
  const listener = async (
    changes: { [k: string]: chrome.storage.StorageChange },
    area: string
  ) => {
    if (area !== "local" || !(KEY in changes)) return;
    const next = await readRules();
    cb(next);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};
