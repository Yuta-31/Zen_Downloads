import { Trash2, Pencil } from "lucide-react";
import { DragControls, motion } from "framer-motion";
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

const CARD_ANIM_MS = 300;
const DETAIL_ANIM_MS = 200;

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
      className="bg-stone-50/100 dark:bg-slate-700 cursor-pointer gap-0 p-0 w-full"
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
          "border-r border-stone-100 dark:border-slate-600",
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
        <GripVertical
          className="text-stone-400 dark:text-slate-500"
          size="30"
        />
      </motion.div>

      <div
        className={"flex justify-between items-center py-6 ms-2"}
        onClick={onClick}
      >
        <div className="flex-1 ml-2">
          <div className="text-xl font-bold text-stone-700 dark:text-stone-200">
            {rule.name}
          </div>
          {!isOpen && (
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 space-y-0.5">
              <span className="font-medium">
                {formatConditionSummary(rule)} {"→"} {rule.actions.pathTemplate}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center flex-shrink-0">
          <Switch
            className="cursor-pointer"
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
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
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

interface RuleDetailsProps {
  rule: Rule;
}

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  label: string;
  className?: string;
}

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
          className={`h-auto min-h-0 px-2 py-1 border-stone-300 focus-visible:ring-1 ${className || "text-sm"}`}
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
      className={`group cursor-text hover:bg-stone-100 dark:hover:bg-slate-600 px-2 py-1 rounded transition-colors -ml-2 border border-transparent flex items-center gap-1 ${className || ""}`}
      title={`Click to edit ${label}`}
    >
      <span className="flex-1 break-words">{value}</span>
      <Pencil className="h-3 w-3 text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
};

const RuleDetails = ({ rule }: RuleDetailsProps) => {
  const { updateRule } = useRulesDispatch();

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

  return (
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
    </div>
  );
};

export default RuleListRowCard;
