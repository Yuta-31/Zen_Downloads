import { Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { DragControls, motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRulesDispatch } from "@/options/hooks/useRules";
import { generateFilename, type FileMetadata } from "@/lib/smartRename";
import { SMART_RENAME_VARIABLE_CHIPS } from "@/lib/constants/tokens";
import type { Rule } from "@/schemas/rules";
import SmartRenameEditor from "./SmartRenameEditor";
import type { ConflictAction } from "@/schemas/rules";
import { ConditionEditor } from "./ConditionEditor";
import type { Rule, UnifiedCondition, ConflictAction } from "@/schemas/rules";

const MotionCard = motion(Card);

// Helper to display conditions in a readable format
const formatConditionSummary = (rule: Rule): string => {
  const conditions = rule.unifiedConditions || [];

  // Fallback to legacy domains if no unified conditions
  if (conditions.length === 0 && rule.domains && rule.domains.length > 0) {
    return rule.domains.join(", ");
  }

  if (conditions.length === 0) {
    return "*";
  }

  return (
    conditions
      .slice(0, 2) // Show max 2 conditions in summary
      .map((c) => {
        const value = Array.isArray(c.value) ? c.value.join(", ") : c.value;
        return `${c.conditionType}: ${value}`;
      })
      .join(" & ") +
    (conditions.length > 2 ? ` +${conditions.length - 2} more` : "")
  );
};

interface RuleListRowCardProps {
  rule: Rule;
  onClick: () => void;
  onDrag: DragControls;
  isOpen?: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragDisabled?: boolean;
}

interface RuleHeaderProps {
  rule: Rule;
  isOpen?: boolean;
  onClick: () => void;
  onDrag: DragControls;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragDisabled?: boolean;
}

interface RuleDetailsProps {
  rule: Rule;
}

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  label: string;
  className?: string;
}

const CARD_ANIM_MS = 600;
const DETAIL_ANIM_MS = 300;

const RuleListRowCard = ({
  rule,
  onClick,
  onDrag,
  isOpen = false,
  isDragging,
  onDragStart,
  onDragEnd,
  isDragDisabled = false,
}: RuleListRowCardProps) => {
  return (
    <MotionCard
      layout
      onClick={() => {
        console.log(`Clicked on rule: ${rule.name}`);
      }}
      className="bg-white dark:bg-zinc-900/50 border-stone-200 dark:border-zinc-800 cursor-pointer gap-0 p-0 w-full shadow-sm dark:shadow-none"
      transition={{
        layout: { duration: CARD_ANIM_MS / 1000, ease: "easeInOut" },
      }}
    >
      <RuleHeader
        rule={rule}
        isOpen={isOpen}
        onDrag={onDrag}
        onClick={onClick}
        isDragging={isDragging}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        isDragDisabled={isDragDisabled}
      />
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: DETAIL_ANIM_MS / 1000,
          ease: "easeInOut",
        }}
        className="overflow-hidden"
      >
        <RuleDetails rule={rule} />
      </motion.div>
    </MotionCard>
  );
};

