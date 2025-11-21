import { RulesConfigSchema, type RulesConfig } from "../../schemas/rules";

export const DEFAULT_RULES: RulesConfig = {
  version: 1,
  rules: [
    {
      id: "r-docx",
      name: "Wordの拡張子で保存",
      enabled: true,
      domains: ["*"],
      conditions: [{ key: "ext", op: "in", value: ["doc", "docx"] }],
      actions: {
        pathTemplate: "{host}/images/{ext}/{yyyy-mm-dd}/{file}",
        conflict: "uniquify",
      },
    },
    {
      id: "r-images",
      name: "画像ファイルで保存",
      enabled: true,
      domains: ["*"],
      conditions: [
        {
          key: "ext",
          op: "in",
          value: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
        },
      ],
      actions: {
        pathTemplate: "{host}/images/{ext}/{yyyy-mm-dd}/{file}",
        conflict: "uniquify",
      },
    },
    {
      id: "r-catch-all",
      name: "既定",
      enabled: true,
      domains: ["*"],
      conditions: [],
      actions: { pathTemplate: "{host}/{file}", conflict: "uniquify" },
    },
  ],
};

export const parseRuleConfig = (raw: unknown): RulesConfig =>
  RulesConfigSchema.parse(raw);

export const safeParseRulesConfig = (
  raw: unknown
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
