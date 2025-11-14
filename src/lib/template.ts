import type { EvalCtx } from "@/lib/rule-engine";
import { sanitizeSegment } from "@/lib/sanitize";


export type ExpandOptions = {
  sanitizeSegments?: boolean;
}

type ExactResolver = (ctx: EvalCtx) => string;

const pad = (n: number) => String(n).padStart(2, "0")
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
    ymd: `${yyyy}-${mm}-${dd}` 
  };
};

const exactResolvers: Record<string, ExactResolver> = {
  // date
  yyyy: (ctx) => dateTokens(ctx.now).yyyy,
  yy:   (ctx) => dateTokens(ctx.now).yy,
  mm:   (ctx) => dateTokens(ctx.now).mm,
  dd:   (ctx) => dateTokens(ctx.now).dd,
  hh:   (ctx) => dateTokens(ctx.now).hh,
  min:  (ctx) => dateTokens(ctx.now).min,
  ss:   (ctx) => dateTokens(ctx.now).ss,
  "yyyy-mm-dd": (ctx) => dateTokens(ctx.now).ymd,

  // primitives
  host:     (ctx) => ctx.host,
  path:     (ctx) => ctx.pathSegments.join("/"),
  file:     (ctx) => ctx.file,
  basename: (ctx) => ctx.basename,
  ext:      (ctx) => ctx.ext,
  protocol: (ctx) => ctx.protocol,
};

const resolveToken = (token: string, ctx: EvalCtx, opts: ExpandOptions): string => {
  
  // 固定
  const exact = exactResolvers[token];
  if (exact) return opts.sanitizeSegments ? sanitizeSegment(exact(ctx)) : exact(ctx);

  // 未知トークンは空文字
  return "";
};

export const expandTemplate = (
  tpl: string,
  ctx: EvalCtx,
  opts: ExpandOptions = {}
): string => {
  const { sanitizeSegments = true } = {
    sanitizeSegments: true,
    ...opts,
  };

  // `{token}` を順に解決
  let expanded = tpl.replace(/\{([^}]+)\}/g, (_, token: string) => {
    return resolveToken(token, ctx, { sanitizeSegments });
  });

  return expanded;
};