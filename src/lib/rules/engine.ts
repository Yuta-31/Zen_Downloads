import type { Rule, RuleCondition } from "@/schemas/rules";

/** glob から正規表現に変換 */
export const globToRegExp = (glob: string): RegExp => {
  if (glob === "*") return /^.*$/;
  const esc = glob.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
  const re = "^" + esc.replace(/\*/g, ".*") + "$";
  return new RegExp(re, "i");
};

/** ドメインパターンにホストが含まれるか判定 */
export const isInDomain = (patterns: string[], host: string) =>
  patterns.some((p) => globToRegExp(p).test(host));

/** 評価用コンテキスト */
export type EvalCtx = {
  url: string; // download URL
  protocol: string; // http 等のプロトコル
  host: string; // https://example.com -> example.com
  port?: string; // 8080 等のポート番号
  path: string; // /path/to/file
  pathSegments: string[]; // /path/to/file -> ["path", "to", "file"]
  query: Record<string, string | undefined>; // ?key=value -> { key: "value" }
  hash?: string; // #section
  file: string; // file.pdf
  basename: string; // file
  ext: string; // pdf
  now: Date;
  // 取れたら使う系（必要なら後で拡張）
  mime?: string;
  referrerHost?: string;
};

/** URL と DownloadItem から評価用コンテキストを構築 */
export const buildCtx = (urlStr: string, filenameHint?: string): EvalCtx => {
  const url = new URL(urlStr);
  const qs = Object.fromEntries(new URLSearchParams(url.search).entries());

  // ファイル名の推定
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
    if (key.startsWith("query.")) return ctx.query[key.slice(6)] ?? "";
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
      // TODO: string[] の時はどうするんすか
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
