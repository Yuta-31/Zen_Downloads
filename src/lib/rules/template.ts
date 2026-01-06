import { sanitizeSegment } from "@/lib/sanitize";
import type { EvalCtx } from "@/lib/rules/engine";

export type ExpandOptions = {
  sanitizeSegments?: boolean;
};

type ExactResolver = (ctx: EvalCtx) => string;

const pad = (n: number) => String(n).padStart(2, "0");
const dateTokens = (d: Date) => {
  const yyyy = String(d.getFullYear());
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return {
    yyyy,
    yy: yyyy.slice(-2),
    mm,
    dd,
    hh,
    min,
    ss,
    ymd: `${yyyy}-${mm}-${dd}`,
  };
};

const exactResolvers: Record<string, ExactResolver> = {
  // date
  yyyy: (ctx) => dateTokens(ctx.now).yyyy,
  yy: (ctx) => dateTokens(ctx.now).yy,
  mm: (ctx) => dateTokens(ctx.now).mm,
  dd: (ctx) => dateTokens(ctx.now).dd,
  hh: (ctx) => dateTokens(ctx.now).hh,
  min: (ctx) => dateTokens(ctx.now).min,
  ss: (ctx) => dateTokens(ctx.now).ss,
  "yyyy-mm-dd": (ctx) => dateTokens(ctx.now).ymd,

  // primitives
  host: (ctx) => ctx.host,
  path: (ctx) => ctx.pathSegments.join("/"),
  file: (ctx) => ctx.file,
  basename: (ctx) => ctx.basename,
  ext: (ctx) => ctx.ext,
  protocol: (ctx) => ctx.protocol,
};

const resolveToken = (token: string, ctx: EvalCtx): string => {
  // Exact match
  const exact = exactResolvers[token];
  if (exact) return sanitizeSegment(exact(ctx));

  // referrer.query.xxx format
  if (token.startsWith("referrer.query.")) {
    const key = token.slice(15);
    return sanitizeSegment(ctx.referrerQuery?.[key] ?? "");
  }

  // referrer.host
  if (token === "referrer.host") {
    return sanitizeSegment(ctx.referrerHost ?? "");
  }

  // query.xxx format
  if (token.startsWith("query.")) {
    const key = token.slice(6);
    // Prioritize download URL query, fallback to referrer query if not found
    const value = ctx.query[key] ?? ctx.referrerQuery?.[key] ?? "";
    return sanitizeSegment(value);
  }

  // path[N] format
  const pathMatch = token.match(/^path\[(\d+)\]$/);
  if (pathMatch) {
    const idx = Number(pathMatch[1]);
    return sanitizeSegment(ctx.pathSegments[idx] ?? "");
  }

  // Unknown tokens return empty string
  return "";
};

export const expandTemplate = (tpl: string, ctx: EvalCtx): string => {
  // Resolve `{token}` in order
  const expanded = tpl.replace(/\{([^}]+)\}/g, (_, token: string) => {
    return resolveToken(token, ctx);
  });

  return expanded;
};
