import { readRules, observeRules } from "@/lib/rules/storage";
import type { RulesConfig } from "@/schemas/rules";

let cache: RulesConfig | null = null;

export const initRulesCache = async (): Promise<void> => {
  cache = await readRules();
  observeRules((cfg) => { cache = cfg; });
};

export const getRulesSnapshot = (): RulesConfig | null => cache;
