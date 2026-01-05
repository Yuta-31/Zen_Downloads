import { readRules, watchRules } from "@/lib/rules/storage";
import type { Rule } from "@/schemas/rules";

let cache: Rule[] | null = null;

export const initRulesCache = async (): Promise<void> => {
  cache = await readRules();
  watchRules((rules) => {
    cache = rules;
  });
};

export const getRulesSnapshot = (): Rule[] | null => cache;
