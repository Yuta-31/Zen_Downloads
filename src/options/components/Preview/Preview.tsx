import {
  Link2,
  FileText,
  Wand2,
  FolderOutput,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildCtx,
  isInDomain,
  matchAll,
  type EvalCtx,
} from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/rules/template";
import { useRules } from "@/options/hooks/useRules";
import { createLogger } from "@/options/lib/logger";
import type { Rule } from "@/schemas/rules";

const logger = createLogger("[Preview]");

const tokenCategories = [
  {
    title: "Basic",
    tokens: [
      { token: "{host}", desc: "Domain name" },
      { token: "{file}", desc: "Full filename" },
      { token: "{basename}", desc: "Without extension" },
      { token: "{ext}", desc: "Extension only" },
    ],
  },
  {
    title: "Date",
    tokens: [
      { token: "{yyyy-mm-dd}", desc: "Full date" },
      { token: "{yyyy}", desc: "Year" },
      { token: "{mm}", desc: "Month" },
      { token: "{dd}", desc: "Day" },
    ],
  },
  {
    title: "URL",
    tokens: [
      { token: "{path[0]}", desc: "First path" },
      { token: "{query.foo}", desc: "Query param" },
    ],
  },
];

export const RulePreviewCard = () => {
  const [testUrl, setTestUrl] = useState("");
  const [previewCtx, setPreviewCtx] = useState<EvalCtx | null>(null);
  const [matchedRule, setMatchedRule] = useState<Rule | null>(null);
  const [savePath, setSavePath] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const { rules } = useRules();

  // Update preview when rule or test URL changes
  useEffect(() => {
    const updatePreview = () => {
      try {
        logger.debug("Test URL changed:", testUrl);

        if (!testUrl || testUrl.trim() === "") {
          logger.debug("Empty URL, showing default preview");
          setPreviewCtx(null);
          setMatchedRule(null);
          setSavePath("{file}");
          return;
        }

        try {
          new URL(testUrl);
        } catch (e) {
          logger.debug("Invalid URL format, skipping preview update");
          logger.error(e);
          return;
        }

        const _ctx = buildCtx(testUrl);
        logger.debug("Built context:", {
          host: _ctx.host,
          file: _ctx.file,
          ext: _ctx.ext,
          basename: _ctx.basename,
        });

        const enabledRules = rules.filter((rule) => rule.enabled);
        logger.debug(`Evaluating ${enabledRules.length} enabled rules`);

        const _matchedRule = enabledRules.find((rule) => {
          const domainMatch = isInDomain(
            rule.domains,
            _ctx.host,
            _ctx.referrerHost,
          );
          const condMatch = matchAll(rule.conditions, _ctx);

          if (domainMatch && condMatch) {
            logger.info(`Rule matched: "${rule.name}"`);
            return true;
          }
          return false;
        });

        if (!_matchedRule) {
          logger.warn("No rules matched for URL:", testUrl);
        }

        const _savePath = _matchedRule
          ? expandTemplate(_matchedRule.actions.pathTemplate, _ctx)
          : _ctx.file;

        if (_savePath) {
          logger.debug("Generated save path:", _savePath);
        }

        setPreviewCtx(_ctx);
        setMatchedRule(_matchedRule ?? null);
        setSavePath(_savePath);
      } catch (error) {
        logger.error("Failed to update preview:", error);
      }
    };

    updatePreview();
  }, [testUrl, rules]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-800 dark:text-zinc-100">
          Preview
        </h2>
        <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">
          Test your rules with any URL
        </p>
      </div>

      <Card className="bg-white dark:bg-zinc-900/50 border-stone-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none">
        <div className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" />
              Test URL
            </label>
            <Input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com/files/document.pdf"
              className="bg-white dark:bg-zinc-950 border-stone-300 dark:border-zinc-700 rounded-md text-stone-800 dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500"
            />
          </div>

          {/* Inferred File */}
          {previewCtx && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Detected File
              </label>
              <div className="font-mono text-sm text-stone-700 dark:text-zinc-300">
                {previewCtx.file}
              </div>
            </div>
          )}

          {/* Matched Rule */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5" />
              Matched Rule
            </label>
            {matchedRule ? (
              <span className="inline-block bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 text-xs px-2.5 py-1 rounded-full border border-teal-300 dark:border-teal-800">
                {matchedRule.name}
              </span>
            ) : (
              <span className="text-stone-400 dark:text-zinc-600 text-sm">
                No match
              </span>
            )}
          </div>

          {/* Save Path */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <FolderOutput className="w-3.5 h-3.5" />
              Output Path
            </label>
            <div className="px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md">
              <div className="font-mono text-sm text-teal-600 dark:text-teal-400/80 break-all">
                Downloads/{savePath || "{file}"}
              </div>
            </div>
          </div>

          {/* Token Reference */}
          <div className="border-t border-stone-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors w-full"
            >
              {showTokens ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Available template tokens
            </button>

            <AnimatePresence>
              {showTokens && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-4">
                    {tokenCategories.map((category) => (
                      <div key={category.title}>
                        <div className="text-[10px] font-medium text-stone-500 dark:text-zinc-600 uppercase tracking-wider mb-2">
                          {category.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {category.tokens.map((t) => (
                            <span
                              key={t.token}
                              className="bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 text-xs px-2 py-1 rounded font-mono"
                              title={t.desc}
                            >
                              {t.token}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </div>
  );
};
