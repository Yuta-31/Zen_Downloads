import { ChevronRight, Trash2 } from "lucide-react";
import { DragControls, motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRulesDispatch } from "@/options/hooks/useRules";
import type { Rule } from "@/schemas/rules";

const MotionCard = motion(Card);

interface RuleListRowCardProps {
  rule: Rule;
  onClick: () => void;
  onDrag: DragControls;
  isOpen?: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const CARD_ANIM_MS = 300;
const DETAIL_ANIM_MS = 200;

const RuleListRowCard = ({
  rule,
  onClick,
  onDrag,
  isOpen,
  isDragging,
  onDragStart,
  onDragEnd,
}: RuleListRowCardProps) => {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    if (isOpen) {
      setIsCardOpen(true);
      timer = window.setTimeout(() => {
        setIsDetailsOpen(true);
      }, CARD_ANIM_MS);
    } else {
      setIsDetailsOpen(false);
      timer = window.setTimeout(() => {
        setIsCardOpen(false);
      }, DETAIL_ANIM_MS);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isOpen]);

  return (
    <MotionCard
      layout
      onClick={() => {
        console.log(`Clicked on rule: ${rule.name}`);
      }}
      className={[
        "bg-stone-50/100 cursor-pointer gap-0 p-0",
        isCardOpen
          ? "fixed inset-x-4 top-16 z-50 mx-auto max-w-3xl shadow-lg flex flex-col overflow-hidden z-50"
          : "w-full",
      ].join(" ")}
      transition={{
        layout: { duration: CARD_ANIM_MS / 1000, ease: "easeInOut" },
      }}
    >
      <RuleHeader
        rule={rule}
        isOpen={isCardOpen}
        onDrag={onDrag}
        onClick={onClick}
        isDragging={isDragging}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
      <div
        className={[
          `transition-[max-height] duration-${DETAIL_ANIM_MS} ease-in-out overflow-hidden`,
          isDetailsOpen ? "max-h-[1000px]" : "max-h-0",
        ].join(" ")}
      >
        <RuleDetails rule={rule} />
      </div>
    </MotionCard>
  );
};

interface RuleHeaderProps {
  rule: Rule;
  isOpen: boolean;
  onClick: () => void;
  onDrag: DragControls;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const RuleHeader = ({
  rule,
  isOpen,
  onClick,
  onDrag,
  isDragging,
  onDragStart,
  onDragEnd,
}: RuleHeaderProps) => {
  const { toggleEnable } = useRulesDispatch();
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
          "border-r border-stone-100",
          isDragging
            ? "translate-y-0 shadow-inner border-b-[0px]"
            : "hover:shadow-md hover:border-b-[2px]",
          isOpen
            ? "pointer-events-none cursor-default"
            : "pointer-events-auto cursor-grab",
        ].join(" ")}
        animate={{
          width: isOpen ? 0 : 35,
          opacity: isOpen ? 0 : 1,
        }}
        transition={{
          width: { duration: 0.2, ease: "easeInOut" },
          opacity: { duration: 0.12, ease: "easeOut" },
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          onDrag.start(e);
          onDragStart();
        }}
        onPointerUp={() => {
          onDragEnd();
        }}
      >
        <GripVertical className="text-stone-400" size="30" />
      </motion.div>

      <div
        className={"flex justify-between items-center py-6 ms-2"}
        onClick={onClick}
      >
        <div className="font-bold ml-2 text-stone-700">{rule.name}</div>

        <div className="flex gap-4 items-center">
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
          <ChevronRight className="text-stone-700" />
        </div>
      </div>
    </div>
  );
};

interface RuleDetailsProps {
  rule: Rule;
}

const RuleDetails = ({ rule }: RuleDetailsProps) => {
  const { removeRule } = useRulesDispatch();
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-semibold text-stone-800 mb-4">
            {rule.name}
          </div>
          <div className="space-y-2 text-sm text-stone-600">
            <div>
              <span className="font-semibold">ID:</span> {rule.id}
            </div>
            <div>
              <span className="font-semibold">状態:</span>{" "}
              {rule.enabled ? "有効" : "無効"}
            </div>
            <div>
              <span className="font-semibold">ドメイン:</span>{" "}
              {rule.domains.join(", ")}
            </div>
            <div>
              <span className="font-semibold">保存先:</span>{" "}
              {rule.actions.pathTemplate}
            </div>
            {rule.conditions && rule.conditions.length > 0 && (
              <div>
                <span className="font-semibold">条件:</span>{" "}
                {rule.conditions.length}件
              </div>
            )}
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`ルール「${rule.name}」を削除しますか？`)) {
              removeRule(rule.id);
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          削除
        </Button>
      </div>
    </div>
  );
};

export default RuleListRowCard;
