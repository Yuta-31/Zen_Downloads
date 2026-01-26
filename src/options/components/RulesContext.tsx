import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { RulesSchema, type Rule } from "@/schemas/rules";
import { readRules, writeRules } from "@/lib/rules/storage";
import { createLogger } from "@/options/lib/logger";

const logger = createLogger("[RulesContext]");

const clone = <T,>(x: T) => JSON.parse(JSON.stringify(x)) as T;

export interface RulesContextType {
  rules: Rule[];
}

export interface RulesDispatchContextType {
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  toggleEnable: (id: string) => Promise<void>;
  addRule: () => Promise<void>;
  updateRule: (id: string, updatedRule: Partial<Rule>) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  reorderRules: (rules: Rule[]) => Promise<void>;
  exportToJson: () => Promise<Rule[]>;
  importFromJson: (rules: Rule[]) => void;
}

export const RulesContext = createContext<RulesContextType | undefined>(
  undefined,
);
export const RulesDispatchContext = createContext<
  RulesDispatchContextType | undefined
>(undefined);

interface RulesProviderProps {
  children: ReactNode;
}

export const RulesProvider: React.FC<RulesProviderProps> = ({ children }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    (async () => {
      logger.info("Loading rules from storage...");
      const loadedRules = await readRules();
      logger.info(`Loaded ${loadedRules.length} rules`);
      setRules(loadedRules);
      setIsInitialLoad(false);
    })();
  }, []);

  useEffect(() => {
    // Skip saving during initial load
    if (isInitialLoad) return;

    try {
      const parsed = RulesSchema.parse(rules);
      logger.info("Writing rules to storage:", parsed);
      writeRules(parsed);
    } catch (e) {
      logger.error("Failed to save rules:", e);
      const message = e instanceof Error ? e.message : String(e);
      alert("Cannot save (Invalid JSON or schema) \n" + message);
    }
  }, [rules, isInitialLoad]);

  // toggle enable/disable
  const toggleEnable = async (id: string) => {
    const next = clone(rules);
    const r = next.find((x) => x.id === id);
    if (!r) {
      logger.error(`Rule with id ${id} not found`);
      return;
    }
    logger.info(
      `Toggling rule "${r.name}" (${id}): ${r.enabled} → ${!r.enabled}`,
    );
    r.enabled = !r.enabled;
    setRules(next);
  };

  // add rule
  const addRule = async () => {
    const next = clone(rules);
    const newRuleId = `r-${Date.now()}`;
    next.push({
      id: newRuleId,
      name: "New Rule",
      enabled: true,
      domains: ["*"],
      conditions: [],
      actions: { pathTemplate: "{host}/{file}", conflict: "uniquify" },
    });
    logger.info(`Adding new rule with id ${newRuleId}`);
    setRules(next);
  };

  // update rule
  const updateRule = async (id: string, updatedRule: Partial<Rule>) => {
    const next = clone(rules);
    const index = next.findIndex((r) => r.id === id);
    if (index === -1) {
      logger.error(`Rule with id ${id} not found`);
      return;
    }
    logger.debug(`Updating rule "${next[index].name}" (${id})`);
    next[index] = { ...next[index], ...updatedRule };
    setRules(next);
  };

  // delete rule
  const removeRule = async (id: string) => {
    const next = clone(rules);
    const rule = rules.find((r) => r.id === id);
    if (rule) {
      logger.info(`Removing rule "${rule.name}" (${id})`);
    }
    setRules(next.filter((r) => r.id !== id));
  };

  // reorder rules
  const reorderRules = async (rules: Rule[]) => {
    logger.info("Reordering rules");
    setRules(rules);
  };

  // Export - returns the current rules as JSON
  const exportToJson = async () => {
    logger.info("Exporting rules to JSON");
    const latestRules = await readRules();
    logger.info(`Exported ${latestRules.length} rules`);
    return latestRules;
  };

  // Import - takes parsed rules array and sets it as the current rules
  const importFromJson = (rules: Rule[]) => {
    try {
      logger.info(`Importing ${rules.length} rules from JSON`);
      const parsed = RulesSchema.parse(rules);
      setRules(parsed);
      logger.info("Successfully imported rules");
    } catch (e) {
      logger.error("Failed to import rules:", e);
      const message = e instanceof Error ? e.message : String(e);
      alert("Cannot import rules (Invalid format or schema)\n" + message);
    }
  };

  const stateValue: RulesContextType = {
    rules,
  };

  const dispatchValue: RulesDispatchContextType = {
    setRules,
    toggleEnable,
    addRule,
    updateRule,
    removeRule,
    reorderRules,
    exportToJson,
    importFromJson,
  };

  return (
    <RulesContext.Provider value={stateValue}>
      <RulesDispatchContext.Provider value={dispatchValue}>
        {children}
      </RulesDispatchContext.Provider>
    </RulesContext.Provider>
  );
};
