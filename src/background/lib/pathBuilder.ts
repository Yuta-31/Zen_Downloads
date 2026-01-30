import { buildCtx } from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/rules/template";
import { generateFilename, type FileMetadata } from "@/lib/smartRename";
import { createLogger } from "@/background/lib/logger";
import type { Rule } from "@/schemas/rules";

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

  // Determine the final filename
  let finalFilename = ctx.file;

  // Apply smart rename pattern if specified
  if (rule.actions.renamePattern) {
    logger.info("Rename pattern:", rule.actions.renamePattern);
    const metadata: FileMetadata = {
      date: ctx.now,
      domain: ctx.host,
      originalName: context.filename,
    };
    finalFilename = generateFilename(metadata, rule.actions.renamePattern);
    logger.info("Renamed filename:", finalFilename);
  }

  // Expand the path template with original context
  let newPath = expandTemplate(tpl, ctx);

  // If we have a rename pattern, replace the filename in the path
  if (rule.actions.renamePattern && finalFilename !== ctx.file) {
    // Find and replace the original filename with the renamed one
    const lastSlashIndex = newPath.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const pathEnd = newPath.substring(lastSlashIndex + 1);
      if (pathEnd === ctx.file) {
        newPath = newPath.substring(0, lastSlashIndex + 1) + finalFilename;
      }
    } else if (newPath === ctx.file) {
      newPath = finalFilename;
    }
  }

  // Normalize path: convert backslashes to forward slashes
  newPath = newPath.replace(/\\/g, "/");

  logger.info("Final path:", newPath);

  return newPath;
};
