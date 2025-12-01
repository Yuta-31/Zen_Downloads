import { z } from "zod";

export const ConflictActionSchema = z.enum(["uniquify", "overwrite", "prompt"]);
export const DomainPatternSchema = z.string();

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
  transfomrs: z
    .array(z.enum(["lower-ext", "upper-ext", "sanitize-file", "normalize-nfc"]))
    .optional(),
});

export const RuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  domains: z.array(DomainPatternSchema).min(1),
  conditions: z.array(RuleConditionSchema),
  actions: RuleActionSchema,
  priority: z.number().optional(),
});

export const RulesConfigSchema = z.object({
  version: z.literal(1),
  rules: z.array(RuleSchema),
});

export type RulesConfig = z.infer<typeof RulesConfigSchema>;
export type RuleCondition = z.infer<typeof RuleConditionSchema>;
export type Rule = z.infer<typeof RuleSchema>;
