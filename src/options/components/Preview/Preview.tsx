import { Link2, FileText, Wand2, FolderOutput } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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
      { token: "{host}", desc: "Domain name (e.g., example.com)" },
      { token: "{file}", desc: "Full filename with extension" },
      { token: "{basename}", desc: "Filename without extension" },
      { token: "{ext}", desc: "File extension (e.g., pdf)" },
    ],
  },
  {
    title: "Date & Time",
    tokens: [
      { token: "{yyyy-mm-dd}", desc: "Current date (e.g., 2026-01-06)" },
      { token: "{yyyy}", desc: "Year (e.g., 2026)" },
      { token: "{mm}", desc: "Month (e.g., 01)" },
      { token: "{dd}", desc: "Day (e.g., 06)" },
    ],
  },
  {
    title: "URL Parts",
    tokens: [
      { token: "{path[0]}", desc: "First path segment" },
      { token: "{path[1]}", desc: "Second path segment" },
      { token: "{query.foo}", desc: "Query parameter value (foo)" },
      { token: "{referrer.host}", desc: "Referrer domain" },
      { token: "{referrer.query.bar}", desc: "Referrer query parameter (bar)" },
    ],
  },
];

export const RulePreviewCard = () => {
  const [testUrl, setTestUrl] = useState("");
  const [previewCtx, setPreviewCtx] = useState<EvalCtx | null>(null);
  const [matchedRule, setMatchedRule] = useState<Rule | null>(null);
  const [savePath, setSavePath] = useState<string | null>(null);
  const { rules } = useRules();

  // Update preview when rule or test URL changes
  useEffect(() => {
    const updatePreview = () => {
      try {
        logger.debug("Test URL changed:", testUrl);

        // Validate URL before processing
        if (!testUrl || testUrl.trim() === "") {
          logger.debug("Empty URL, showing default preview");
          setPreviewCtx(null);
          setMatchedRule(null);
          setSavePath("{file}");
          return;
        }

        // Check if URL is valid
        try {
          new URL(testUrl);
        } catch (e) {
          logger.debug("Invalid URL format, skipping preview update");
          logger.error(e);
          // Don't clear the preview, just skip the update
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
    <Accordion type="single" collapsible defaultValue="preview">
      <AccordionItem value="preview" className="border-none">
        {/* Make entire card triggerable */}
        <Card className="bg-stone-50/70 dark:bg-slate-800/50 shadow-inner border-stone-200 dark:border-slate-700 pb-0 pt-2">
          <AccordionTrigger className="hover:no-underline pr-6 cursor-pointer">
            <CardHeader className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                  Preview
                </CardTitle>
              </div>
            </CardHeader>
          </AccordionTrigger>

          <AccordionContent className="p-0">
            <CardContent className="space-y-4 text-sm pt-0 pb-4">
              {/* Section A: Input */}
              <section className="space-y-3">
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 mt-0.5 text-stone-500 dark:text-stone-400" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      Test URL
                    </div>
                    <Input
                      value={testUrl}
                      onChange={(e) => {
                        setTestUrl(e.target.value);
                      }}
                      placeholder="https://file-examples.com/storage/fe8f4c5/file-example_DOCX_500kB.docx"
                      className="h-9 bg-white/70 dark:bg-slate-700"
                    />
                    <div className="text-[11px] text-stone-400 dark:text-stone-500">
                      Paste any URL to preview the matched rule and output path.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-stone-500 dark:text-stone-400" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">
                      Inferred file name (fallback to URL tail)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {previewCtx?.file}
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                      ⓘ Actual downloads may use a different filename provided
                      by the server.
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-stone-200 dark:border-slate-700" />

              {/* Section B: Matched rule */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    Matched rule
                  </div>
                </div>

                {matchedRule ? (
                  <Badge className="bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-slate-700">
                    {matchedRule.name}
                  </Badge>
                ) : (
                  <div className="text-stone-500 dark:text-stone-400">None</div>
                )}
                <div className="rounded-md bg-stone-100 dark:bg-slate-700 border border-stone-200 dark:border-slate-600 px-3 py-2 font-mono text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                  {matchedRule?.actions.pathTemplate}
                </div>
              </section>

              <hr className="border-stone-200 dark:border-slate-700" />

              {/* Section C: Final path */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderOutput className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    Final path
                  </div>
                </div>

                {savePath ? (
                  <>
                    <div className="rounded-md bg-stone-900 dark:bg-slate-950 text-stone-50 dark:text-stone-100 px-3 py-2 font-mono text-xs break-all">
                      <span className="text-stone-400 dark:text-stone-500">
                        Downloads/
                      </span>
                      {savePath}
                    </div>
                    <div className="text-[11px] text-stone-400 dark:text-stone-500">
                      ⓘ Actual downloads may use a different filename provided
                      by the server.
                    </div>
                  </>
                ) : (
                  <div className="text-stone-500 dark:text-stone-400">—</div>
                )}
              </section>

              {/* Section D: Tokens help */}
              <Accordion type="single" collapsible className="pt-1">
                <AccordionItem value="tokens">
                  <AccordionTrigger className="text-xs text-stone-600 dark:text-stone-300">
                    Available tokens
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-slate-700 border border-stone-200 dark:border-slate-600 rounded px-2 py-1.5">
                        💡 All tokens are automatically sanitized to remove
                        invalid filename characters.
                      </div>
                      {tokenCategories.map((category) => (
                        <div key={category.title}>
                          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                            {category.title}
                          </div>
                          <div className="space-y-1">
                            {category.tokens.map((item) => (
                              <div
                                key={item.token}
                                className="flex items-baseline gap-2"
                              >
                                <code className="text-xs font-mono text-blue-600 dark:text-teal-400 bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {item.token}
                                </code>
                                <span className="text-xs text-stone-600 dark:text-stone-400">
                                  {item.desc}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
};
