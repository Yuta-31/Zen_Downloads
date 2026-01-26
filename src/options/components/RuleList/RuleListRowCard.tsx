import { Trash2, Pencil } from "lucide-react";
import { DragControls, motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useEffect, useState, useRef } from "react";
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
import type { Rule } from "@/schemas/rules";
import type { ConflictAction } from "@/schemas/rules";

const MotionCard = motion(Card);

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
                {rule.domains.join(", ")} {">"} {rule.actions.pathTemplate}
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

  const handleUpdateName = (name: string) => {
    updateRule(rule.id, { name });
  };

  const handleUpdateDomains = (domainsStr: string) => {
    const domains = domainsStr
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d !== "");
    if (domains.length > 0) {
      updateRule(rule.id, { domains });
    }
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
    <div className="p-6 space-y-4">
      <div className="flex-1">
        <div className="mb-4">
          <EditableField
            value={rule.name}
            onSave={handleUpdateName}
            label="Rule Name"
            className="text-lg font-semibold text-stone-800 dark:text-stone-200"
          />
        </div>
        <div className="space-y-3 text-sm text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold whitespace-nowrap w-20">
              Domain:
            </span>
            <div className="flex-1">
              <EditableField
                value={rule.domains.join(", ")}
                onSave={handleUpdateDomains}
                label="Domain"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold whitespace-nowrap w-20">
              Save to:
            </span>
            <div className="flex-1">
              <EditableField
                value={rule.actions.pathTemplate}
                onSave={handleUpdatePathTemplate}
                label="Path Template"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold whitespace-nowrap w-20">
              On Conflict:
            </span>
            <div className="flex-1">
              <Select
                value={rule.actions.conflict || "global"}
                onValueChange={handleUpdateConflictAction}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Use Global Default</SelectItem>
                  <SelectItem value="uniquify">Uniquify</SelectItem>
                  <SelectItem value="overwrite">Overwrite</SelectItem>
                  <SelectItem value="prompt">Prompt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {rule.conditions && rule.conditions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold whitespace-nowrap w-20">
                Conditions:
              </span>
              <span>{rule.conditions.length} rules</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleListRowCard;
