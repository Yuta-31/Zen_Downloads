import { Link2, FileText, Wand2, FolderOutput } from "lucide-react";
import { useState } from "react";
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
import type { Rule, RulesConfig } from "@/schemas/rules";

type PreviewProps = {
  cfg: RulesConfig;
};

const tokensHelp =
  "{host} {file} {basename} {ext} {yyyy-mm-dd} {path[0]} {path[1..3]} {lower:ext} {sanitize:file} / query.foo";

export const RulePreviewCard = ({ cfg }: PreviewProps) => {
  const [testUrl, setTestUrl] = useState(
    "https://file-examples.com/storage/fe8f4c5/file-example_DOCX_500kB.docx"
  );
  const [previewCtx, setPreviewCtx] = useState<EvalCtx | null>(null);
  const [matchedRule, setMatchedRule] = useState<Rule | null>(null);
  const [savePath, setSavePath] = useState<string | null>(null);

  return (
    <Accordion type="single" collapsible defaultValue="preview">
      <AccordionItem value="preview" className="border-none">
        {/* Card全体をトリガー化 */}
        <Card className="bg-stone-50/70 shadow-inner border-stone-200 pb-0 pt-2">
          <AccordionTrigger className="hover:no-underline pr-6 cursor-pointer">
            <CardHeader className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-stone-700">
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
                  <Link2 className="w-4 h-4 mt-0.5 text-stone-500" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs text-stone-500">Test URL</div>
                    <Input
                      value={testUrl}
                      onChange={(e) => {
                        const _ctx = buildCtx(e.target.value);
                        const _matchedRule = cfg.rules
                          .filter((rule) => rule.enabled)
                          .find(
                            (rule) =>
                              isInDomain(rule.domains, _ctx.host) &&
                              matchAll(rule.conditions, _ctx)
                          );
                        const _savePath = expandTemplate(
                          matchedRule?.actions.pathTemplate ?? "",
                          _ctx
                        );
                        setTestUrl(e.target.value);
                        setPreviewCtx(_ctx);
                        setMatchedRule(_matchedRule ?? null);
                        setSavePath(_savePath);
                      }}
                      placeholder="https://example.com/file.docx"
                      className="h-9 bg-white/70"
                    />
                    <div className="text-[11px] text-stone-400">
                      Paste any URL to preview the matched rule and output path.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-stone-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-stone-500 mb-0.5">
                      Inferred file name (fallback to URL tail)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-stone-900 truncate">
                        {previewCtx?.file}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-stone-200" />

              {/* Section B: Matched rule */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-stone-500" />
                  <div className="text-xs text-stone-500">Matched rule</div>
                </div>

                {matchedRule ? (
                  <Badge className="bg-stone-200 text-stone-800 hover:bg-stone-200">
                    {matchedRule.name}
                  </Badge>
                ) : (
                  <div className="text-stone-500">None</div>
                )}
                <div className="rounded-md bg-stone-100 border border-stone-200 px-3 py-2 font-mono text-xs text-stone-800 whitespace-pre-wrap">
                  {matchedRule?.actions.pathTemplate}
                </div>
              </section>

              <hr className="border-stone-200" />

              {/* Section C: Final path */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderOutput className="w-4 h-4 text-stone-500" />
                  <div className="text-xs text-stone-500">Final path</div>
                </div>

                {savePath ? (
                  <div className="rounded-md bg-stone-900 text-stone-50 px-3 py-2 font-mono text-xs break-all">
                    {savePath}
                  </div>
                ) : (
                  <div className="text-stone-500">—</div>
                )}
              </section>

              {/* Section D: Tokens help */}
              {tokensHelp && (
                <Accordion type="single" collapsible className="pt-1">
                  <AccordionItem value="tokens">
                    <AccordionTrigger className="text-xs text-stone-600">
                      Available tokens
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="rounded-md bg-stone-100 border border-stone-200 px-3 py-2 font-mono text-xs text-stone-800 whitespace-pre-wrap">
                        {tokensHelp}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
};
