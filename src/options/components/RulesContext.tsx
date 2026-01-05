import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { RulesSchema, type Rule } from "@/schemas/rules";
import { readRules, writeRules } from "@/lib/rules/storage";

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
  importFromJson: (jsonText: string) => void;
}

export const RulesContext = createContext<RulesContextType | undefined>(
  undefined
);
export const RulesDispatchContext = createContext<
  RulesDispatchContextType | undefined
>(undefined);

interface RulesProviderProps {
  children: ReactNode;
}

export const RulesProvider: React.FC<RulesProviderProps> = ({ children }) => {
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    (async () => {
      const loadedRules = await readRules();
      setRules(loadedRules);
    })();
  }, []);

  useEffect(() => {
    if (!!rules && rules.length > 0) {
      try {
        const parsed = RulesSchema.parse(rules);
        console.log("Writing rules to storage:", parsed);
        writeRules(parsed);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        alert("保存できません (JSON or スキーマ不正) \n" + message);
      }
    }
  }, [rules]);

  // toggle enable/disable
  const toggleEnable = async (id: string) => {
    const next = clone(rules);
    const r = next.find((x) => x.id === id);
    if (!r) {
      console.error(`Rule with id ${id} not found`);
      return;
    }
    r.enabled = !r.enabled;
    setRules(next);
  };

  // add rule
  const addRule = async () => {
    const next = clone(rules);
    next.unshift({
      id: `r-${Date.now()}`,
      name: "新しいルール",
      enabled: true,
      domains: ["*"],
      conditions: [],
      actions: { pathTemplate: "{host}/{file}", conflict: "uniquify" },
    });
    setRules(next);
  };

  // update rule
  const updateRule = async (id: string, updatedRule: Partial<Rule>) => {
    const next = clone(rules);
    const index = next.findIndex((r) => r.id === id);
    if (index === -1) {
      console.error(`Rule with id ${id} not found`);
      return;
    }
    next[index] = { ...next[index], ...updatedRule };
    setRules(next);
  };

  // delete rule
  const removeRule = async (id: string) => {
    const next = clone(rules);
    setRules(next.filter((r) => r.id !== id));
  };

  // reorder rules
  const reorderRules = async (rules: Rule[]) => {
    setRules(rules);
  };

  // Export - returns the current rules as JSON
  const exportToJson = async () => {
    const latestRules = await readRules();
    return latestRules;
  };

  // Import - takes JSON text and sets it as the current rules
  const importFromJson = (json: string) => {
    const parsed = JSON.parse(json);
    setRules(parsed);
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
