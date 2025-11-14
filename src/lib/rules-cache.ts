import { loadRules } from "@/lib/storage";

export type RulesCache = Awaited<ReturnType<typeof loadRules>>;

let cache: RulesCache | null = null;

export const initRulesCache = async () => {
    cache = await loadRules();
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area === "sync" && changes.RulesConfig) {
            cache = await loadRules();
        }
    })
}

export const getRulesCache = () => cache;