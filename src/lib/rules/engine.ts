import type { Rule } from "@/schemas/rules"
export const globToRegExp = (glob: string): RegExp => {
  if (glob === "*") return /^.*$/;
  const esc = glob.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
  const re = "^" + esc.replace(/\*/g, ".*") + "$";
  return new RegExp(re, "i");
}

export const inDomain = (patterns: string[], host: string) =>
  patterns.some((p) => globToRegExp(p).test(host));

/** URL と DownloadItem から評価用コンテキストを構築 */
export type EvalCtx = {
  url: string;
  protocol: string;
  host: string;
  port?: string;
  path: string;
  pathSegments: string[];
  query: Record<string, string | undefined>;
  hash?: string;
  file: string;      // file.pdf
  basename: string;  // file
  ext: string;       // pdf
  now: Date;
  // 取れたら使う系（必要なら後で拡張）
  mime?: string;
  referrerHost?: string;
};

export const buildCtx = (urlStr: string, filenameHint?: string): EvalCtx => {
  const u = new URL(urlStr);
  const qs = Object.fromEntries(new URLSearchParams(u.search).entries());

  // ファイル名の推定
  let file = filenameHint;
  if (!file) {
    const p = u.pathname.split("/").filter(Boolean);
    file = p[p.length - 1] || "download";
  }
  const m = /^(.*?)(?:\.([^.]+))?$/.exec(file);
  const basename = m?.[1] ?? file;
  const ext = (m?.[2] ?? "").toLowerCase();

  return {
    url: urlStr,
    protocol: u.protocol.replace(":", ""),
    host: u.hostname,
    port: u.port || undefined,
    path: u.pathname,
    pathSegments: u.pathname.split("/").filter(Boolean),
    query: qs,
    hash: u.hash ? u.hash.slice(1) : undefined,
    file,
    basename,
    ext,
    now: new Date(),
  };
};

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
    if (key.startsWith("query.")) return ctx.query[key.slice(6)] ?? "";
    const seg = key.match(/^path\[(\d+)\]$/);
    if (seg) return ctx.pathSegments[Number(seg[1])] ?? "";
    return "";
  };

  return conditions.every((c) => {
    const v = getVal(c.key);
    if ("value" in c && Array.isArray(c.value)) {
      const set = new Set(c.value.map((s) => s.toLowerCase()));
      const hit = set.has(v.toLowerCase());
      return c.op === "in" ? hit: !hit;
    } else {
      const val = (c as any).value as string;
      switch (c.op) {
        case "equals": return v === val;
        case "notEquals": return v !== val;
        case "contains": return v.includes(val);
        case "notContains": return !v.includes(val);
        case "startsWith": return v.startsWith(val);
        case "endsWith": return v.endsWith(val);
        case "matches": return new RegExp(val, "i").test(v);
        case "glob": return globToRegExp(val).test(v);
        default: return false;
      }
    }
  })
}