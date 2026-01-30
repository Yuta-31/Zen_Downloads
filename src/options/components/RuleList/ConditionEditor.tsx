import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  UnifiedCondition,
  ConditionType,
  MatchType,
} from "@/schemas/rules";

interface ConditionEditorProps {
  conditions: UnifiedCondition[];
  onChange: (conditions: UnifiedCondition[]) => void;
}

const CONDITION_TYPES: {
  value: ConditionType;
  label: string;
  placeholder: string;
}[] = [
  {
    value: "domain",
    label: "Domain",
    placeholder: "example.com or *.github.com",
  },
  {
    value: "extension",
    label: "Extension",
    placeholder: "pdf, docx, or pdf,doc,docx",
  },
  { value: "filename", label: "Filename", placeholder: "report or *.pdf" },
  { value: "path", label: "URL Path", placeholder: "/downloads/ or /api/*" },
  { value: "mime", label: "MIME Type", placeholder: "application/pdf" },
];

const MATCH_TYPES: {
  value: MatchType;
  label: string;
  supportsArray?: boolean;
}[] = [
  { value: "contains", label: "Contains" },
  { value: "exact", label: "Exact Match" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "regex", label: "Regex" },
  { value: "glob", label: "Glob Pattern" },
  { value: "in", label: "Is One Of", supportsArray: true },
  { value: "not_in", label: "Is Not One Of", supportsArray: true },
];

const validateRegex = (pattern: string): { valid: boolean; error?: string } => {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Invalid regex",
    };
  }
};

const ConditionRow: React.FC<{
  condition: UnifiedCondition;
  index: number;
  onUpdate: (index: number, condition: UnifiedCondition) => void;
  onRemove: (index: number) => void;
  isOnly: boolean;
}> = ({ condition, index, onUpdate, onRemove, isOnly }) => {
  const [regexError, setRegexError] = useState<string | null>(null);

  const conditionConfig = CONDITION_TYPES.find(
    (t) => t.value === condition.conditionType,
  );
  const matchConfig = MATCH_TYPES.find((t) => t.value === condition.matchType);

  // Validate regex when matchType is regex
  useEffect(() => {
    if (
      condition.matchType === "regex" &&
      typeof condition.value === "string"
    ) {
      const result = validateRegex(condition.value);
      setRegexError(result.valid ? null : result.error || "Invalid regex");
    } else {
      setRegexError(null);
    }
  }, [condition.matchType, condition.value]);

  const handleConditionTypeChange = (value: ConditionType) => {
    // Reset to sensible defaults when changing type
    let newMatchType: MatchType = condition.matchType;
    let newValue = condition.value;

    // If switching to extension, default to "in" with array
    if (
      value === "extension" &&
      !["in", "not_in"].includes(condition.matchType)
    ) {
      newMatchType = "in";
      newValue =
        typeof condition.value === "string"
          ? condition.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : condition.value;
    }

    // If switching from extension to something else, convert array to string
    if (value !== "extension" && Array.isArray(condition.value)) {
      newValue = condition.value.join(", ");
      if (["in", "not_in"].includes(condition.matchType)) {
        newMatchType = "contains";
      }
    }

    onUpdate(index, {
      ...condition,
      conditionType: value,
      matchType: newMatchType,
      value: newValue,
    });
  };

  const handleMatchTypeChange = (value: MatchType) => {
    let newValue = condition.value;

    // Convert between array and string formats
    if (
      ["in", "not_in"].includes(value) &&
      typeof condition.value === "string"
    ) {
      newValue = condition.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (
      !["in", "not_in"].includes(value) &&
      Array.isArray(condition.value)
    ) {
      newValue = condition.value.join(", ");
    }

    onUpdate(index, {
      ...condition,
      matchType: value,
      value: newValue,
    });
  };

  const handleValueChange = (inputValue: string) => {
    let newValue: string | string[] = inputValue;

    // For array match types, split by comma
    if (["in", "not_in"].includes(condition.matchType)) {
      newValue = inputValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    onUpdate(index, {
      ...condition,
      value: newValue,
    });
  };

  const displayValue = Array.isArray(condition.value)
    ? condition.value.join(", ")
    : condition.value;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start">
        {/* Condition Type */}
        <Select
          value={condition.conditionType}
          onValueChange={(v) => handleConditionTypeChange(v as ConditionType)}
        >
          <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-600 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-600">
            {CONDITION_TYPES.map((type) => (
              <SelectItem
                key={type.value}
                value={type.value}
                className="text-stone-700 dark:text-stone-200"
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Match Type */}
        <Select
          value={condition.matchType}
          onValueChange={(v) => handleMatchTypeChange(v as MatchType)}
        >
          <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-600 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-600">
            {MATCH_TYPES.map((type) => (
              <SelectItem
                key={type.value}
                value={type.value}
                className="text-stone-700 dark:text-stone-200"
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value Input */}
        <div className="space-y-1">
          <Input
            value={displayValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={conditionConfig?.placeholder || "Enter value..."}
            className={`bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-600 text-sm font-mono ${
              regexError ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
          />
          {regexError && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>{regexError}</span>
            </div>
          )}
          {matchConfig?.supportsArray && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              Separate multiple values with commas
            </p>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={isOnly}
          className="h-9 w-9 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  conditions,
  onChange,
}) => {
  const handleAddCondition = () => {
    const newCondition: UnifiedCondition = {
      conditionType: "domain",
      matchType: "contains",
      value: "",
      caseSensitive: false,
    };
    onChange([...conditions, newCondition]);
  };

  const handleUpdateCondition = (
    index: number,
    condition: UnifiedCondition,
  ) => {
    const updated = [...conditions];
    updated[index] = condition;
    onChange(updated);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      onChange(conditions.filter((_, i) => i !== index));
    }
  };

  // Ensure there's always at least one condition
  const displayConditions =
    conditions.length > 0
      ? conditions
      : [
          {
            conditionType: "domain" as const,
            matchType: "contains" as const,
            value: "*",
            caseSensitive: false,
          },
        ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Conditions
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddCondition}
          className="h-7 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Condition
        </Button>
      </div>

      <div className="space-y-3">
        {displayConditions.map((condition, index) => (
          <ConditionRow
            key={index}
            condition={condition}
            index={index}
            onUpdate={handleUpdateCondition}
            onRemove={handleRemoveCondition}
            isOnly={displayConditions.length === 1}
          />
        ))}
      </div>

      {displayConditions.length > 1 && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          All conditions must match for the rule to apply (AND logic)
        </p>
      )}
    </div>
  );
};

export default ConditionEditor;
