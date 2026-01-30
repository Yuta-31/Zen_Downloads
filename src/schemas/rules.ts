import { z } from "zod";

export const ConflictActionSchema = z.enum(["uniquify", "overwrite", "prompt"]);
export const DomainPatternSchema = z.string();

// New: Condition types for unified matching
export const ConditionTypeSchema = z.enum([
  "domain",
  "extension",
  "filename",
  "path",
  "mime",
]);

// New: Match types for flexible pattern matching
export const MatchTypeSchema = z.enum([
  "contains",
  "exact",
  "starts_with",
  "ends_with",
  "regex",
  "glob",
  "in", // For array values (e.g., extension in ["pdf", "doc"])
  "not_in", // Negation of "in"
]);

// Legacy operators (kept for backward compatibility)
export const StringOperatorSchema = z.enum([
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
  "matches",
  "glob",
]);
export const ArrayOperatorSchema = z.enum(["in", "notIn"]);

// New: Unified condition schema
export const UnifiedConditionSchema = z.object({
  conditionType: ConditionTypeSchema,
  matchType: MatchTypeSchema,
  value: z.union([z.string(), z.array(z.string())]),
  caseSensitive: z.boolean().optional().default(false),
});

// Legacy condition schemas (kept for backward compatibility)
export const StringConditionSchema = z.object({
  key: z.string(),
  op: StringOperatorSchema,
  value: z.string().min(1),
});

export const ArrayConditionSchema = z.object({
  key: z.string(),
  op: ArrayOperatorSchema,
  value: z.array(z.string().min(1)).min(1),
});

export const RuleConditionSchema = z.union([
  StringConditionSchema,
  ArrayConditionSchema,
]);

export const RuleActionSchema = z.object({
  pathTemplate: z.string().min(1),
  conflict: ConflictActionSchema.optional(),
  transforms: z
    .array(z.enum(["lower-ext", "upper-ext", "sanitize-file", "normalize-nfc"]))
    .optional(),
});

// Rule schema with both legacy and unified conditions
export const RuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  // Legacy: domains array (will be migrated to unifiedConditions)
  domains: z.array(DomainPatternSchema).optional().default(["*"]),
  // Legacy: old conditions format
  conditions: z.array(RuleConditionSchema).optional().default([]),
  // New: unified conditions with flexible matching
  unifiedConditions: z.array(UnifiedConditionSchema).optional().default([]),
  actions: RuleActionSchema,
  priority: z.number().optional(),
});

export const RulesConfigSchema = z.object({
  version: z.literal(1),
  rules: z.array(RuleSchema),
});

export const RulesSchema = z.array(RuleSchema);

export type RulesConfig = z.infer<typeof RulesConfigSchema>;
export type RuleCondition = z.infer<typeof RuleConditionSchema>;
export type UnifiedCondition = z.infer<typeof UnifiedConditionSchema>;
export type ConditionType = z.infer<typeof ConditionTypeSchema>;
export type MatchType = z.infer<typeof MatchTypeSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type ConflictAction = z.infer<typeof ConflictActionSchema>;

// Migration helper: Convert legacy domain to unified condition
export const migrateDomainToCondition = (domain: string): UnifiedCondition => ({
  conditionType: "domain",
  matchType: domain.includes("*") ? "glob" : "contains",
  value: domain,
  caseSensitive: false,
});

// Migration helper: Convert legacy condition to unified condition
export const migrateConditionToUnified = (
  condition: RuleCondition,
): UnifiedCondition => {
  const keyToType: Record<string, ConditionType> = {
    ext: "extension",
    file: "filename",
    basename: "filename",
    path: "path",
    mime: "mime",
    host: "domain",
  };

  const opToMatchType: Record<string, MatchType> = {
    equals: "exact",
    notEquals: "exact",
    contains: "contains",
    notContains: "contains",
    startsWith: "starts_with",
    endsWith: "ends_with",
    matches: "regex",
    glob: "glob",
    in: "in",
    notIn: "not_in",
  };

  const key = "key" in condition ? condition.key : "ext";
  const op = condition.op;

  return {
    conditionType: keyToType[key] || "filename",
    matchType: opToMatchType[op] || "contains",
    value: condition.value,
    caseSensitive: false,
  };
};
