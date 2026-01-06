import { buildCtx, isInDomain, matchAll } from "@/lib/rules/engine";
import { getRulesSnapshot } from "@/background/lib/cache";
import { createLogger } from "@/background/lib/logger";
import type { Rule } from "@/schemas/rules";

const logger = createLogger("[RuleMatcher]");

export interface MatchContext {
  urlStr: string;
  filename: string;
  referrer: string | undefined;
}

/**
 * Find a matching rule for the given download context
 * @returns The matched rule, or undefined if no rule matches
 */
export const findMatchingRule = (context: MatchContext): Rule | undefined => {
  const ctx = buildCtx(context.urlStr, context.filename, context.referrer);

  logger.log("Download URL domain:", ctx.host);
  logger.log("Referrer domain:", ctx.referrerHost || "(none)");

  const rules = getRulesSnapshot();
  if (!rules) {
    logger.warn("No rules available");
    return undefined;
  }

  const enabled = rules.filter((r) => r.enabled);
  const rule = enabled.find(
    (r) =>
      isInDomain(r.domains, ctx.host, ctx.referrerHost) &&
      matchAll(r.conditions, ctx)
  );

  if (rule) {
    logger.info("Matched Rule name:", rule.name);
    logger.info("Matched Rule ID:", rule.id);
    logger.info("Matched Rule domains:", rule.domains.join(", "));
  } else {
    logger.log("No Rule Matched");
  }

  return rule;
};
