import { buildCtx, matchRule } from "@/lib/rules/engine";
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
  logger.log("Filename:", ctx.file);
  logger.log("Extension:", ctx.ext);

  const rules = getRulesSnapshot();
  if (!rules) {
    logger.warn("No rules available");
    return undefined;
  }

  const enabled = rules.filter((r) => r.enabled);

  // Find first matching rule using the new unified matching
  const rule = enabled.find((r) => matchRule(r, ctx));

  if (rule) {
    logger.info("Matched Rule name:", rule.name);
    logger.info("Matched Rule ID:", rule.id);

    // Log matched conditions
    if (rule.unifiedConditions && rule.unifiedConditions.length > 0) {
      logger.info(
        "Matched via unified conditions:",
        rule.unifiedConditions
          .map((c) => `${c.conditionType}:${c.matchType}`)
          .join(", "),
      );
    } else {
      logger.info("Matched Rule domains:", rule.domains?.join(", ") || "*");
    }
  } else {
    logger.log("No Rule Matched");
  }

  return rule;
};
