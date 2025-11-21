import { Card } from "@/components/ui/card";
import type { Rule } from "@/schemas/rules";
import { Switch } from "@/components/ui/switch";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const MotionCard = motion(Card);

interface RuleListRowCardProps {
  rule: Rule;
  onClick?: () => void;
  isOpen?: boolean;
}

const CARD_ANIM_MS = 300;
const DETAIL_ANIM_MS = 200;

const RuleListRowCard = (props: RuleListRowCardProps) => {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    if (props.isOpen) {
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
  }, [props.isOpen]);

  return (
    <MotionCard
      layout
      onClick={() => {
        console.log(`Clicked on rule: ${props.rule.name}`);
        props.onClick?.();
      }}
      className={[
        "bg-background cursor-pointer gap-0",
        isCardOpen
          ? "fixed inset-x-4 top-16 z-50 mx-auto max-w-3xl shadow-lg flex flex-col overflow-hidden z-50"
          : "w-full",
      ].join(" ")}
      transition={{
        layout: { duration: CARD_ANIM_MS / 1000, ease: "easeInOut" },
      }}
    >
      <RuleHeader rule={props.rule} onClickClose={undefined} />
      <div
        className={[
          `transition-[max-height] duration-${DETAIL_ANIM_MS} ease-in-out overflow-hidden`,
          isDetailsOpen ? "max-h-[1000px]" : "max-h-0",
        ].join(" ")}
      >
        <RuleDetails rule={props.rule} />
      </div>
    </MotionCard>
  );
};

interface RuleHeaderProps {
  rule: Rule;
  onClickClose?: (() => void) | undefined;
}

const RuleHeader = ({ rule, onClickClose }: RuleHeaderProps) => {
  return (
    <div className="px-4 flex justify-between items-center">
      <div className="font-bold">{rule.name}</div>
      <div className="flex gap-4 items-center">
        <Switch className="cursor-pointer" checked={rule.enabled} />
        <ChevronRight />
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
