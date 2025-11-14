import { RulesConfigSchema } from "@/schemas/rules";
import { DEFAULT_RULES, safeParseRulesConfig } from "./rules";

const getSync = async <T extends object> (defaults: T): Promise<T> => {
    return (await chrome.storage.sync.get(defaults)) as T;
}

const setSync = async (values: object): Promise<void> => {
    await chrome.storage.sync.set(values)
}

export const loadRules = async () => {
    const { rulesConfig } = await getSync<{ rulesConfig:unknown }>({ rulesConfig: DEFAULT_RULES });
    const parsed = safeParseRulesConfig(rulesConfig)

    if (!parsed.ok) {
        console.warn("Rules invalid. Fallback to DEFAULT:", parsed.error);
        // await setSync({ rulesConfig: parsed.data })
    }
    return parsed.data;
}

export const saveRules = async (cfg: unknown) => {
    const parsed = RulesConfigSchema.parse(cfg);
    await setSync({ rulesConfig: parsed });
}