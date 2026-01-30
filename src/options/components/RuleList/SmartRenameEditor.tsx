import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateFilename, type FileMetadata } from "@/lib/smartRename";
import { SMART_RENAME_VARIABLES } from "@/lib/constants/tokens";

interface SmartRenameEditorProps {
  value: string;
  onChange: (value: string) => void;
  domain?: string;
}

const SmartRenameEditor = ({
  value,
  onChange,
  domain = "example.com",
}: SmartRenameEditorProps) => {
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);

  // Create dummy metadata for live preview
  const dummyMetadata: FileMetadata = useMemo(
    () => ({
      date: new Date(),
      domain: domain,
      originalName: "example_document.pdf",
    }),
    [domain],
  );

  // Generate live preview
  const preview = useMemo(() => {
    if (!value || value.trim() === "") {
      return null;
    }
    try {
      return generateFilename(dummyMetadata, value);
    } catch {
      return "Invalid pattern";
    }
  }, [value, dummyMetadata]);

  // Insert variable at cursor position (or append if no input ref)
  const insertVariable = (token: string) => {
    const newValue = value ? `${value}${token}` : token;
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {/* Input Field */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Filename Pattern
          </label>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            (optional)
          </span>
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. {year}-{month}_{original_name}"
          className="font-mono text-sm"
        />
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Rename downloaded files using variables. Leave empty to keep original
          filename.
        </p>
      </div>

      {/* Live Preview */}
      {preview && (
        <div className="rounded-md border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
              Live Preview
            </div>
          </div>
          <div className="font-mono text-sm text-teal-800 dark:text-teal-300 break-all">
            {preview}
          </div>
          <div className="text-[10px] text-teal-600 dark:text-teal-500">
            Using: "{dummyMetadata.originalName}" from {dummyMetadata.domain}
          </div>
        </div>
      )}

      {/* Variable Cheat Sheet Toggle */}
      <div className="border border-stone-200 dark:border-slate-700 rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => setIsCheatSheetOpen(!isCheatSheetOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" />
            Available Variables
          </div>
          {isCheatSheetOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Collapsible Variable List */}
        {isCheatSheetOpen && (
          <div className="border-t border-stone-200 dark:border-slate-700 p-3 space-y-4 bg-stone-50 dark:bg-slate-800/50">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Click a variable to insert it into the pattern.
            </p>
            {SMART_RENAME_VARIABLES.map((category) => (
              <div key={category.title} className="space-y-2">
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  {category.title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {category.variables.map((variable) => (
                    <Button
                      key={variable.token}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.token)}
                      className="h-auto py-1 px-2 font-mono text-xs hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 dark:hover:bg-teal-950 dark:hover:border-teal-700 dark:hover:text-teal-400 transition-colors group"
                      title={`${variable.desc} (e.g., ${variable.example})`}
                    >
                      <span>{variable.token}</span>
                    </Button>
                  ))}
                </div>
                {/* Show descriptions on hover or as a subtle list */}
                <div className="grid grid-cols-1 gap-0.5 text-[10px] text-stone-400 dark:text-stone-500">
                  {category.variables.map((variable) => (
                    <div
                      key={variable.token}
                      className="flex items-baseline gap-2"
                    >
                      <code className="text-stone-500 dark:text-stone-400">
                        {variable.token}
                      </code>
                      <span>→ {variable.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Extension Auto-Correction Notice */}
            <div className="text-xs text-stone-600 dark:text-stone-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1.5">
              💡 <strong>Tip:</strong> If you forget to include the file
              extension, it will be automatically appended. For example,{" "}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">
                my_file_{"{year}"}
              </code>{" "}
              becomes{" "}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">
                my_file_2026.pdf
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRenameEditor;
