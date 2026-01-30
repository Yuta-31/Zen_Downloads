import type {
  Rule,
  RuleCondition,
  UnifiedCondition,
  ConditionType,
  MatchType,
} from "@/schemas/rules";

/** Convert glob pattern to regular expression */
export const globToRegExp = (glob: string): RegExp => {
  if (glob === "*") return /^.*$/;
  const esc = glob.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
  const re = "^" + esc.replace(/\*/g, ".*") + "$";
  return new RegExp(re, "i");
};

/** Check if host matches domain pattern */
export const isInDomain = (
  patterns: string[],
  host: string,
  referrerHost?: string,
) => {
  // Match if either download URL host or referrer host matches the pattern
  return patterns.some((p) => {
    if (globToRegExp(p).test(host)) return true;
    if (referrerHost && globToRegExp(p).test(referrerHost)) return true;
    return false;
  });
};

/** Evaluation context */
export type EvalCtx = {
  url: string; // download URL
  protocol: string; // Protocol like http
  host: string; // https://example.com -> example.com
  port?: string; // Port number like 8080
  path: string; // /path/to/file
  pathSegments: string[]; // /path/to/file -> ["path", "to", "file"]
  query: Record<string, string | undefined>; // ?key=value -> { key: "value" }
  hash?: string; // #section
  file: string; // file.pdf
  basename: string; // file
  ext: string; // pdf
  now: Date;
  // Optional fields (can be extended later if needed)
  mime?: string;
  referrerHost?: string;
  referrerQuery?: Record<string, string | undefined>; // Query parameters from referrer
};

/** Build evaluation context from URL and DownloadItem */
export const buildCtx = (
  urlStr: string,
  filenameHint?: string,
  referrer?: string,
): EvalCtx => {
  const url = new URL(urlStr);
  const qs = Object.fromEntries(new URLSearchParams(url.search).entries());

  // Parse referrer query parameters
  let referrerQuery: Record<string, string | undefined> | undefined;
  let referrerHost: string | undefined;
  if (referrer) {
    try {
      const refUrl = new URL(referrer);
      referrerHost = refUrl.hostname;
      referrerQuery = Object.fromEntries(
        new URLSearchParams(refUrl.search).entries(),
      );
    } catch {
      // Ignore if referrer is not a valid URL
    }
  }

  // Infer filename
  let file = filenameHint;
  if (!file) {
    const p = url.pathname.split("/");
    if (!p[p.length - 1].includes(".")) file = "download";
    else file = p[p.length - 1] || "download";
  }
  const m = /^(.*?)(?:\.([^.]+))?$/.exec(file);
  const basename = m?.[1] ?? file;
  const ext = (m?.[2] ?? "").toLowerCase();

  return {
    url: urlStr,
    protocol: url.protocol.replace(":", ""),
    host: url.hostname,
    port: url.port || undefined,
    path: url.pathname,
    pathSegments: url.pathname.split("/").filter(Boolean),
    query: qs,
    hash: url.hash ? url.hash.slice(1) : undefined,
    file,
    basename,
    ext,
    now: new Date(),
    referrerHost,
    referrerQuery,
  };
};

/**
 * Get the target value for a condition type from the evaluation context
 */
const getConditionTargetValue = (
  conditionType: ConditionType,
  ctx: EvalCtx,
): string => {
  switch (conditionType) {
    case "domain":
      return ctx.host;
    case "extension":
      return ctx.ext;
    case "filename":
      return ctx.file;
    case "path":
      return ctx.path;
    case "mime":
      return ctx.mime ?? "";
    default:
      return "";
  }
};

/**
 * Apply match logic based on match type
 */
const applyMatchType = (
  matchType: MatchType,
  targetValue: string,
  conditionValue: string | string[],
  caseSensitive: boolean = false,
): boolean => {
  // Normalize case if case-insensitive
  const normalizeCase = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const target = normalizeCase(targetValue);

  switch (matchType) {
    case "exact": {
      const value = normalizeCase(conditionValue as string);
      return target === value;
    }

    case "contains": {
      const value = normalizeCase(conditionValue as string);
      return target.includes(value);
    }

    case "starts_with": {
      const value = normalizeCase(conditionValue as string);
      return target.startsWith(value);
    }

    case "ends_with": {
      const value = normalizeCase(conditionValue as string);
      return target.endsWith(value);
    }

    case "regex": {
      try {
        const flags = caseSensitive ? "" : "i";
        const regex = new RegExp(conditionValue as string, flags);
        return regex.test(targetValue);
      } catch {
        return false;
      }
    }

    case "glob": {
      const regex = globToRegExp(conditionValue as string);
      return regex.test(targetValue);
    }

    case "in": {
      const values = Array.isArray(conditionValue)
        ? conditionValue.map(normalizeCase)
        : [normalizeCase(conditionValue)];
      return values.includes(target);
    }

    case "not_in": {
      const values = Array.isArray(conditionValue)
        ? conditionValue.map(normalizeCase)
        : [normalizeCase(conditionValue)];
      return !values.includes(target);
    }

    default:
      return false;
  }
};

