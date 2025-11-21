import { Card } from "@/components/ui/card";
import type { Rule } from "@/schemas/rules";
import { Switch } from "@/components/ui/switch";
import { ChevronRight } from "lucide-react";
import { DragControls, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";

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
        "bg-background cursor-pointer gap-0 p-0",
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
        <div className="font-bold ml-2">{rule.name}</div>

        <div className="flex gap-4 items-center">
          <Switch className="cursor-pointer" checked={rule.enabled} />
          <ChevronRight />
        </div>
      </div>
    </div>
  );
};

interface RuleDetailsProps {
  rule: Rule;
}

const RuleDetails = ({ rule }: RuleDetailsProps) => {
  return (
    <div className="p-4">
      <div className="mb-2 font-semibold">Rule Details</div>
      <div>ID: {rule.id}</div>
      <div>Name: {rule.name}</div>
      <div>Enabled: {rule.enabled ? "Yes" : "No"}</div>
      {/* Add more rule details as needed */}
    </div>
  );
};

export default RuleListRowCard;
