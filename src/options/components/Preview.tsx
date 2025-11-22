import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Link2, FileText, Wand2, FolderOutput } from "lucide-react";

type PreviewProps = {
  /** user-editable */
  testUrl: string;
  onTestUrlChange: (url: string) => void;

  /** computed elsewhere */
  inferredFilename: string;
  matchedRuleName?: string;
  saveTemplate?: string;
  finalPath?: string;
  tokensHelp?: string;
};

export function RulePreviewCard({
  testUrl,
  onTestUrlChange,
  inferredFilename,
  matchedRuleName,
  saveTemplate,
  finalPath,
  tokensHelp,
}: PreviewProps) {
  const ext = inferredFilename.split(".").pop()?.toUpperCase() ?? "";

  return (
    <Accordion type="single" collapsible defaultValue="preview">
      <AccordionItem value="preview" className="border-none">
        {/* Card全体をトリガー化 */}
        <Card className="bg-stone-50/70 shadow-inner border-stone-200">
          <AccordionTrigger className="hover:no-underline p-0">
            <CardHeader className="w-full py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-stone-700">
                  Preview
                </CardTitle>

                {/* 右側に状態サマリを出しておくと便利（任意） */}
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  {matchedRuleName ? (
                    <Badge variant="secondary" className="text-[10px] px-2">
                      {matchedRuleName}
                    </Badge>
                  ) : (
                    <span>No rule matched</span>
                  )}
                </div>
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
                      onChange={(e) => onTestUrlChange(e.target.value)}
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
                        {inferredFilename}
                      </div>
                      {ext && (
                        <Badge variant="secondary" className="text-[10px]">
                          {ext}
                        </Badge>
                      )}
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

                {matchedRuleName ? (
                  <Badge className="bg-stone-200 text-stone-800 hover:bg-stone-200">
                    {matchedRuleName}
                  </Badge>
                ) : (
                  <div className="text-stone-500">None</div>
                )}

                {saveTemplate && (
                  <div className="rounded-md bg-stone-100 border border-stone-200 px-3 py-2 font-mono text-xs text-stone-800 whitespace-pre-wrap">
                    {saveTemplate}
                  </div>
                )}
              </section>

              <hr className="border-stone-200" />

              {/* Section C: Final path */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderOutput className="w-4 h-4 text-stone-500" />
                  <div className="text-xs text-stone-500">Final path</div>
                </div>

                {finalPath ? (
                  <div className="rounded-md bg-stone-900 text-stone-50 px-3 py-2 font-mono text-xs break-all">
                    {finalPath}
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
}
