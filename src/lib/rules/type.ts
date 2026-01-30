import { RulesConfigSchema, type RulesConfig } from "../../schemas/rules";

const DEFAULT_RULES: RulesConfig = {
  version: 1,
  rules: [
    {
      id: "r-docx",
      name: "Save Word documents",
      enabled: true,
      domains: ["*"],
      conditions: [{ key: "ext", op: "in", value: ["doc", "docx"] }],
      unifiedConditions: [
        {
          conditionType: "extension",
          matchType: "in",
          value: ["doc", "docx"],
          caseSensitive: false,
        },
      ],
      actions: {
        pathTemplate: "{host}/images/{ext}/{yyyy-mm-dd}/{file}",
        conflict: "uniquify",
      },
    },
    {
      id: "r-images",
      name: "Save image files",
      enabled: true,
      domains: ["*"],
      conditions: [
        {
          key: "ext",
          op: "in",
          value: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
        },
      ],
      unifiedConditions: [
        {
          conditionType: "extension",
          matchType: "in",
          value: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
          caseSensitive: false,
        },
      ],
      actions: {
        pathTemplate: "{host}/images/{ext}/{yyyy-mm-dd}/{file}",
        conflict: "uniquify",
      },
    },
    {
      id: "r-catch-all",
      name: "Default",
      enabled: true,
      domains: ["*"],
      conditions: [],
      unifiedConditions: [
        {
          conditionType: "domain",
          matchType: "glob",
          value: "*",
          caseSensitive: false,
        },
      ],
      actions: { pathTemplate: "{host}/{file}", conflict: "uniquify" },
    },
  ],
};

export const parseRuleConfig = (raw: unknown): RulesConfig =>
  RulesConfigSchema.parse(raw);

export const safeParseRulesConfig = (
  raw: unknown,
):
  | { ok: true; data: RulesConfig }
  | { ok: false; data: RulesConfig; error: string } => {
  const res = RulesConfigSchema.safeParse(raw);
  if (res.success) return { ok: true, data: res.data };
  return {
    ok: false,
    data: DEFAULT_RULES,
    error: res.error
      .flatten()
      .formErrors.concat(Object.values(res.error.flatten().fieldErrors).flat())
      .join("\n"),
  };
};
