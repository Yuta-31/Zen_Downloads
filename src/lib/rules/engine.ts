import type { Rule, RuleCondition } from "@/schemas/rules";

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
  referrerHost?: string
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
  referrer?: string
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
        new URLSearchParams(refUrl.search).entries()
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

export const matchAll = (
  conditions: Rule["conditions"],
  ctx: EvalCtx
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