/**
 * Match a single unified condition against the evaluation context
 */
export const matchUnifiedCondition = (
  condition: UnifiedCondition,
  ctx: EvalCtx,
): boolean => {
  const targetValue = getConditionTargetValue(condition.conditionType, ctx);

  // Special handling for domain - also check referrer host
  if (condition.conditionType === "domain" && ctx.referrerHost) {
    const matchesPrimary = applyMatchType(
      condition.matchType,
      targetValue,
      condition.value,
      condition.caseSensitive,
    );
    if (matchesPrimary) return true;

    // Also check referrer host
    return applyMatchType(
      condition.matchType,
      ctx.referrerHost,
      condition.value,
      condition.caseSensitive,
    );
  }

  return applyMatchType(
    condition.matchType,
    targetValue,
    condition.value,
    condition.caseSensitive,
  );
};

/**
 * Match all unified conditions against the evaluation context (AND logic)
 */
export const matchAllUnifiedConditions = (
  conditions: UnifiedCondition[],
  ctx: EvalCtx,
): boolean => {
  if (conditions.length === 0) return true;
  return conditions.every((condition) => matchUnifiedCondition(condition, ctx));
};

/**
 * Legacy: Match all conditions using the old format
 */

export const matchAll = (
  conditions: Rule["conditions"],
  ctx: EvalCtx,
): boolean => {
  const getVal = (key: string): string => {
    if (key === "host") return ctx.host;
    if (key === "path") return ctx.path;
    if (key === "file") return ctx.file;
    if (key === "basename") return ctx.basename;
    if (key === "ext") return ctx.ext;
    if (key === "protocol") return ctx.protocol;
    if (key === "mime") return ctx.mime ?? "";
    if (key === "hash") return ctx.hash ?? "";
    if (key.startsWith("query.")) {
      const queryKey = key.slice(6);
      // Prioritize download URL query, fallback to referrer query if not found
      return ctx.query[queryKey] ?? ctx.referrerQuery?.[queryKey] ?? "";
    }
    if (key.startsWith("referrer.query."))
      return ctx.referrerQuery?.[key.slice(15)] ?? "";
    if (key === "referrer.host") return ctx.referrerHost ?? "";
    const seg = key.match(/^path\[(\d+)\]$/);
    if (seg) return ctx.pathSegments[Number(seg[1])] ?? "";
    return "";
  };

  return conditions.every((c: RuleCondition) => {
    const v = getVal(c.key);
    if ("value" in c && Array.isArray(c.value)) {
      const set = new Set(c.value.map((s) => s.toLowerCase()));
      const hit = set.has(v.toLowerCase());
      return c.op === "in" ? hit : !hit;
    } else {
      // TODO: What should we do when value is string[]?
      const val = c.value as string;
      switch (c.op) {
        case "equals":
          return v === val;
        case "notEquals":
          return v !== val;
        case "contains":
          return v.includes(val);
        case "notContains":
          return !v.includes(val);
        case "startsWith":
          return v.startsWith(val);
        case "endsWith":
          return v.endsWith(val);
        case "matches":
          return new RegExp(val, "i").test(v);
        case "glob":
          return globToRegExp(val).test(v);
        default:
          return false;
      }
    }
  });
};

/**
 * Check if a rule matches the given context
 * Supports both legacy domains/conditions and new unified conditions
 */
export const matchRule = (rule: Rule, ctx: EvalCtx): boolean => {
  // New unified conditions take precedence
  if (rule.unifiedConditions && rule.unifiedConditions.length > 0) {
    return matchAllUnifiedConditions(rule.unifiedConditions, ctx);
  }

  // Fall back to legacy matching
  const domainMatch = rule.domains
    ? isInDomain(rule.domains, ctx.host, ctx.referrerHost)
    : true;

  const conditionsMatch = rule.conditions
    ? matchAll(rule.conditions, ctx)
    : true;

  return domainMatch && conditionsMatch;
};