const RuleHeader = ({
  rule,
  isOpen,
  onClick,
  onDrag,
  isDragging,
  onDragStart,
  onDragEnd,
  isDragDisabled = false,
}: RuleHeaderProps) => {
  const { toggleEnable, removeRule } = useRulesDispatch();
  return (
    <div
      className={[
        "pr-4 transition-all duration-150 ease-in-out",
        "grid grid-cols-[auto_1fr]",
      ].join(" ")}
    >
      <motion.div
        className={[
          "w-full h-full",
          "flex items-center justify-center",
          "transition-all duration-150 ease-in-out",
          "rounded-l-xl",
          "border-r border-stone-200 dark:border-zinc-800",
          isDragging
            ? "translate-y-0 shadow-inner border-b-[0px]"
            : "hover:shadow-md hover:border-b-[2px]",
          isOpen || isDragDisabled
            ? "pointer-events-none cursor-default"
            : "pointer-events-auto cursor-grab",
        ].join(" ")}
        animate={{
          width: isOpen || isDragDisabled ? 0 : 35,
          opacity: isOpen || isDragDisabled ? 0 : 1,
        }}
        transition={{
          width: { duration: 0.2, ease: "easeInOut" },
          opacity: { duration: 0.12, ease: "easeOut" },
        }}
        onPointerDown={(e) => {
          if (isDragDisabled) return;
          e.preventDefault();
          onDrag.start(e);
          onDragStart();
        }}
        onPointerUp={() => {
          onDragEnd();
        }}
      >
        <GripVertical className="text-stone-400 dark:text-zinc-600" size="24" />
      </motion.div>

      <div
        className={"flex justify-between items-center py-5 ms-2"}
        onClick={onClick}
      >
        <div className="flex-1 ml-2">
          <div className="text-lg font-medium text-stone-800 dark:text-zinc-100">
            {rule.name}
          </div>
          {!isOpen && (
            <div className="text-xs text-stone-500 dark:text-zinc-500 mt-1 space-y-0.5">
              <span className="font-mono">
                {rule.domains.join(", ")} → {rule.actions.pathTemplate}
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 space-y-0.5">
              <span className="font-medium">
                {formatConditionSummary(rule)} {"→"} {rule.actions.pathTemplate}
              </span>
              {rule.actions.renamePattern && (
                <span className="block text-teal-600 dark:text-teal-500/70">
                  ✦ {rule.actions.renamePattern}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 items-center flex-shrink-0">
          <Switch
            className="cursor-pointer data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-600"
            checked={rule.enabled}
            onCheckedChange={() => {
              toggleEnable(rule.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-stone-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the rule "{rule.name}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeRule(rule.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

const EditableField = ({
  value,
  onSave,
  label,
  className,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue.trim() !== "") {
      onSave(editValue);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div onClick={(e) => e.stopPropagation()} className="-ml-2">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-white dark:bg-zinc-950 border-stone-300 dark:border-zinc-700 rounded-md focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-auto min-h-0 px-2 py-1 text-stone-800 dark:text-zinc-100"
        />
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`group cursor-text hover:bg-stone-100 dark:hover:bg-zinc-800/50 px-2 py-1 rounded-md transition-colors -ml-2 border border-transparent flex items-center gap-1 ${className || ""}`}
      title={`Click to edit ${label}`}
    >
      <span className="flex-1 break-words text-stone-700 dark:text-zinc-200">
        {value}
      </span>
      <Pencil className="h-3 w-3 text-stone-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
};

const RuleDetails = ({ rule }: RuleDetailsProps) => {
  const { updateRule } = useRulesDispatch();
  const [showVariables, setShowVariables] = useState(false);
  const [renamePattern, setRenamePattern] = useState(
    rule.actions.renamePattern || "",
  );

  // Sync local state when rule changes
  useEffect(() => {
    setRenamePattern(rule.actions.renamePattern || "");
  }, [rule.actions.renamePattern]);

  // Live preview for rename pattern
  const preview = useMemo(() => {
    if (!renamePattern || renamePattern.trim() === "") return null;
    try {
      const metadata: FileMetadata = {
        date: new Date(),
        domain: rule.domains[0] || "example.com",
        originalName: "document.pdf",
      };
      return generateFilename(metadata, renamePattern);
    } catch {
      return "Invalid pattern";
    }
  }, [renamePattern, rule.domains]);

  // Initialize unified conditions from legacy domains if needed
  const initialConditions = useMemo((): UnifiedCondition[] => {
    if (rule.unifiedConditions && rule.unifiedConditions.length > 0) {
      return rule.unifiedConditions;
    }
    // Migrate from legacy domains
    if (rule.domains && rule.domains.length > 0) {
      return rule.domains.map((domain) => {
        const matchType = domain.includes("*") ? "glob" : "contains";
        return {
          conditionType: "domain" as const,
          matchType: matchType as "glob" | "contains",
          value: domain,
          caseSensitive: false,
        };
      });
    }
    return [
      {
        conditionType: "domain" as const,
        matchType: "contains" as const,
        value: "*",
        caseSensitive: false,
      },
    ];
  }, [rule.unifiedConditions, rule.domains]);

  const [conditions, setConditions] =
    useState<UnifiedCondition[]>(initialConditions);

  // Sync local state when rule changes
  useEffect(() => {
    setConditions(initialConditions);
  }, [initialConditions]);

  const handleUpdateName = (name: string) => {
    updateRule(rule.id, { name });
  };

  const handleUpdateConditions = (newConditions: UnifiedCondition[]) => {
    setConditions(newConditions);

    // Also update legacy domains for backward compatibility
    const domainConditions = newConditions.filter(
      (c) => c.conditionType === "domain",
    );
    const domains = domainConditions.map((c) =>
      Array.isArray(c.value) ? c.value[0] : c.value,
    );

    updateRule(rule.id, {
      unifiedConditions: newConditions,
      domains: domains.length > 0 ? domains : ["*"],
    });
  };

  const handleUpdatePathTemplate = (pathTemplate: string) => {
    updateRule(rule.id, {
      actions: { ...rule.actions, pathTemplate },
    });
  };

  const handleUpdateConflictAction = (value: string) => {
    const conflict = value === "global" ? undefined : (value as ConflictAction);
    updateRule(rule.id, {
      actions: { ...rule.actions, conflict },
    });
  };

  const handleUpdateRenamePattern = (pattern: string) => {
    setRenamePattern(pattern);
    updateRule(rule.id, {
      actions: {
        ...rule.actions,
        renamePattern: pattern || undefined,
      },
    });
  };

  const insertVariable = (token: string) => {
    const newValue = renamePattern ? `${renamePattern}${token}` : token;
    handleUpdateRenamePattern(newValue);
  };

  return (
    <div className="p-6 space-y-6 border-t border-stone-200 dark:border-zinc-800">
      {/* Rule Name */}
      <div>
        <EditableField
          value={rule.name}
          onSave={handleUpdateName}
          label="Rule Name"
          className="text-xl font-semibold text-stone-800 dark:text-zinc-100"
        />
      </div>

      {/* Domain */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          Domain Pattern
        </label>
        <div onClick={(e) => e.stopPropagation()}>
          <EditableField
            value={rule.domains.join(", ")}
            onSave={handleUpdateDomains}
            label="Domain"
          />
        </div>
      </div>

      {/* Grid Layout for Path Template and Filename Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Destination Folder */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
            Destination Folder
          </label>
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              value={rule.actions.pathTemplate}
              onChange={(e) => handleUpdatePathTemplate(e.target.value)}
              className="bg-white dark:bg-zinc-950 border-stone-300 dark:border-zinc-700 rounded-md text-stone-800 dark:text-zinc-100 font-mono text-sm focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500"
              placeholder="{host}/{ext}/{file}"
            />
          </div>
          <p className="text-[10px] text-stone-500 dark:text-zinc-600">
            Use variables like {"{host}"}, {"{ext}"}, {"{yyyy-mm-dd}"}
          </p>
        </div>

        {/* Right Column: Filename Pattern */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
            Filename Pattern
            <span className="text-stone-400 dark:text-zinc-600 normal-case tracking-normal ml-1">
              (optional)
            </span>
          </label>
          <div onClick={(e) => e.stopPropagation()}>
            <Input
              value={renamePattern}
              onChange={(e) => handleUpdateRenamePattern(e.target.value)}
              className="bg-white dark:bg-zinc-950 border-stone-300 dark:border-zinc-700 rounded-md text-stone-800 dark:text-zinc-100 font-mono text-sm focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500"
              placeholder="{year}-{month}_{original_name}"
            />
          </div>

          {/* Variable Chips */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowVariables(!showVariables);
              }}
              className="flex items-center gap-1 text-[10px] text-stone-500 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {showVariables ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              Available variables
            </button>

            <AnimatePresence>
              {showVariables && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex flex-wrap gap-1.5 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {SMART_RENAME_VARIABLE_CHIPS.map((v) => (
                      <button
                        key={v.token}
                        type="button"
                        onClick={() => insertVariable(v.token)}
                        className="bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 text-xs px-2 py-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer transition-colors font-mono"
                        title={v.desc}
                      >
                        {v.token}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Preview */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2 px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md"
              >
                <div className="text-[10px] text-stone-500 dark:text-zinc-600 mb-1">
                  Preview
                </div>
                <div className="font-mono text-sm text-teal-600 dark:text-teal-400/80 break-all">
                  {preview}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    <div className="p-6 space-y-5 border-t border-stone-200 dark:border-slate-600">
      {/* Rule Name */}
      <div className="mb-4">
        <EditableField
          value={rule.name}
          onSave={handleUpdateName}
          label="Rule Name"
          className="text-lg font-semibold text-stone-800 dark:text-stone-200"
        />
      </div>

      {/* Conditions Editor - Replaces Domain input */}
      <div onClick={(e) => e.stopPropagation()}>
        <ConditionEditor
          conditions={conditions}
          onChange={handleUpdateConditions}
        />
      </div>

      {/* Path Template */}
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <label className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Destination Folder
        </label>
        <Input
          value={rule.actions.pathTemplate}
          onChange={(e) => handleUpdatePathTemplate(e.target.value)}
          className="bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-600 font-mono text-sm"
          placeholder="{host}/{ext}/{file}"
        />
        <p className="text-[10px] text-stone-500 dark:text-stone-400">
          Use variables like {"{host}"}, {"{ext}"}, {"{yyyy-mm-dd}"}
        </p>
      </div>

      {/* Conflict Action */}
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <label className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          On Conflict
        </label>
        <Select
          value={rule.actions.conflict || "global"}
          onValueChange={handleUpdateConflictAction}
        >
          <SelectTrigger className="bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800">
            <SelectItem value="global">Use Global Default</SelectItem>
            <SelectItem value="uniquify">Uniquify (add numbers)</SelectItem>
            <SelectItem value="overwrite">Overwrite existing</SelectItem>
            <SelectItem value="prompt">Ask me each time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conflict Action */}
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          On Conflict
        </label>
        <Select
          value={rule.actions.conflict || "global"}
          onValueChange={handleUpdateConflictAction}
        >
          <SelectTrigger className="bg-white dark:bg-zinc-950 border-stone-300 dark:border-zinc-700 rounded-md text-stone-700 dark:text-zinc-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700">
            <SelectItem
              value="global"
              className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
            >
              Use Global Default
            </SelectItem>
            <SelectItem
              value="uniquify"
              className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
            >
              Uniquify (add numbers)
            </SelectItem>
            <SelectItem
              value="overwrite"
              className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
            >
              Overwrite existing
            </SelectItem>
            <SelectItem
              value="prompt"
              className="text-stone-700 dark:text-zinc-200 focus:bg-stone-100 dark:focus:bg-zinc-800"
            >
              Ask me each time
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditions (if any) */}
      {rule.conditions && rule.conditions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
            Conditions
          </label>
          <div className="text-sm text-stone-600 dark:text-zinc-400">
            {rule.conditions.length} condition
            {rule.conditions.length > 1 ? "s" : ""} configured
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleListRowCard;
