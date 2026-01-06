import { buildCtx } from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/rules/template";
import type { Rule } from "@/schemas/rules";
import { createLogger } from "@/background/lib/logger";

const logger = createLogger("[PathBuilder]");

export interface PathContext {
  urlStr: string;
  filename: string;
  referrer: string | undefined;
}

/**
 * Build the download path based on the rule template
 * @param rule The matched rule
 * @param context The download context
 * @returns The computed file path
 */
export const buildDownloadPath = (rule: Rule, context: PathContext): string => {
  logger.info("Path template:", rule.actions.pathTemplate);

  const ctx = buildCtx(context.urlStr, context.filename, context.referrer);
  const tpl = rule.actions.pathTemplate ?? "{host}/{file}";
  let newPath = expandTemplate(tpl, ctx);

  // Normalize path: convert backslashes to forward slashes
  newPath = newPath.replace(/\\/g, "/");

  logger.info("Final path:", newPath);

  return newPath;
};
